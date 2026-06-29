import { Link } from 'react-router-dom';
import { HiOutlineStar } from 'react-icons/hi2';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';

const MentorReviewsPreview = ({
  mentorId,
  mentorName,
  stats,
  reviews,
}) => {
  const averageRating = stats?.averageRating || 0;
  const reviewCount = stats?.reviewCount || 0;

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Reviews for {mentorName}</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5">
                <HiOutlineStar className="h-5 w-5 text-amber-400" />
                <span className="text-lg font-bold text-gray-900">
                  {reviewCount > 0 ? averageRating.toFixed(1) : 'New'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {reviewCount} review{reviewCount === 1 ? '' : 's'}
              </p>
            </div>
            {reviewCount > 0 && (
              <div className="mt-2">
                <StarRating value={Math.round(averageRating)} readOnly size="sm" />
              </div>
            )}
          </div>

          <Link
            to={`/mentor/${mentorId}/reviews`}
            className="inline-flex items-center justify-center rounded-lg border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
          >
            {reviewCount > 3 ? 'Show more' : 'View all reviews'}
          </Link>
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <p className="text-gray-600">No reviews yet.</p>
            <Link
              to={`/mentor/${mentorId}/reviews`}
              className="mt-3 inline-flex text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Be the first to review
            </Link>
          </div>
        )}

        {reviewCount > 3 && (
          <div className="mt-8 text-center">
            <Link
              to={`/mentor/${mentorId}/reviews`}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Show all reviews
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default MentorReviewsPreview;
