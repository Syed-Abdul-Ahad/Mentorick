import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { mentorService } from '../../api/services';
import { toast } from 'react-hot-toast';
import MainLayout from '../../components/layout/MainLayout';
import Seo from '../../components/seo/Seo';
import { AiOutlineSearch, AiOutlineStar, AiOutlineUser } from 'react-icons/ai';

const MAX_FEATURED = 10;

const AdminFeaturedMentors = () => {
  const { user } = useSelector((state) => state.auth);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | featured | not_featured

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const data = await mentorService.getAllMentors();
        setMentors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Failed to load mentors');
        setMentors([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchMentors();
    }
  }, [user?.role]);

  const featuredCount = useMemo(
    () => mentors.filter((m) => m.isFeatured).length,
    [mentors]
  );

  const filteredMentors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mentors.filter((mentor) => {
      if (filter === 'featured' && !mentor.isFeatured) return false;
      if (filter === 'not_featured' && mentor.isFeatured) return false;

      if (!q) return true;
      const haystack = [
        mentor.fullName,
        mentor.title,
        mentor.about,
        ...(mentor.topics || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [mentors, searchQuery, filter]);

  const handleToggle = async (mentor) => {
    const next = !mentor.isFeatured;
    if (next && featuredCount >= MAX_FEATURED) {
      toast.error(`You can feature at most ${MAX_FEATURED} mentors. Unfeature one first.`);
      return;
    }

    setTogglingId(mentor._id);
    try {
      const response = await mentorService.setMentorFeatured(mentor._id, next);
      const updated = response.data;
      setMentors((prev) =>
        prev.map((m) => (m._id === mentor._id ? { ...m, ...updated } : m))
      );
      toast.success(next ? 'Mentor featured' : 'Mentor removed from featured');
    } catch (error) {
      toast.error(error.message || 'Failed to update featured status');
    } finally {
      setTogglingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <MainLayout>
        <Seo title="Admin | Mentorick" canonical="/admin/featured-mentors" noindex />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Seo
        title="Featured Mentors | Mentorick"
        description="Admin tools for curating featured mentors."
        canonical="/admin/featured-mentors"
        noindex
      />
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Featured Mentors</h1>
          <p className="text-gray-600">
            Choose up to {MAX_FEATURED} mentors to show in the Featured slider on the homepage and
            mentors page. The full mentors list below still includes everyone, featured or not.
          </p>
          <p className="mt-3 text-sm font-medium text-gray-800">
            Featured:{' '}
            <span className="tabular-nums text-primary-600">
              {featuredCount}/{MAX_FEATURED}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, title, topic..."
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All mentors</option>
            <option value="featured">Featured only</option>
            <option value="not_featured">Not featured</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No mentors match your search or filter.
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredMentors.map((mentor) => {
              const isOn = Boolean(mentor.isFeatured);
              const busy = togglingId === mentor._id;
              const disableOn = !isOn && featuredCount >= MAX_FEATURED;

              return (
                <li
                  key={mentor._id}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {mentor.headshot ? (
                      <img
                        src={mentor.headshot}
                        alt={mentor.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AiOutlineUser className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{mentor.fullName}</p>
                      {isOn && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          <AiOutlineStar className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{mentor.title || '—'}</p>
                    {mentor.topics?.length > 0 && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {mentor.topics.slice(0, 4).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    aria-label={isOn ? 'Unfeature mentor' : 'Feature mentor'}
                    disabled={busy || disableOn}
                    onClick={() => handleToggle(mentor)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isOn ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        isOn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminFeaturedMentors;
