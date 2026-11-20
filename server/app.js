
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mentorProfileRoutes = require('./routes/mentorProfileRoutes');
const menteeProfileRoutes = require('./routes/menteeProfileRoutes');
const availabilityRoutes = require('./routes/mentorAvailability.routes');
const bookingRoutes = require('./routes/bookingRoutes');
const megaSessionRoutes = require('./routes/megaSessionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const googleRoutes = require('./routes/googleRoutes');
const seoRoutes = require('./routes/seoRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
app.set('trust proxy', true);
app.use(cookieParser());

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting (skip /health so keep-alive pings are never throttled)
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  validate: { trustProxy: false },
  skip: (req) => req.path === '/health',
});
app.use(limiter);

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173' || 'mentorick-blush.vercel.app',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Serve uploads as static with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, require('express').static(require('path').join(__dirname, 'uploads')));

// SEO routes (sitemap, robots) — proxied from client dev server in development
app.use('/', seoRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mentor', mentorProfileRoutes);
app.use('/api/mentee', menteeProfileRoutes);
app.use('/api/mentor/availability', availabilityRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/mega-sessions', megaSessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/auth', googleRoutes);


// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
