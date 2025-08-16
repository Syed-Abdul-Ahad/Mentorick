import { Toaster } from 'react-hot-toast';

const Toast = () => {
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
        },
        success: {
          duration: 3000,
          style: {
            background: '#10B981',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#EF4444',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
        },
        loading: {
          style: {
            background: '#3B82F6',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#3B82F6',
          },
        },
      }}
    />
  );
};

export default Toast;