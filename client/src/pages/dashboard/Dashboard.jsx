import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/hooks';
import { clearUser } from '../../store/slices/authSlice';
import { authService } from '../../api';

const Dashboard = () => {
  const user = useUser();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      dispatch(clearUser());
      navigate('/login');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header with logout */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
          <p className="text-gray-600 mb-4">
            Welcome to your dashboard, {user?.firstName || user?.name || user?.email}!
          </p>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium text-blue-800">Total Sessions</h3>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-medium text-green-800">Completed</h3>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-medium text-yellow-800">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
