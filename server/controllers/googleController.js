const { google } = require('googleapis');
const GoogleToken = require('../models/GoogleToken');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);


exports.googleAuth = (req, res) => {
  const mentorId = req.user._id.toString();
  console.log('Mentor ID for Google Auth:', mentorId);
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI, // 🔴 REQUIRED
    state: mentorId
  });

  res.redirect(url);
};


exports.googleCallback = async (req, res, next) => {
  try {
    const { code, state: mentorId } = req.query;
    console.log(code, mentorId);

    if (!mentorId) {
      return res.status(400).send('Missing mentor ID');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    await GoogleToken.findOneAndUpdate(
      { user: mentorId },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date)
      },
      { upsert: true }
    );

    return res.redirect(`${process.env.CLIENT_URL}/sessions?connected=true`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Google auth failed');
  }
};


exports.getGoogleStatus = async (req, res) => {
  const token = await GoogleToken.findOne({ user: req.user._id });
  console.log('Google Token found:', !!token);

  return res.status(200).json({
    connected: !!token
  });
};

