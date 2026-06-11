import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Star, ThumbsUp, Flag } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ORIGIN } from '../../config/api';

const API_URL = API_ORIGIN;

const StarRating = ({ rating, interactive = false, onChange }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star
            className={`w-5 h-5 ${n <= (hover || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : n <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewCard = ({ review }) => (
  <div className="flex gap-3 py-4 border-b border-white/5 last:border-0">
    <img
      src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.name || 'U'}&background=6366f1&color=fff&size=40`}
      alt={review.user?.name}
      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-white text-sm">{review.user?.name || 'User'}</span>
        <StarRating rating={review.rating} />
        <span className="text-white/30 text-xs ml-auto">
          {new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
      {review.comment && (
        <p className="text-white/60 text-sm leading-relaxed">{review.comment}</p>
      )}
    </div>
  </div>
);

export default function ReviewSection({ documentId, avgRating = 0, reviewCount = 0 }) {
  const { accessToken, isAuthenticated } = useSelector(state => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingDist, setRatingDist] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localAvg, setLocalAvg] = useState(avgRating);
  const [localCount, setLocalCount] = useState(reviewCount);

  const fetchReviews = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/reviews/documents/${documentId}?page=${pageNum}&limit=10`
      );
      if (pageNum === 1) {
        setReviews(data.data?.reviews || []);
      } else {
        setReviews(prev => [...prev, ...(data.data?.reviews || [])]);
      }
      setRatingDist(data.data?.ratingDist || []);
      setTotalPages(data.data?.pagination?.pages || 1);
      setLocalAvg(data.data?.avgRating || 0);
      setLocalCount(data.data?.reviewCount || 0);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) fetchReviews(1);
  }, [documentId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Vui lòng chọn số sao');
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/reviews/documents/${documentId}`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setReviews(prev => [data.data, ...prev]);
      setShowForm(false);
      setRating(0);
      setComment('');
      setLocalCount(c => c + 1);
      toast.success('Đã gửi đánh giá!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="text-center sm:min-w-[120px]">
          <div className="text-5xl font-bold text-white mb-1">{localAvg}</div>
          <StarRating rating={Math.round(localAvg)} />
          <p className="text-white/40 text-sm mt-1">{localCount} đánh giá</p>
        </div>

        {ratingDist.length > 0 && (
          <div className="flex-1 space-y-1.5">
            {ratingDist.map(item => (
              <div key={item.rating} className="flex items-center gap-2 text-sm">
                <span className="text-white/50 w-3">{item.rating}</span>
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${localCount > 0 ? (item.count / localCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-white/30 w-6 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Review */}
      {isAuthenticated && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-300 rounded-xl text-sm hover:bg-primary-500/20 transition-colors"
        >
          Viết đánh giá của bạn
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmitReview} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-white text-sm">Đánh giá của bạn</h4>
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-sm">Số sao:</span>
            <StarRating rating={rating} interactive onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Viết nhận xét (không bắt buộc)..."
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm outline-none focus:border-primary-500/50 resize-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !rating}
              className="px-5 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 text-white/50 hover:text-white text-sm transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="divide-y divide-white/5">
        {loading && reviews.length === 0 ? (
          <div className="space-y-3 py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-3 bg-white/10 rounded" />
                  <div className="w-full h-3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-8">Chưa có đánh giá nào</p>
        ) : (
          <>
            {reviews.map(review => (
              <ReviewCard key={review._id} review={review} />
            ))}
            {page < totalPages && (
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchReviews(next); }}
                className="w-full py-3 text-center text-primary-400 hover:text-primary-300 text-sm transition-colors"
              >
                Xem thêm đánh giá
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
