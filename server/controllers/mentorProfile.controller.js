const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const path = require('path');
const paypalService = require('../services/paypalService');

// Currency conversion function using real-time rates
async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    // Use a free exchange rate API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    const rate = data.rates[toCurrency];
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }
    
    return parseFloat((amount * rate).toFixed(2));
  } catch (error) {
    console.error('Currency conversion error:', error);
    
    // Fallback conversion rates (approximate)
    const fallbackRates = {
      'USD-PKR': 280,
      'PKR-USD': 0.0036,
      'EUR-USD': 1.18,
      'USD-EUR': 0.85,
      'EUR-PKR': 330,
      'PKR-EUR': 0.003
    };
    
    const rateKey = `${fromCurrency}-${toCurrency}`;
    const fallbackRate = fallbackRates[rateKey];
    
    if (fallbackRate) {
      return parseFloat((amount * fallbackRate).toFixed(2));
    }
    
    return amount; // Return original amount if no conversion available
  }
}

// Get both USD and PKR prices from any currency
async function getBothCurrencies(amount, originalCurrency) {
  let usdAmount, pkrAmount;

  if (originalCurrency === 'USD') {
    usdAmount = parseFloat(amount);
    pkrAmount = await convertCurrency(amount, 'USD', 'PKR');
  } else if (originalCurrency === 'PKR') {
    pkrAmount = parseFloat(amount);
    usdAmount = await convertCurrency(amount, 'PKR', 'USD');
  } else {
    // Convert from other currency to both USD and PKR
    usdAmount = await convertCurrency(amount, originalCurrency, 'USD');
    pkrAmount = await convertCurrency(amount, originalCurrency, 'PKR');
  }

  return {
    usd: Math.round(usdAmount * 100) / 100, // Round to 2 decimal places
    pkr: Math.round(pkrAmount)
  };
}

// Create or update mentor profile
exports.createOrUpdateMentorProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const data = req.body;
    let headshotUrl = req.body.headshot;
    if (req.file) {
      headshotUrl = `${req.protocol}://${req.get('host')}/uploads/mentors/${req.file.filename}`;
    }

    // Process session durations with real-time currency conversion
    let processedSessionDurations = [];
    if (data.sessionDurations) {
      const sessionData = JSON.parse(data.sessionDurations);
      
      // Convert each session duration to both USD and PKR
      for (const session of sessionData) {
        const convertedPrices = await getBothCurrencies(session.price, session.currency);
        processedSessionDurations.push({
          duration: session.duration,
          priceUSD: convertedPrices.usd,
          pricePKR: convertedPrices.pkr
        });
      }
    }

    // Safely destructure only allowed fields - EXPLICITLY EXCLUDE availability
    const {
      fullName,
      title,
      about,
      idealMentee,
      topics,
      languages,
      donationInfo,
      funFact,
      socialLinks,
      timezone
    } = data;

    const profileData = {
      user: userId,
      headshot: headshotUrl,
      fullName,
      title,
      about,
      idealMentee,
      topics: Array.isArray(topics) ? topics : (topics ? [topics] : []),
      languages: Array.isArray(languages) ? languages : (languages ? [languages] : []),
      sessionDurations: processedSessionDurations,
      donationInfo,
      funFact,
      socialLinks,
      timezone
      // availability is NEVER included here - managed by dedicated endpoints
    };
    
    let profile = await MentorProfile.findOneAndUpdate(
      { user: userId },
      profileData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Get mentor profile by ID (public)
exports.getMentorProfileById = async (req, res, next) => {
  try {
    const profile = await MentorProfile.findOne({ user: req.params.id }).populate('user', 'role');
    if (!profile) return res.status(404).json({ success: false, message: 'Mentor profile not found' });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Get logged-in mentor's profile
exports.getMyMentorProfile = async (req, res, next) => {
  try {
    const profile = await MentorProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // Self-healing: if onboarding is pending or connected is false but we have trackingId
    if (profile.paypal && !profile.paypal.isConnected && profile.paypal.trackingId) {
      try {
        const integrationStatus = await paypalService.getMerchantIntegrationStatus({ trackingId: profile.paypal.trackingId });
        if (integrationStatus && integrationStatus.active) {
          profile.paypal.isConnected = true;
          profile.paypal.merchantId = integrationStatus.merchantId;
          profile.paypal.payments_receivable = true;
          profile.paypal.onboardingPending = false;
          profile.paypal.connectedAt = profile.paypal.connectedAt || new Date();
          await profile.save();
        }
      } catch (verifyError) {
        console.error('Self-healing PayPal verification failed during profile load:', verifyError);
        // Do not fail the request - fail silently and log it
      }
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// Get all mentor profiles (public)
exports.getAllMentorProfiles = async (req, res, next) => {
  try {
    const profiles = await MentorProfile.find({}).populate('user', 'role').sort({ createdAt: -1 });
    res.json({ success: true, data: profiles });
  } catch (err) {
    next(err);
  }
};
