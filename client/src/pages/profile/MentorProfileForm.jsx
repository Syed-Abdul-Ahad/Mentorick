import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../../api/axiosConfig';
import Button from '../../components/shared/Button';
// import FormInput from '../../components/shared/FormInput';
import { useSelector } from 'react-redux';
import { FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import { HiOutlineBriefcase, HiOutlineClock, HiOutlineUsers, HiOutlineHeart, HiOutlineChatBubbleBottomCenterText } from 'react-icons/hi2';
import { CiGlobe } from "react-icons/ci";
import toast from 'react-hot-toast';
import Toast from '../../components/shared/Toast';

const initialState = {
  fullName: '',
  title: '',
  about: '',
  idealMentee: '',
  topics: [''],
  sessionDurations: [],
  languages: [],
  donationInfo: '',
  funFact: '',
  headshot: '',
  socialLinks: { linkedin: '', twitter: '', instagram: '' },
};

const sessionOptions = [
  { duration: '30 min', label: '30 min' },
  { duration: '60 min', label: '60 min' },
  { duration: '90 min', label: '90 min' },
];

const currencyOptions = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const languageOptions = [
  'English',
  'Urdu',
  'Hindi',
  'Punjabi',
  'Sindhi',
  'Pashto',
  'Balochi',
  'Saraiki',
  'Kashmiri',
  'Arabic',
  'Persian (Farsi)',
  'Turkish',
  'Chinese (Mandarin)',
  'Bengali',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Gujarati',
  'Marathi',
  'French',
  'German',
  'Spanish',
  'Russian',
  'Japanese',
  'Korean',
  'Malay',
  'Indonesian',
  'Portuguese',
  'Italian',
  'Other'
];

const MentorProfileForm = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const fileInputRef = useRef();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // Prefill form
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/mentor/my-profile');
        if (res.data && res.data.data) {
          setForm({ ...initialState, ...res.data.data, topics: res.data.data.topics.length ? res.data.data.topics : [''] });
          setImagePreview(res.data.data.headshot);
          setSelectedLanguages(res.data.data.languages || []);
        }
      } catch (e) {
        toast.error('Could not load profile');
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'mentor') fetchProfile();
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('socialLinks.')) {
      setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [name.split('.')[1]]: value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleTopicChange = (idx, value) => {
    setForm(f => {
      const topics = [...f.topics];
      topics[idx] = value;
      return { ...f, topics };
    });
  };

  const addTopic = () => {
    if (form.topics.length < 8) setForm(f => ({ ...f, topics: [...f.topics, ''] }));
  };
  const removeTopic = idx => {
    if (form.topics.length > 1) setForm(f => ({ ...f, topics: f.topics.filter((_, i) => i !== idx) }));
  };

  const handleSessionChange = (duration, checked) => {
    setForm(f => {
      let sessions = [...f.sessionDurations];
      if (checked) {
        sessions.push({ duration, price: '', currency: 'USD' });
      } else {
        sessions = sessions.filter(s => s.duration !== duration);
      }
      return { ...f, sessionDurations: sessions };
    });
  };

  const handleSessionPrice = (duration, field, value) => {
    setForm(f => {
      const sessions = f.sessionDurations.map(s =>
        s.duration === duration ? { ...s, [field]: value } : s
      );
      return { ...f, sessionDurations: sessions };
    });
  };

  const handleLanguages = e => {
    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
    setForm(f => ({ ...f, languages: opts }));
  };

  const handleLanguageToggle = (language) => {
    setSelectedLanguages(prev => prev.filter(l => l !== language));
    setForm(f => ({ ...f, languages: f.languages.filter(l => l !== language) }));
  };

  const handleImage = e => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, headshot: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.about.split(' ').length > 120) {
      toast.error('About section must be 120 words or less');
      return;
    }
    
    const loadingToast = toast.loading('Saving profile...');
    
    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'topics' || k === 'languages') {
          v.forEach(val => fd.append(k, val));
        } else if (k === 'sessionDurations') {
          fd.append('sessionDurations', JSON.stringify(v));
        } else if (k === 'socialLinks') {
          Object.entries(v).forEach(([sk, sv]) => fd.append(`socialLinks[${sk}]`, sv));
        } else if (k === 'headshot' && v instanceof File) {
          fd.append('headshot', v);
        } else {
          fd.append(k, v);
        }
      });
      await apiClient.post('/mentor/profile', fd, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Profile saved successfully!', { id: loadingToast });
    } catch (e) {
      toast.error('Could not save profile. Please try again.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast />
      <div className="w-full px-8 py-6">
        <h1 className="text-2xl font-bold text-primary-500 mb-1">Profile Settings</h1>
        <p className="text-gray-500 mb-8">Please fill in the details below. This is what mentees will see on your public mentor profile.</p>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture and Basic Info Section */}
          <div className="flex gap-8 items-start">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 rounded-full overflow-hidden bg-gray-100 mb-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {form.fullName ? form.fullName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
                {/* <div className="absolute bottom-3 right-3 w-8 h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div> */}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary-600 hover:text-primary-700 mb-1"
              >
                Choose File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImage}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Preview
              </button>
            </div>

            {/* Basic Info and About Section */}
            <div className="flex-1 space-y-6">
              {/* Name and Title */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="(E.g. Serial Entrepreneur | CEO XYZ  | Brand Strategist | Ex-Google | 3x Founder)"
                    required
                  />
                </div>
              </div>

              {/* About Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About You <span className="text-gray-400 text-xs">(max 120 words)</span>
                </label>
                <textarea
                  name="about"
                  value={form.about}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="World already knows but would be awesome to write here about who you are, what you've built, achieved, or are known for. Include credibility points — e.g. companies founded, investments, exits, awards, publications, etc. Add something human at the end if you like (e.g. what drives you, what excites you, or something personal)"
                  maxLength={120 * 8}
                  required
                />
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Areas of Expertise */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineBriefcase className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Areas of Expertise</h3>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Please list 4–8 topics you are open to mentoring on"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        e.preventDefault();
                        const newTopic = e.target.value.trim();
                        if (!form.topics.includes(newTopic) && form.topics.length < 8) {
                          setForm(f => ({ ...f, topics: [...f.topics.filter(t => t), newTopic] }));
                        }
                        e.target.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {form.topics.filter(topic => topic.trim()).map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => removeTopic(idx)}
                          className="text-primary-500 hover:text-primary-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session Details */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineClock className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
                </div>
                <div className="space-y-3">
                  {sessionOptions.map(option => {
                    const isSelected = form.sessionDurations.some(s => s.duration === option.duration);
                    const session = form.sessionDurations.find(s => s.duration === option.duration) || {};
                    
                    return (
                      <div key={option.duration} className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer min-w-[80px]">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSessionChange(option.duration, e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-gray-700">{option.label}</span>
                        </label>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <select 
                              className="border border-gray-300 rounded px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              value={session.currency || 'USD'}
                              onChange={(e) => handleSessionPrice(option.duration, 'currency', e.target.value)}
                            >
                              {currencyOptions.map(currency => (
                                <option key={currency.code} value={currency.code}>
                                  {currency.code}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Amount"
                              value={session.price || ''}
                              onChange={(e) => handleSessionPrice(option.duration, 'price', e.target.value)}
                              className="border border-gray-300 rounded px-3 py-1 w-24 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              required
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CiGlobe className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Languages</h3>
                </div>
                <div className="space-y-3">
                  <select
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value && !selectedLanguages.includes(e.target.value)) {
                        const newLanguages = [...selectedLanguages, e.target.value];
                        setSelectedLanguages(newLanguages);
                        setForm(f => ({ ...f, languages: newLanguages }));
                      }
                    }}
                  >
                    <option value="" disabled>Select languages you speak</option>
                    {languageOptions.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {selectedLanguages.map((language, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
                      >
                        {language}
                        <button
                          type="button"
                          onClick={() => handleLanguageToggle(language)}
                          className="text-primary-500 hover:text-primary-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Who You Work Best With */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineUsers className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Who You Work Best With</h3>
                </div>
                <textarea
                  name="idealMentee"
                  value={form.idealMentee}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Describe your ideal mentee (e.g. early-stage founders, solopreneurs scaling past 1 crore, creatives building global agencies, etc.)"
                />
              </div>

              {/* For the Greater Good */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineHeart className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900">For the Greater Good</h3>
                </div>
                <textarea
                  name="donationInfo"
                  value={form.donationInfo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="This entails whether you’ll be donating some share of your session earnings to any charitable causes. (e.g., 30% of the proceeds will be donated to The Citizens Foundation)"
                />
              </div>

              {/* Fun Fact / Quote */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineChatBubbleBottomCenterText className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Fun Fact / Quote</h3>
                </div>
                <textarea
                  name="funFact"
                  value={form.funFact}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Something human or unique that gives your profile personality."
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaLinkedin className="w-6 h-6 text-primary-500" />
                <input
                  type="url"
                  name="socialLinks.linkedin"
                  value={form.socialLinks.linkedin}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="LinkedIn profile URL"
                />
              </div>
              <div className="flex items-center gap-3">
                <FaTwitter className="w-6 h-6 text-primary-500" />
                <input
                  type="url"
                  name="socialLinks.twitter"
                  value={form.socialLinks.twitter}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Twitter profile URL"
                />
              </div>
              <div className="flex items-center gap-3">
                <FaInstagram className="w-6 h-6 text-primary-500" />
                <input
                  type="url"
                  name="socialLinks.instagram"
                  value={form.socialLinks.instagram}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Instagram profile URL"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              loading={loading}
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
            <button
              type="button"
              className="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorProfileForm;
