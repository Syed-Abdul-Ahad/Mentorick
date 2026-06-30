import { useUser } from '../store/hooks';
import { Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AvailabilityPage from '../components/booking/AvailabilityPage';
import Seo from '../components/seo/Seo';

const Sessions = () => {
  const user = useUser();

  // Only mentors can access this page
  if (user?.role !== 'mentor') {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <Seo
        title="Availability Settings | Mentorick"
        description="Manage your mentor availability on Mentorick."
        canonical="/sessions"
        noindex
      />
      <AvailabilityPage />
    </MainLayout>
  );
};

export default Sessions;
