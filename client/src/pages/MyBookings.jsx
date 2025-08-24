import { useUser } from '../store/hooks';
import { Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import BookingManagement from '../components/booking/BookingManagement';

const MyBookings = () => {
  const user = useUser();

  // Only authenticated users can access this page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <BookingManagement />
      </div>
    </MainLayout>
  );
};

export default MyBookings;
