import { useEffect, useRef, useState } from 'react';
import Button from './Button';

const PayPalCheckout = ({
  amount,
  currency,
  onCreateOrder,
  onApprove,
  onCancel,
  onError,
  className = '',
  helperText = 'Complete your payment securely with PayPal.',
  retryLabel = 'Retry PayPal',
}) => {
  const containerRef = useRef(null);
  const createOrderRef = useRef(onCreateOrder);
  const approveRef = useRef(onApprove);
  const cancelRef = useRef(onCancel);
  const errorRef = useRef(onError);
  const [sdkState, setSdkState] = useState('loading');
  const [checkoutState, setCheckoutState] = useState('idle');
  const [message, setMessage] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    createOrderRef.current = onCreateOrder;
  }, [onCreateOrder]);

  useEffect(() => {
    approveRef.current = onApprove;
  }, [onApprove]);

  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    errorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

    if (!clientId) {
      setSdkState('error');
      setMessage('Missing PayPal client ID.');
      return undefined;
    }

    if (window.paypal) {
      setSdkState('ready');
      return undefined;
    }

    const scriptId = `paypal-sdk-${currency || 'default'}`;
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency || 'USD'}&intent=capture&components=buttons`;
      script.async = true;
      script.onload = () => setSdkState('ready');
      script.onerror = () => {
        setSdkState('error');
        setMessage('Unable to load PayPal checkout.');
      };
      document.body.appendChild(script);
    } else if (window.paypal) {
      setSdkState('ready');
    }

    return undefined;
  }, [currency, retryNonce]);

  useEffect(() => {
    if (sdkState !== 'ready' || !containerRef.current || !window.paypal) {
      return undefined;
    }

    containerRef.current.innerHTML = '';

    const buttons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 48,
      },
      createOrder: async () => {
        try {
          setMessage('');
          setCheckoutState('processing');
          return await createOrderRef.current();
        } catch (error) {
          const errorMessage = error?.message || 'Unable to start PayPal checkout.';
          setCheckoutState('error');
          setMessage(errorMessage);
          errorRef.current?.(error);
          throw error;
        }
      },
      onApprove: async (data, actions) => {
        try {
          setCheckoutState('processing');
          await approveRef.current(data, actions);
          setCheckoutState('success');
          setMessage('Payment completed successfully.');
        } catch (error) {
          const errorMessage = error?.message || 'Unable to complete PayPal payment.';
          setCheckoutState('error');
          setMessage(errorMessage);
          errorRef.current?.(error);
          throw error;
        }
      },
      onCancel: () => {
        setCheckoutState('idle');
        setMessage('Payment was cancelled.');
        cancelRef.current?.();
      },
      onError: (error) => {
        const errorMessage = error?.message || 'PayPal checkout failed.';
        setCheckoutState('error');
        setMessage(errorMessage);
        errorRef.current?.(error);
      },
    });

    buttons.render(containerRef.current);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [sdkState, retryNonce]);

  const handleRetry = () => {
    setMessage('');
    setCheckoutState('idle');
    setSdkState('loading');
    setRetryNonce((value) => value + 1);
  };

  if (sdkState === 'error') {
    return (
      <div className={`space-y-3 ${className}`}>
        {message && <p className="text-sm text-red-700">{message}</p>}
        <Button variant="outline" onClick={handleRetry} className="w-full">
          {retryLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {amount !== undefined && amount !== null && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <span className="font-medium text-gray-900">Total:</span> {amount} {currency}
        </div>
      )}

      <p className="text-sm text-gray-600">{helperText}</p>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            checkoutState === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : checkoutState === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-gray-200 bg-gray-50 text-gray-700'
          }`}
        >
          {message}
        </div>
      )}

      {sdkState === 'loading' && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600">
          <div className="mr-3 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600" />
          Loading PayPal checkout...
        </div>
      )}

      <div ref={containerRef} />
    </div>
  );
};

export default PayPalCheckout;