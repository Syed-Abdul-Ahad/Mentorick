# Mentorick Server

A comprehensive Express.js REST API server for a mentoring platform with MongoDB integration.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete user CRUD operations with profile management
- **Mentor System**: Mentor profiles with expertise, availability, and pricing
- **Session Management**: Booking, scheduling, and management of mentoring sessions
- **Review System**: Rating and feedback system for mentors
- **Security**: Helmet, rate limiting, CORS, input validation
- **Database**: MongoDB with Mongoose ODM
- **Error Handling**: Centralized error handling with custom middleware
- **Validation**: Request validation using express-validator
- **Logging**: Morgan for HTTP request logging

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Logging**: morgan
- **Development**: nodemon

## Project Structure

```
server/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management logic
│   ├── mentorController.js  # Mentor management logic
│   └── sessionController.js # Session management logic
├── middleware/
│   ├── auth.js             # Authentication & authorization middleware
│   ├── errorHandler.js     # Global error handling middleware
│   ├── notFound.js         # 404 handler middleware
│   └── validation.js       # Request validation middleware
├── models/
│   ├── User.js             # User schema and model
│   ├── Mentor.js           # Mentor schema and model
│   ├── Session.js          # Session schema and model
│   └── Review.js           # Review schema and model
├── routes/
│   ├── authRoutes.js       # Authentication routes
│   ├── userRoutes.js       # User management routes
│   ├── mentorRoutes.js     # Mentor management routes
│   └── sessionRoutes.js    # Session management routes
├── app.js                  # Express app configuration
├── server.js               # Server entry point
├── package.json            # Dependencies and scripts
└── .env.example           # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mentorick/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mentorick
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:5173
   BANK_ACCOUNT_TITLE=Mentorick LLC
   BANK_NAME=Your Bank Name
   BANK_ACCOUNT_NUMBER=0000000000
   PAYMENT_PROOF_MINUTES=30
   BOOKING_MIN_LEAD_HOURS=24
   WHATSAPP_SUPPORT_NUMBER=923196943953
   PLATFORM_FEE_RATE=0.30
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password
- `POST /api/auth/forgotpassword` - Forgot password
- `PUT /api/auth/resetpassword/:token` - Reset password

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users/stats` - Get user statistics (Admin only)

### Mentors
- `GET /api/mentors` - Get all mentors (with filtering)
- `GET /api/mentors/:id` - Get single mentor
- `POST /api/mentors` - Create mentor profile
- `PUT /api/mentors/:id` - Update mentor profile
- `DELETE /api/mentors/:id` - Delete mentor profile
- `GET /api/mentors/dashboard` - Get mentor dashboard (Mentor only)
- `GET /api/mentors/:id/availability` - Get mentor availability
- `PUT /api/mentors/:id/availability` - Update mentor availability
- `GET /api/mentors/stats` - Get mentor statistics (Admin only)

### Sessions
- `GET /api/sessions` - Get all sessions (filtered by user role)
- `GET /api/sessions/:id` - Get single session
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/:id` - Update session
- `PUT /api/sessions/:id/cancel` - Cancel session
- `PUT /api/sessions/:id/start` - Start session (Mentor only)
- `PUT /api/sessions/:id/complete` - Complete session (Mentor only)
- `POST /api/sessions/:id/feedback` - Add session feedback
- `GET /api/sessions/stats` - Get session statistics (Admin only)

### Payments
- `GET /api/payments/bank-details` - Bank transfer display details (auth)
- `POST /api/payments/bookings/:id/proof` - Upload payment screenshot
- `POST /api/payments/bookings/:id/verify` - Admin confirm payment (Meet + email)
- `POST /api/payments/bookings/:id/reject` - Admin reject proof
- `GET /api/payments/pending-verifications` - Admin verification queue

## Data Models

### User Model
- Basic user information (name, email, password)
- Role-based access (user, mentor, admin)
- Profile information (bio, location, social links)
- Email verification and password reset functionality

### Mentor Model
- Links to User model
- Expertise areas and skills
- Education and work experience
- Pricing and availability
- Rating and review system
- Verification status

### Session Model
- Links Mentor and Mentee (User)
- Session details (title, description, objectives)
- Scheduling and duration
- Status tracking (scheduled, in-progress, completed, cancelled)
- Pricing and payment information
- Feedback system
- Meeting platform integration

### Review Model
- Links to Session and Mentor
- Rating and comment system
- Public/private visibility
- Mentor response capability

## Security Features

- **Helmet**: Security headers
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Request validation using express-validator
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Different access levels for users, mentors, and admins

## Error Handling

The API uses centralized error handling with custom error middleware that:
- Handles different types of errors (validation, authentication, database)
- Provides consistent error response format
- Logs errors in development mode
- Sanitizes error messages in production

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (when implemented)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Style

The project follows standard JavaScript conventions and uses:
- ESLint for code linting
- Prettier for code formatting
- Consistent naming conventions
- Modular architecture

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/mentorick |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRE | JWT expiration time | 30d |
| CLIENT_URL | Frontend application URL | http://localhost:3000 |

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

This project is licensed under the MIT License..
