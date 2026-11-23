import { HiX } from 'react-icons/hi';
import Button from '../shared/Button';

const MegaSessionJoinConfirmModal = ({
  isOpen,
  session,
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !session) return null;

  const priceLabel =
    session.price?.amount != null
      ? `${session.price.amount} ${session.price.currency || 'USD'}`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
      onClick={loading ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mega-join-confirm-title"
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-violet-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <HiX className="w-5 h-5" />
        </button>

        <div className="h-1 bg-gradient-to-r from-violet-500 via-violet-400 to-violet-200 rounded-t-2xl" />

        <div className="p-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-1">
            Reserve your seat
          </p>
          <h2 id="mega-join-confirm-title" className="text-xl font-bold text-gray-900 pr-8">
            Join this mega session?
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium text-gray-800">{session.title}</span>
            {session.mentorProfile?.fullName
              ? ` with ${session.mentorProfile.fullName}`
              : ''}
          </p>

          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900 space-y-2">
            <p>
              Confirming will <span className="font-semibold">reserve a seat for 30 minutes</span>{' '}
              while you transfer payment and upload a screenshot.
            </p>
            <p>
              If you do not complete payment in time, the reservation expires and the seat opens
              for others again.
            </p>
            {priceLabel && (
              <p>
                Seat price:{' '}
                <span className="font-semibold tabular-nums">{priceLabel}</span>
              </p>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <Button
              className="w-full !bg-gradient-to-r !from-violet-600 !to-indigo-600 hover:!from-violet-700 hover:!to-indigo-700 !border-0"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Reserving…' : 'Confirm & continue to payment'}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaSessionJoinConfirmModal;
