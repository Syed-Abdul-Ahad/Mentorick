import { useUser } from '../store/hooks';
import { Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import MyBookings from '../components/booking/MyBookings';
import Seo from '../components/seo/Seo';

const MyBookingsPage = () => {
  const user = useUser();

  // Only authenticated users can access this page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Seo
        title="My Bookings | Mentorick"
        description="View and manage your mentorship bookings on Mentorick."
        canonical="/my-bookings"
        noindex
      />
      <MyBookings />
    </MainLayout>
  );
};

export default MyBookingsPage;
