const { google } = require('googleapis');
const GoogleToken = require('../models/GoogleToken');

const getAuthClient = async (mentorId) => {
  const token = await GoogleToken.findOne({ user: mentorId });
  if (!token) throw new Error('Mentor has not connected Google Calendar');

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiryDate
  });

  return client;
};

exports.createCalendarEvent = async ({
  mentorId,
  mentorEmail,
  menteeEmail,
  startUTC,
  endUTC
}) => {
  const auth = await getAuthClient(mentorId);
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: 'Mentorship Session',
      description: 'Mentor–Mentee 1:1 Session',
      start: { dateTime: startUTC.toISOString() },
      end: { dateTime: endUTC.toISOString() },
      attendees: [
        { email: mentorEmail },
        { email: menteeEmail }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`
        }
      }
    }
  });

  return {
    meetingLink: response.data.conferenceData.entryPoints[0].uri,
    calendarEventId: response.data.id
  };
};
