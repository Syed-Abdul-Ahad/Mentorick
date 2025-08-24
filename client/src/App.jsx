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
import Signup from "./pages/signup/Signup";
import MentorSignup from "./pages/signup/MentorSignup";
import Dashboard from "./pages/dashboard/Dashboard";
import Sessions from "./pages/Sessions";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import MentorProfileForm from "./pages/profile/MentorProfileForm";
import MentorPublicProfile from "./pages/profile/MentorPublicProfile";
import Homepage from "./pages/Homepage";
import Mentors from "./pages/Mentors";
import MegaSessions from "./components/mega-sessions/MegaSessions";

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
      <Routes>
        {/* Public routes */}
        <Route path="/" 
          //   element={
          //   isAuthenticated ? <Homepage /> : <Navigate to="/login" />
          // }
          element={<Homepage />}
        />
        <Route path="/mentors" element={<Mentors />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <Login />
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
        {/* Mentor profile edit (mentor only) */}
        <Route
          path="/profile/edit"
          element={
            isAuthenticated && user?.role === 'mentor' ? <MentorProfileForm /> : <Navigate to="/login" />
          }
        />
        {/* Mentor public profile */}
        <Route path="/mentor/:id" element={<MentorPublicProfile />} />

        {/* Default redirects */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Homepage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/mega-session"
          element={<MegaSessions />}
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
