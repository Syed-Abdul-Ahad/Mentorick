# API Client Setup

This project uses a cookie-based authentication system with axios for API communication.

## Key Features

### Cookie-Based Authentication
- **No localStorage**: Tokens are stored in httpOnly cookies set by the server
- **Automatic cookie handling**: `withCredentials: true` ensures cookies are sent with every request
- **Secure**: httpOnly cookies prevent XSS attacks and are more secure than localStorage

### Axios Configuration
- Base URL from environment variables
- 10-second timeout
- Automatic cookie inclusion
- Error handling for 401 responses

## API Services Structure

### Base ApiService Class
Generic CRUD operations that can be extended for specific entities:
- `getAll(params)` - GET all items with optional query parameters
- `getById(id)` - GET single item by ID
- `create(data)` - POST new item
- `update(id, data)` - PUT update item
- `patch(id, data)` - PATCH partial update
- `delete(id)` - DELETE item

### AuthService
Handles authentication operations:
- `login(credentials)` - Login with email/password
- `register(userData)` - Register new user
- `logout()` - Logout and clear session
- `getMe()` - Get current logged in user (GET /api/auth/me)
- `updatePassword(passwordData)` - Update password
- `forgotPassword(email)` - Request password reset
- `resetPassword(resetData)` - Reset password with token

### UserService
Handles user profile operations:
- `getProfile(userId)` - Get user profile
- `updateProfile(userId, profileData)` - Update user profile

## Server Requirements

For this setup to work, your backend server must:

1. **Set httpOnly cookies** when user logs in:
   ```javascript
   res.cookie('token', jwtToken, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'strict',
     maxAge: 24 * 60 * 60 * 1000 // 24 hours
   });
   ```

2. **Enable CORS with credentials**:
   ```javascript
   app.use(cors({
     origin: 'http://localhost:5173', // Your frontend URL
     credentials: true
   }));
   ```

3. **Clear cookies on logout**:
   ```javascript
   res.clearCookie('token');
   ```

4. **Read cookies in middleware**:
   ```javascript
   const token = req.cookies.token;
   // Verify token and attach user to req
   ```

## Environment Variables

Create a `.env` file:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Redux Integration

The authentication state is managed through Redux Toolkit:
- Auth state includes user info and authentication status
- Automatic auth check on app initialization
- Proper loading and error states
- Cookie management handled transparently

## Usage Examples

```javascript
import { authService, userService } from '../api';

// Login
const { user } = await authService.login({ email, password });

// Get current user
const currentUser = await authService.getMe();

// Logout
await authService.logout();
```
