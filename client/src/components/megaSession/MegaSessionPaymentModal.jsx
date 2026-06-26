import { HiX } from 'react-icons/hi';
import PayPalCheckout from '../shared/PayPalCheckout';

const MegaSessionPaymentModal = ({
  isOpen,
  session,
  onClose,
  onCreateOrder,
  onApprove,
  onCancel,
}) => {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mega-session-payment-title"
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-violet-100"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <HiX className="w-5 h-5" />
        </button>

        <div className="h-1 bg-gradient-to-r from-violet-500 via-violet-400 to-violet-200 rounded-t-2xl" />

        <div className="p-6">
          <div className="mb-6 pr-8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-1">
              Exclusive Mega Session
            </p>
            <h2 id="mega-session-payment-title" className="text-xl font-bold text-gray-900">
              {session.title}
            </h2>
            {session.mentorProfile?.fullName && (
              <p className="text-sm text-gray-500 mt-1">with {session.mentorProfile.fullName}</p>
            )}
          </div>

          <PayPalCheckout
            amount={session.price.amount}
            currency={session.price.currency}
            helperText="Pay securely to reserve your seat in this mega session."
            onCreateOrder={onCreateOrder}
            onApprove={onApprove}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default MegaSessionPaymentModal;
