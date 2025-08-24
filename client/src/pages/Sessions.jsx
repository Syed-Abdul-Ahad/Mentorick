import { useUser } from '../store/hooks';
import { Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import NewSessionSettings from '../components/booking/NewSessionSettings';

const Sessions = () => {
  const user = useUser();

  // Only mentors can access this page
  if (user?.role !== 'mentor') {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <div className="p-6">
        <NewSessionSettings />
      </div>
    </MainLayout>
  );
};

export default Sessions;
