import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiOutlineStar, HiOutlineArrowLeft } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { reviewService, mentorService } from '../../api';
import { useUser } from '../../store/hooks';
import MainLayout from '../../components/layout/MainLayout';
import ReviewCard from '../../components/reviews/ReviewCard';
import ReviewForm from '../../components/reviews/ReviewForm';
import StarRating from '../../components/reviews/StarRating';
import Seo from '../../components/seo/Seo';
import JsonLd from '../../components/seo/JsonLd';
import { buildBreadcrumbSchema } from '../../utils/structuredData';

const MentorReviewsPage = () => {
  const { id: mentorId } = useParams();
  const user = useUser();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, reviewCount: 0 });
  const [mentorName, setMentorName] = useState('Mentor');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, hasMore: false, total: 0 });

  const canReview = Boolean(user && user._id !== mentorId && user.id !== mentorId);

  const fetchReviews = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await reviewService.getMentorReviews(mentorId, { page, limit: 10 });
      setStats(response.stats || { averageRating: 0, reviewCount: 0 });
      setPagination(response.pagination || { page: 1, hasMore: false, total: 0 });
      setReviews((current) => (append ? [...current, ...(response.reviews || [])] : response.reviews || []));
    } catch (error) {
      toast.error(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [mentorId]);

  useEffect(() => {
    const fetchMentorName = async () => {
      try {
        const profile = await mentorService.getMentorById(mentorId);
        if (profile?.fullName) {
          setMentorName(profile.fullName);
        }
      } catch (error) {
        console.error('Failed to fetch mentor name:', error);
      }
    };

    fetchMentorName();
  }, [mentorId]);

  const handleSubmitReview = async ({ rating, comment }) => {
    try {
      setSubmitting(true);
      const response = await reviewService.createReview({
        mentorId,
        rating,
        comment,
      });

      setStats(response.stats);
      setReviews((current) => [response.review, ...current]);
      setPagination((current) => ({
        ...current,
        total: (current.total || 0) + 1,
      }));
      toast.success('Review submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (!pagination.hasMore || loadingMore) {
      return;
    }

    await fetchReviews(pagination.page + 1, true);
  };

  return (
    <MainLayout>
      <Seo
        title={`${mentorName} Reviews | Mentorick`}
        description={`Read reviews and ratings for ${mentorName} on Mentorick.`}
        canonical={`/mentor/${mentorId}/reviews`}
        image="/seo/og-mentor-default.svg"
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Mentors', path: '/mentors' },
          { name: mentorName, path: `/mentor/${mentorId}` },
          { name: 'Reviews', path: `/mentor/${mentorId}/reviews` },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to={`/mentor/${mentorId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Reviews</h1>
          <p className="mt-1 text-gray-500">Ratings and feedback for {mentorName}</p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5">
              <HiOutlineStar className="h-5 w-5 text-amber-400" />
              <span className="text-lg font-bold text-gray-900">
                {stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : 'New'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {stats.reviewCount} review{stats.reviewCount === 1 ? '' : 's'}
            </p>
          </div>
          {stats.reviewCount > 0 && (
            <div className="mt-2">
              <StarRating value={Math.round(stats.averageRating)} readOnly size="sm" />
            </div>
          )}
        </div>

        {canReview ? (
          <div className="mb-8">
            <ReviewForm onSubmit={handleSubmitReview} submitting={submitting} />
          </div>
        ) : !user ? (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600">
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Log in
            </Link>
            {' '}to share your experience with this mentor.
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>

            {pagination.hasMore && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading...' : 'Load more reviews'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="text-gray-600">No reviews yet. Be the first to share your experience.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MentorReviewsPage;
