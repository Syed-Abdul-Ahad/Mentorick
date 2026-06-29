import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineXMark } from 'react-icons/hi2';
import StarRating from './StarRating';

const COMMENT_PREVIEW_LIMIT = 70;

const formatReviewDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const ReviewCommentModal = ({ isOpen, onClose, comment, reviewerName, rating, createdAt }) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close review"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-comment-title"
        className="relative flex w-full max-w-md max-h-[min(85vh,520px)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <HiOutlineXMark className="h-5 w-5" />
        </button>

        <div className="shrink-0 border-b border-gray-100 px-5 pb-4 pt-5 pr-12">
          <p id="review-comment-title" className="font-semibold text-gray-900">
            {reviewerName}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={rating} readOnly size="sm" />
            <span className="text-xs text-gray-400">{formatReviewDate(createdAt)}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4 [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">
            {comment}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ReviewCard = ({ review }) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const reviewerName = review.reviewer?.fullName || 'Anonymous User';
  const reviewerInitial = reviewerName.charAt(0).toUpperCase();
  const hasLongComment = review.comment && review.comment.length > COMMENT_PREVIEW_LIMIT;

  return (
    <>
      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary-100 ring-2 ring-white">
            {review.reviewer?.headshot ? (
              <img
                src={review.reviewer.headshot}
                alt={reviewerName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary-500 text-sm font-semibold text-white">
                {reviewerInitial}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{reviewerName}</p>
                <p className="mt-0.5 text-xs text-gray-400">{formatReviewDate(review.createdAt)}</p>
              </div>
              <StarRating value={review.rating} readOnly size="sm" />
            </div>

            {review.comment ? (
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {hasLongComment
                  ? `${review.comment.slice(0, COMMENT_PREVIEW_LIMIT)}... `
                  : review.comment}
                {hasLongComment && (
                  <button
                    type="button"
                    onClick={() => setShowFullComment(true)}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    Read more
                  </button>
                )}
              </p>
            ) : (
              <p className="mt-3 text-sm italic text-gray-400">No written review provided.</p>
            )}
          </div>
        </div>
      </article>

      <ReviewCommentModal
        isOpen={showFullComment}
        onClose={() => setShowFullComment(false)}
        comment={review.comment}
        reviewerName={reviewerName}
        rating={review.rating}
        createdAt={review.createdAt}
      />
    </>
  );
};

export default ReviewCard;
