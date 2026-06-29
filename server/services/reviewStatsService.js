const mongoose = require('mongoose');
const Review = require('../models/Review');
const MentorProfile = require('../models/MentorProfile');

const isDailyLimitEnabled = () => process.env.REVIEW_DAILY_LIMIT_ENABLED !== 'false';

const getDailyLimitMax = () => {
  const parsed = parseInt(process.env.REVIEW_DAILY_LIMIT_MAX || '2', 10);
  return Number.isNaN(parsed) || parsed < 1 ? 2 : parsed;
};

const getStartOfUtcDay = () => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

const syncMentorReviewStats = async (mentorId) => {
  const mentorObjectId = mentorId instanceof mongoose.Types.ObjectId
    ? mentorId
    : new mongoose.Types.ObjectId(mentorId);

  const [stats] = await Review.aggregate([
    { $match: { mentor: mentorObjectId, isPublic: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats?.averageRating
    ? Math.round(stats.averageRating * 10) / 10
    : 0;
  const reviewCount = stats?.reviewCount || 0;

  await MentorProfile.findOneAndUpdate(
    { user: mentorObjectId },
    { averageRating, reviewCount },
    { new: true }
  );

  return { averageRating, reviewCount };
};

module.exports = {
  isDailyLimitEnabled,
  getDailyLimitMax,
  getStartOfUtcDay,
  syncMentorReviewStats,
};
