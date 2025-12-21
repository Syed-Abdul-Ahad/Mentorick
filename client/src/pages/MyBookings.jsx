import { useUser } from '../store/hooks';
import { Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import MyBookings from '../components/booking/MyBookings';

const MyBookingsPage = () => {
  const user = useUser();

  // Only authenticated users can access this page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <MyBookings />
    </MainLayout>
  );
};

export default MyBookingsPage;
