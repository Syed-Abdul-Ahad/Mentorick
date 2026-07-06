const crypto = require('crypto');
const { google } = require('googleapis');
const User = require('../models/User');

const SIGNIN_SCOPES = ['openid', 'email', 'profile'];

const getAuthRedirectUri = () => (
  process.env.GOOGLE_AUTH_REDIRECT_URI
  || `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`
);

const getOAuthClient = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getAuthRedirectUri()
);

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

const encodeState = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64url');

const decodeState = (state) => {
  if (!state) return { role: 'mentee' };

  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    return {
      role: ['mentee', 'mentor'].includes(parsed.role) ? parsed.role : 'mentee',
    };
  } catch {
    return { role: 'mentee' };
  }
};

const setAuthCookie = (res, user) => {
  const token = user.generateAuthToken();

  res.cookie("token", token, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
};


// @desc    Start Google OAuth for login/signup
// @route   GET /api/auth/google/login
// @access  Public
exports.googleLogin = (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      status: 'error',
      message: 'Google sign in is not configured',
    });
  }

  const role = ['mentee', 'mentor'].includes(req.query.role) ? req.query.role : 'mentee';
  const oauth2Client = getOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: SIGNIN_SCOPES,
    prompt: 'select_account',
    state: encodeState({
      role,
      nonce: crypto.randomBytes(16).toString('hex'),
    }),
  });

  res.redirect(url);
};

// @desc    Google OAuth callback for login/signup
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleLoginCallback = async (req, res) => {
  const clientUrl = getClientUrl();

  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${clientUrl}/login?error=google_auth_cancelled`);
    }

    if (!code) {
      return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }

    const { role } = decodeState(state);
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile?.email || !profile?.id) {
      return res.redirect(`${clientUrl}/login?error=google_no_email`);
    }

    const googleId = profile.id;
    const email = profile.email.toLowerCase().trim();

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      if (!user.isActive) {
        return res.redirect(`${clientUrl}/login?error=account_deactivated`);
      }

      if (!user.googleId) {
        user.googleId = googleId;
      }

      user.isEmailVerified = true;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      const firstName = (profile.given_name || profile.name || 'User').trim().split(' ')[0] || 'User';
      const lastName = (profile.family_name || profile.name || '')
        .replace(firstName, '')
        .trim()
        || 'User';

      user = await User.create({
        firstName,
        lastName,
        email,
        googleId,
        authProvider: 'google',
        role,
        isEmailVerified: true,
        lastLogin: new Date(),
      });
    }

    setAuthCookie(res, user);
    return res.redirect(`${clientUrl}/auth/google/callback`);
  } catch (err) {
    console.error('Google login callback error:', err);
    return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
  }
};
