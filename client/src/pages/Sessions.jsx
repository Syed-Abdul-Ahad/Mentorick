import { useUser } from '../store/hooks';
import { Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AvailabilityPage from '../components/booking/AvailabilityPage';

const Sessions = () => {
  const user = useUser();

  // Only mentors can access this page
  if (user?.role !== 'mentor') {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <AvailabilityPage />
    </MainLayout>
  );
};

export default Sessions;
