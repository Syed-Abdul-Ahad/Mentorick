import "./index.css";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from "./store";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useIsAuthenticated, useUser } from "./store/hooks";
import { setUser, clearUser } from "./store/slices/authSlice";
import axios from "axios";
import Login from "./pages/login/Login";
import ResetPassword from "./pages/login/ResetPassword";
import Signup from "./pages/signup/Signup";
import MentorSignup from "./pages/signup/MentorSignup";
import Dashboard from "./pages/dashboard/Dashboard";
import Sessions from "./pages/Sessions";
import MyBookings from "./pages/MyBookings";
import MegaSessions from "./pages/MegaSessions";
import AdminMegaSessions from "./pages/admin/AdminMegaSessions";
import NotFound from "./pages/NotFound";
import MentorProfileForm from "./pages/profile/MentorProfileForm";
import MenteeProfileForm from "./pages/profile/MenteeProfileForm";
import MentorPublicProfile from "./pages/profile/MentorPublicProfile";
import MentorReviewsPage from "./pages/profile/MentorReviewsPage";
import Homepage from "./pages/Homepage";
import Mentors from "./pages/Mentors";
import OurWhy from "./pages/OurWhy";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Contact from "./pages/legal/Contact";
import GoogleCallback from "./pages/auth/GoogleCallback";
import Toast from "./components/shared/Toast";

function AuthenticatedApp() {
  const dispatch = useDispatch();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(isAuthenticated, "isAuthenticated before checkAuth");
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
          withCredentials: true
        });
        const user = response.data.data.user;
        console.log("User found:", user);
        if(user){
          dispatch(setUser(user));
          console.log("User set in Redux");
        }
      } catch (error) {
        // User not authenticated, that's fine
        console.log("Not authenticated:", error.message);
        dispatch(clearUser()); // Explicitly clear user
      } finally {
        setLoading(false);
        console.log("Loading set to false");
      }
    };

    checkAuth();
  }, [dispatch]);

  console.log(isAuthenticated, "isAuthenticated after checkAuth");
  console.log("Current loading state:", loading);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log("Rendering routes with isAuthenticated:", isAuthenticated);

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/our-why" element={<OurWhy />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <Login />
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            isAuthenticated ? <Navigate to="/" /> : <ResetPassword />
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/" /> : <Signup />
          }
        />
        <Route
          path="/mentor-signup"
          element={
            isAuthenticated ? <Navigate to="/" /> : <MentorSignup />
          }
        />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
          }
        />
        {/* Sessions page (mentor only) */}
        <Route
          path="/sessions"
          element={
            isAuthenticated ? <Sessions /> : <Navigate to="/login" />
          }
        />
        {/* My Bookings page (both mentors and mentees) */}
        <Route
          path="/my-bookings"
          element={
            isAuthenticated ? <MyBookings /> : <Navigate to="/login" />
          }
        />
        {/* Profile edit - different forms based on user role */}
        <Route
          path="/profile/edit"
          element={
            isAuthenticated ? (
              user?.role === 'mentor' ? <MentorProfileForm /> :
              user?.role === 'mentee' ? <MenteeProfileForm /> :
              <Navigate to="/login" />
            ) : <Navigate to="/login" />
          }
        />
        {/* Mentor public profile */}
        <Route path="/mentor/:id" element={<MentorPublicProfile />} />
        <Route path="/mentor/:id/reviews" element={<MentorReviewsPage />} />
        
        {/* Mega Sessions (public for mentees) */}
        <Route 
          path="/mega-sessions" 
          element={
            isAuthenticated ? <MegaSessions /> : <Navigate to="/login" />
          } 
        />

        {/* Admin routes */}
        <Route
          path="/admin/mega-sessions"
          element={
            isAuthenticated && user?.role === 'admin' ? <AdminMegaSessions /> : <Navigate to="/login" />
          }
        />


        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AuthenticatedApp />
    </Provider>
  );
}

export default App;
