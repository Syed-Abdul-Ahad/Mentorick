import { useState } from 'react';
import Button from '../shared/Button';
import StarRating from './StarRating';

const ReviewForm = ({ onSubmit, submitting = false }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (rating < 1) {
      return;
    }

    await onSubmit({ rating, comment: comment.trim() });
    setRating(0);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Share your experience</h3>
      <p className="mt-1 text-sm text-gray-500">Rate this mentor and optionally leave a review.</p>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Your rating</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="mt-4">
        <label htmlFor="review-comment" className="mb-2 block text-sm font-medium text-gray-700">
          Review <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value.slice(0, 1000))}
          rows={4}
          placeholder="What was your experience like?"
          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p>
      </div>

      <Button
        type="submit"
        className="mt-4 w-full sm:w-auto"
        disabled={submitting || rating < 1}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
};

export default ReviewForm;
