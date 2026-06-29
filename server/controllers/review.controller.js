const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');
const MenteeProfile = require('../models/MenteeProfile');
const {
  isDailyLimitEnabled,
  getDailyLimitMax,
  getStartOfUtcDay,
  syncMentorReviewStats,
} = require('../services/reviewStatsService');

const formatReviewer = (menteeDoc, menteeProfile) => ({
  _id: menteeDoc?._id,
  firstName: menteeDoc?.firstName || '',
  lastName: menteeDoc?.lastName || '',
  fullName: menteeProfile?.fullName || `${menteeDoc?.firstName || ''} ${menteeDoc?.lastName || ''}`.trim(),
  headshot: menteeProfile?.headshot || null,
});

const serializeReview = (review, menteeProfileMap = {}) => {
  const menteeId = review.mentee?._id?.toString() || review.mentee?.toString();
  const menteeProfile = menteeProfileMap[menteeId];

  return {
    _id: review._id,
    rating: review.rating,
    comment: review.comment || '',
    createdAt: review.createdAt,
    reviewer: formatReviewer(review.mentee, menteeProfile),
  };
};

const buildMenteeProfileMap = async (reviews) => {
  const menteeIds = [
    ...new Set(
      reviews
        .map((review) => review.mentee?._id?.toString() || review.mentee?.toString())
        .filter(Boolean)
    ),
  ];

  if (!menteeIds.length) {
    return {};
  }

  const profiles = await MenteeProfile.find({ user: { $in: menteeIds } }).select('user fullName headshot');
  return profiles.reduce((acc, profile) => {
    acc[profile.user.toString()] = profile;
    return acc;
  }, {});
};

exports.createReview = async (req, res, next) => {
  try {
    const { mentorId, rating, comment } = req.body;

    if (!mentorId || !mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ success: false, message: 'A valid mentor ID is required' });
    }

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5 || !Number.isInteger(parsedRating)) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
    }

    if (req.user._id.toString() === mentorId) {
      return res.status(403).json({ success: false, message: 'You cannot review yourself' });
    }

    const mentorUser = await User.findById(mentorId);
    if (!mentorUser || mentorUser.role !== 'mentor') {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({ success: false, message: 'Comment cannot exceed 1000 characters' });
    }

    if (isDailyLimitEnabled()) {
      const dailyCount = await Review.countDocuments({
        mentor: mentorId,
        mentee: req.user._id,
        createdAt: { $gte: getStartOfUtcDay() },
      });

      if (dailyCount >= getDailyLimitMax()) {
        return res.status(429).json({
          success: false,
          message: `You can review this mentor at most ${getDailyLimitMax()} times per day`,
        });
      }
    }

    const review = await Review.create({
      mentor: mentorId,
      mentee: req.user._id,
      rating: parsedRating,
      comment: comment?.trim() || '',
      isPublic: true,
    });

    await review.populate('mentee', 'firstName lastName');
    const menteeProfileMap = await buildMenteeProfileMap([review]);
    const stats = await syncMentorReviewStats(mentorId);

    return res.status(201).json({
      success: true,
      data: {
        review: serializeReview(review, menteeProfileMap),
        stats,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMentorReviewStats = async (req, res, next) => {
  try {
    const { mentorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ success: false, message: 'Invalid mentor ID' });
    }

    const mentorUser = await User.findById(mentorId);
    if (!mentorUser || mentorUser.role !== 'mentor') {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const stats = await syncMentorReviewStats(mentorId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMentorReviews = async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(mentorId)) {
      return res.status(400).json({ success: false, message: 'Invalid mentor ID' });
    }

    const mentorUser = await User.findById(mentorId);
    if (!mentorUser || mentorUser.role !== 'mentor') {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }

    const filter = { mentor: mentorId, isPublic: true };

    const [reviews, total, stats] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('mentee', 'firstName lastName'),
      Review.countDocuments(filter),
      syncMentorReviewStats(mentorId),
    ]);

    const menteeProfileMap = await buildMenteeProfileMap(reviews);

    return res.json({
      success: true,
      data: {
        reviews: reviews.map((review) => serializeReview(review, menteeProfileMap)),
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: skip + reviews.length < total,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
