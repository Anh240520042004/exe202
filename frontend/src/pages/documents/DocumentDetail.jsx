import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Star, FileText, Download, Clock, BookOpen, Share2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ReviewSection from '../../components/document/ReviewSection';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const typeLabels = {
  pdf: 'PDF',
  slide: 'Slide',
  source_code: 'Code',
  exam: 'Đề thi',
  assignment: 'Bài tập',
  checklist: 'Checklist',
};

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, accessToken, user } = useSelector(state => state.auth);

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [activeTab, setActiveTab] = useState('preview');
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/documents/${id}`);
        setDocument(data.data);

        // Check if owned
        if (isAuthenticated) {
          const ordersRes = await axios.get(`${API_URL}/api/orders/my-orders`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const orders = ordersRes.data?.data || [];
          const isOwned = orders.some(o =>
            o.items?.some(item => item.document?._id === id || item.document === id) &&
            o.paymentStatus === 'paid'
          );
          setOwned(isOwned);
        }
      } catch (err) {
        toast.error('Không tìm thấy tài liệu');
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id, isAuthenticated]);

  const handleBuy = () => {
    if (!isAuthenticated) return navigate('/login');
    navigate(`/checkout/document/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Quay lại marketplace</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Document Info */}
          <div className="flex-1 min-w-0">
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Preview Image */}
              {document.previewImages?.[0] && (
                <div className="relative">
                  <img
                    src={document.previewImages[0]}
                    alt={document.title}
                    className="w-full h-72 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              <div className="p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {document.subjectCode && (
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-full border border-primary-500/20">
                      {document.subjectCode}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/20">
                    {typeLabels[document.type] || document.type}
                  </span>
                  {document.isPremium && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/20">
                      Premium
                    </span>
                  )}
                </div>

                {/* Title & Author */}
                <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{document.title}</h1>

                <div className="flex items-center gap-4 mb-6">
                  {document.uploadedBy && (
                    <div className="flex items-center gap-2">
                      <img
                        src={document.uploadedBy.avatar}
                        alt={document.uploadedBy.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-white/60 text-sm">{document.uploadedBy.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white/60 text-sm font-medium">{document.avgRating || 0}</span>
                    <span className="text-white/30 text-sm">({document.reviewCount || 0} đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/40 text-sm">
                    <Download className="w-4 h-4" />
                    <span>{document.downloadCount || 0} lượt tải</span>
                  </div>
                </div>

                {/* Description */}
                {document.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Mô tả</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{document.description}</p>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-center">
                    <FileText className="w-5 h-5 text-white/30 mx-auto mb-1" />
                    <p className="text-white/40 text-xs">Loại</p>
                    <p className="text-white text-sm font-medium">{typeLabels[document.type] || document.type}</p>
                  </div>
                  <div className="text-center">
                    <BookOpen className="w-5 h-5 text-white/30 mx-auto mb-1" />
                    <p className="text-white/40 text-xs">Trang</p>
                    <p className="text-white text-sm font-medium">{document.pageCount || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <Star className="w-5 h-5 text-white/30 mx-auto mb-1" />
                    <p className="text-white/40 text-xs">Đánh giá</p>
                    <p className="text-white text-sm font-medium">{document.avgRating || 0}/5</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-5 h-5 text-white/30 mx-auto mb-1" />
                    <p className="text-white/40 text-xs">Ngày đăng</p>
                    <p className="text-white text-sm font-medium">
                      {new Date(document.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-white/10 mb-6">
                  <div className="flex gap-6">
                    {['preview', 'reviews'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === tab
                            ? 'text-primary-400 border-primary-400'
                            : 'text-white/40 border-transparent hover:text-white/70'
                        }`}
                      >
                        {tab === 'preview' ? 'Xem trước' : 'Đánh giá'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'preview' ? (
                  <div>
                    {document.previewImages?.length > 0 ? (
                      <div className="space-y-3">
                        {document.previewImages.map((img, i) => (
                          <img key={i} src={img} alt={`Preview ${i + 1}`} className="w-full rounded-xl" />
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/30 text-center py-8">Không có preview</p>
                    )}
                  </div>
                ) : (
                  <ReviewSection
                    documentId={id}
                    avgRating={document.avgRating}
                    reviewCount={document.reviewCount}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: Purchase Card */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {document.price?.toLocaleString('vi-VN')} <span className="text-lg text-white/50">VNĐ</span>
                </div>
                {document.originalPrice && document.originalPrice > document.price && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-white/30 line-through text-sm">
                      {document.originalPrice.toLocaleString('vi-VN')} VNĐ
                    </span>
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                      -{Math.round((1 - document.price / document.originalPrice) * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {owned ? (
                <Link
                  to={`/checkout/document/${id}`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-semibold hover:bg-green-500/30 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Tải tài liệu
                </Link>
              ) : (
                <button
                  onClick={handleBuy}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Mua ngay
                </button>
              )}

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white/70 rounded-xl text-sm hover:bg-white/10 transition-colors">
                <Heart className="w-4 h-4" />
                Lưu vào yêu thích
              </button>

              <div className="pt-4 border-t border-white/5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Loại file</span>
                  <span className="text-white/70">{typeLabels[document.type] || document.type}</span>
                </div>
                {document.pageCount && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Số trang</span>
                    <span className="text-white/70">{document.pageCount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/40">Ngày đăng</span>
                  <span className="text-white/70">
                    {new Date(document.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
