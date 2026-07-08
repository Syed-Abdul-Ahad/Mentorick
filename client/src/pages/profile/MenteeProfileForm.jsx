import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import Toast from '../../components/shared/Toast';
import toast from 'react-hot-toast';
import { HiOutlineStar } from 'react-icons/hi2';
import Button from '../../components/shared/Button';
import { menteeService } from '../../api';
import Seo from '../../components/seo/Seo';
import MainLayout from '../../components/layout/MainLayout';

const initialState = {
  fullName: '',
  about: '',
  interests: [''],
  headshot: ''
};

const MenteeProfileForm = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // Prefill form with existing profile data
    const fetchProfile = async () => {
      try {
        setInitialLoading(true);
        const profile = await menteeService.getMyProfile();
        console.log('Fetched profile data:', profile);
        
        // Update form with existing data
        let interests = [''];
        if (profile.interests) {
          // Handle both string and array formats
          if (typeof profile.interests === 'string') {
            try {
              interests = JSON.parse(profile.interests);
            } catch (e) {
              // If parsing fails, split by comma or use as single item
              interests = profile.interests.includes(',') ? 
                profile.interests.split(',').map(item => item.trim()) : 
                [profile.interests];
            }
          } else if (Array.isArray(profile.interests)) {
            interests = profile.interests;
          }
          // Ensure we have at least one empty field for adding new interests
          if (interests.length === 0) interests = [''];
        }
        
        setForm({
          fullName: profile.fullName || '',
          about: profile.about || '',
          interests: interests,
          headshot: profile.headshot || ''
        });
        
        // Set image preview if headshot exists
        if (profile.headshot) {
          setImagePreview(profile.headshot);
        }
        
        console.log('Profile loaded successfully:', profile);
      } catch (error) {
        // If profile doesn't exist yet (404), that's okay - use empty form
        if (error.response?.status === 404) {
          console.log('No existing profile found, starting with empty form');
        } else {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load existing profile data');
        }
      } finally {
        setInitialLoading(false);
      }
    };

    if (user?.role === 'mentee') {
      fetchProfile();
    } else {
      setInitialLoading(false);
    }
  }, [user]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleInterestChange = (idx, value) => {
    setForm(f => {
      const interests = [...f.interests];
      interests[idx] = value;
      return { ...f, interests };
    });
  };

  const addInterest = () => {
    if (form.interests.length < 8) {
      setForm(f => ({ ...f, interests: [...f.interests, ''] }));
    }
  };

  const removeInterest = idx => {
    if (form.interests.length > 1) {
      setForm(f => ({ ...f, interests: f.interests.filter((_, i) => i !== idx) }));
    }
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
      toast.error('About section cannot exceed 120 words');
      return;
    }
    
    const loadingToast = toast.loading('Saving profile...');
    
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Add form fields
      formData.append('fullName', form.fullName);
      formData.append('about', form.about);
      
      // Add interests (filter out empty ones)
      const validInterests = form.interests.filter(interest => interest.trim());
      formData.append('interests', JSON.stringify(validInterests));
      
      // Add image if selected
      if (form.headshot instanceof File) {
        formData.append('headshot', form.headshot);
      }
      
      await menteeService.createOrUpdateProfile(formData);
      
      toast.success('Profile saved successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save profile. Please try again.';
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Seo
        title="Mentee Profile Settings | Mentorick"
        description="Edit your mentee profile on Mentorick."
        canonical="/profile/edit"
        noindex
      />
      <Toast />
      <div className="w-full px-8 py-6">
        <h1 className="text-2xl font-bold text-primary-500 mb-1">Profile Settings</h1>
        <p className="text-gray-500 mb-8">
          Please fill in your details below. This information helps mentors understand who you are and your learning interests.
        </p>
        
        {/* Show loading state while fetching existing profile */}
        {initialLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your profile...</p>
            </div>
          </div>
        ) : (
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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
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
                  placeholder="Tell mentors about yourself, your background, goals, and what you're looking to achieve through mentoring. This helps mentors understand how they can best help you."
                  maxLength={120 * 8}
                  required
                />
              </div>
            </div>
          </div>

          {/* Interests Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineStar className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-gray-900">Learning Interests</h3>
            </div>
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                List 4-8 areas you're interested in learning about or getting mentoring on
              </p>
              {form.interests.map((interest, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={interest}
                    onChange={(e) => handleInterestChange(idx, e.target.value)}
                    className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={`Interest ${idx + 1} (e.g., Career Development, Entrepreneurship, Product Management)`}
                  />
                  {form.interests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInterest(idx)}
                      className="px-3 py-3 text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {form.interests.length < 8 && (
                <button
                  type="button"
                  onClick={addInterest}
                  className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-primary-500 rounded-lg text-gray-500 hover:text-primary-500 transition-colors"
                >
                  + Add Interest
                </button>
              )}
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
        )}
      </div>
    </MainLayout>
  );
};

export default MenteeProfileForm;