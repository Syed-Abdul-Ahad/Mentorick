import { useSelector, useDispatch } from 'react-redux';

// Simple hooks - only essential ones
export const useAppDispatch = () => useDispatch();

// Auth hooks
export const useAuth = () => useSelector((state) => state.auth);
export const useUser = () => useSelector((state) => state.auth.user);
export const useIsAuthenticated = () => useSelector((state) => state.auth.isAuthenticated);
