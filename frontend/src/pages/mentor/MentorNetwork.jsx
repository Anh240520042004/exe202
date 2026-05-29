import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, DollarSign, Calendar, MessageCircle, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

const MentorNetwork = () => {
  const [mentors, setMentors] = useState([]);
  const [topMentors, setTopMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [filters, setFilters] = useState({ search: '', subject: '' });

  useEffect(() => {
    loadMentors();
  }, [filters]);

  const loadMentors = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.subject) params.subject = filters.subject;

      const [allRes, topRes] = await Promise.all([
        axios.get(`${API_URL}/mentors`, { params }),
        axios.get(`${API_URL}/mentors/top`),
      ]);

      const allData = allRes.data;
      const topData = topRes.data;

      setMentors(allData?.data?.mentors || allData?.data || allData || []);
      setTopMentors(topData?.data?.mentors || topData?.data || topData || []);

      console.log('Mentors loaded:', mentors.length);
    } catch (error) {
      console.error('Failed to load mentors:', error);
      toast.error('Không thể tải danh sách mentor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = (mentor) => {
    setSelectedMentor(mentor);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen">
      <div className="glass-hero glass-hero-purple mx-4 mt-2 px-6 py-10 md:px-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">Mentor Network</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Kết nối với mentor thực chiến từ FPT Software, VNG, và các công ty hàng đầu
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="glass-chip glass-nav-link flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-gray-200">
              <Award size={20} className="text-primary-500" />
              <span>{mentors.length} Mentors</span>
            </div>
            <div className="glass-chip glass-nav-link flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-gray-200">
              <Star size={20} className="text-amber-400" />
              <span>4.8 Rating</span>
            </div>
            <div className="glass-chip glass-nav-link flex items-center gap-2 px-4 py-2 text-gray-800 dark:text-gray-200">
              <MessageCircle size={20} className="text-primary-500" />
              <span>1000+ Sessions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {topMentors.length > 0 && !filters.search && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="text-yellow-500" />
              Top Mentors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topMentors.slice(0, 3).map((mentor, index) => (
                <TopMentorCard key={mentor._id} mentor={mentor} rank={index + 1} onBook={() => handleBooking(mentor)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Tất cả Mentors</h2>
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm mentor..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="glass-input glass-hover-card pl-4 pr-10 py-2 min-w-[200px]"
                />
              </div>
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="glass-input glass-hover-card px-4 py-2"
              >
                <option value="">Tất cả môn</option>
                <option value="SWP391">SWP391</option>
                <option value="PRJ301">PRJ301</option>
                <option value="DBI202">DBI202</option>
                <option value="MAD101">MAD101</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map(mentor => (
                <MentorCard key={mentor._id} mentor={mentor} onBook={() => handleBooking(mentor)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 glass-card glass-hover-card rounded-2xl p-8">
              <p className="text-gray-500">Không tìm thấy mentor nào</p>
              <button
                onClick={() => setFilters({ search: '', subject: '' })}
                className="glass-nav-link mt-4 px-4 py-2 bg-primary-400/60 backdrop-blur-md text-white rounded-xl border border-white/25 hover:bg-primary-500/70"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>
      </div>

      {showBookingModal && selectedMentor && (
        <BookingModal mentor={selectedMentor} onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  );
};

const TopMentorCard = ({ mentor, rank, onBook }) => {
  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <div className="glass-card glass-hover-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 glass-subtle rounded-bl-full">
        <span className="absolute top-2 right-2 text-3xl">{rankEmoji}</span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <img src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor._id}`} alt={mentor.name} className="w-16 h-16 rounded-full" />
        <div>
          <h3 className="font-bold text-lg">{mentor.name}</h3>
          <p className="text-sm text-gray-500">{mentor.mentorProfile?.title}</p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span>{mentor.mentorProfile?.rating || 0} ({mentor.mentorProfile?.totalReviews || 0} reviews)</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-green-500" />
          <span>{mentor.mentorProfile?.pricePerHour?.toLocaleString() || 0}đ/hour</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {mentor.mentorProfile?.expertise?.slice(0, 3).map(subject => (
            <span key={subject} className="glass-chip px-2 py-1 text-primary-600 dark:text-primary-300 text-xs">
              {subject}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onBook}
        className="glass-nav-link w-full py-2 bg-primary-400/60 backdrop-blur-md text-white rounded-xl border border-white/25 hover:bg-primary-500/70 transition-all"
      >
        Book Session
      </button>
    </div>
  );
};

const MentorCard = ({ mentor, onBook }) => {
  return (
    <div className="glass-card glass-hover-card rounded-2xl p-6">
      <div className="flex items-start gap-4 mb-4">
        <img src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor._id}`} alt={mentor.name} className="w-14 h-14 rounded-full" />
        <div className="flex-1">
          <h3 className="font-bold">{mentor.name}</h3>
          <p className="text-sm text-gray-500">{mentor.mentorProfile?.title}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm">{mentor.mentorProfile?.rating || 0}</span>
            <span className="text-sm text-gray-400">({mentor.mentorProfile?.totalReviews || 0})</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {mentor.mentorProfile?.bio}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {mentor.mentorProfile?.expertise?.slice(0, 3).map(subject => (
          <span key={subject} className="px-2 py-1 glass-subtle rounded text-xs">
            {subject}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4 border-t glass-divider">
        <div>
          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {mentor.mentorProfile?.pricePerHour?.toLocaleString() || 0}đ
          </span>
          <span className="text-sm text-gray-500">/hour</span>
        </div>
        <button
          onClick={onBook}
          className="glass-nav-link px-4 py-2 bg-primary-400/60 backdrop-blur-md text-white rounded-xl border border-white/25 hover:bg-primary-500/70 transition-all"
        >
          Book
        </button>
      </div>
    </div>
  );
};

const BookingModal = ({ mentor, onClose }) => {
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/mentors`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Booking created successfully!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 glass-overlay flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b glass-divider">
          <div className="flex items-center gap-4">
            <img src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor._id}`} alt={mentor.name} className="w-12 h-12 rounded-full" />
            <div>
              <h3 className="font-bold text-lg">Book with {mentor.name}</h3>
              <p className="text-sm text-gray-500">{mentor.mentorProfile?.pricePerHour?.toLocaleString() || 0}đ/hour</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject *</label>
            <select
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="glass-input w-full px-4 py-2"
            >
              <option value="">Select subject</option>
              {mentor.mentorProfile?.expertise?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="What do you want to discuss?"
              className="glass-input w-full px-4 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="glass-input w-full px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <select
                value={`${formData.startTime}-${formData.endTime}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split('-');
                  setFormData({ ...formData, startTime: start, endTime: end });
                }}
                className="glass-input w-full px-4 py-2"
              >
                <option value="09:00-10:00">1 hour</option>
                <option value="09:00-11:00">2 hours</option>
                <option value="09:00-12:00">3 hours</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information..."
              rows={3}
              className="glass-input w-full px-4 py-2"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-xl glass-nav-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-nav-link flex-1 py-2 bg-primary-400/60 backdrop-blur-md text-white rounded-xl border border-white/25 hover:bg-primary-500/70 disabled:opacity-50"
            >
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorNetwork;
