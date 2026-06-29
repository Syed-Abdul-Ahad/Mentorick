import { HiStar, HiOutlineStar } from 'react-icons/hi2';

const StarRating = ({
  value = 0,
  onChange,
  size = 'md',
  readOnly = false,
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const starClass = `${sizeClass} ${filled ? 'text-amber-400' : 'text-gray-300'}`;

        if (readOnly) {
          return filled ? (
            <HiStar key={star} className={starClass} />
          ) : (
            <HiOutlineStar key={star} className={starClass} />
          );
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`transition-colors hover:text-amber-300 ${starClass}`}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            {filled ? <HiStar /> : <HiOutlineStar />}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
