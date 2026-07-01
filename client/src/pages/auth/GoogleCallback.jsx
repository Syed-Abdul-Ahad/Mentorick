import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../store/slices/authSlice';
import { authService } from '../../api';

const GoogleCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const completeSignIn = async () => {
      try {
        const user = await authService.getMe();
        dispatch(setUser(user));
        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/login?error=google_auth_failed', { replace: true });
      }
    };

    completeSignIn();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        <p className="mt-4 text-gray-600">Completing Google sign in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
