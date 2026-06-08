import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, Star, FileText, Download, Clock, BookOpen, Share2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ReviewSection from '../../components/document/ReviewSection';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

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
  const [activeTab, setActiveTab] = useState('preview');
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/documents/${id}`);
        setDocument(data.data);

        if (data.data?.documentScope === 'mentor_profile') {
          setOwned(true);
        } else if (isAuthenticated) {
          const ordersRes = await axios.get(`${API_URL}/api/orders`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const orders = ordersRes.data?.data || [];
          const isOwned = orders.some((order) =>
            order.documents?.some((item) => item.document?._id === id || item.document === id) &&
            order.paymentStatus === 'paid'
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

  const isMentorProfileDocument = document?.documentScope === 'mentor_profile';

  const openDocument = () => {
    const targetUrl = document?.externalUrl || (document?.fileUrl?.startsWith('http') ? document.fileUrl : `${API_URL}${document?.fileUrl || ''}`);
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[420px] glass-card flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-semibold">Quay lại Marketplace</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Document Info */}
        <div className="flex-1 min-w-0">
          <div className="glass-card overflow-hidden">
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

            <div className="p-6 md:p-8">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {document.subjectCode && (
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-500/20 text-primary-750 dark:text-primary-300 text-xs font-semibold rounded-full border border-primary-200 dark:border-primary-500/20">
                    {document.subjectCode}
                  </span>
                )}
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-750 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-500/20">
                  {typeLabels[document.documentType] || document.documentType}
                </span>
                {isMentorProfileDocument && (
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-755 dark:text-emerald-300 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    Tài liệu mentor
                  </span>
                )}
                {document.isPremium && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-755 dark:text-yellow-300 text-xs font-semibold rounded-full border border-yellow-250 dark:border-yellow-500/20">
                    Premium
                  </span>
                )}
              </div>

              {/* Title & Author */}
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">{document.title}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                {document.author && (
                  <div className="flex items-center gap-2">
                    <img
                      src={document.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(document.author.name || 'U')}&background=8b6cf0&color=fff`}
                      alt={document.author.name}
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-white/10"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(document.author.name || 'U')}&background=8b6cf0&color=fff`;
                      }}
                    />
                    <span className="text-gray-600 dark:text-gray-400 text-sm font-semibold">{document.author.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-semibold">{document.avgRating || 0}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-sm">({document.reviewCount || 0} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-sm">
                  <Download className="w-4 h-4" />
                  <span>{document.downloads || 0} lượt tải</span>
                </div>
              </div>

              {/* Description */}
              {document.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mô tả</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{document.description}</p>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-white/70 dark:bg-white/5 rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
                <div className="text-center">
                  <FileText className="w-5 h-5 text-gray-400 dark:text-white/30 mx-auto mb-1" />
                  <p className="text-gray-400 dark:text-white/40 text-xs">Loại</p>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold">{typeLabels[document.documentType] || document.documentType}</p>
                </div>
                <div className="text-center">
                  <BookOpen className="w-5 h-5 text-gray-400 dark:text-white/30 mx-auto mb-1" />
                  <p className="text-gray-400 dark:text-white/40 text-xs">Trang</p>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold">{document.pageCount || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <Star className="w-5 h-5 text-gray-400 dark:text-white/30 mx-auto mb-1" />
                  <p className="text-gray-400 dark:text-white/40 text-xs">Đánh giá</p>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold">{document.avgRating || 0}/5</p>
                </div>
                <div className="text-center">
                  <Clock className="w-5 h-5 text-gray-400 dark:text-white/30 mx-auto mb-1" />
                  <p className="text-gray-400 dark:text-white/40 text-xs">Ngày đăng</p>
                  <p className="text-gray-900 dark:text-white text-sm font-semibold">
                    {new Date(document.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-white/10 mb-6">
                <div className="flex gap-6">
                  {['preview', 'reviews'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                        activeTab === tab
                          ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                          : 'text-gray-400 dark:text-white/40 border-transparent hover:text-gray-600 dark:hover:text-white/70'
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
                        <img key={i} src={img} alt={`Preview ${i + 1}`} className="w-full rounded-xl border border-gray-200 dark:border-white/5" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-white/30 text-center py-8">Không có preview</p>
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
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="sticky top-24 glass-card p-6 space-y-4">
            <div className="text-center">
              {isMentorProfileDocument ? (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Tài liệu mentor</div>
                  <div className="text-xs text-gray-500 dark:text-white/50 font-medium">Xem trực tiếp và đánh giá trên trang này</div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                    {document.price?.toLocaleString('vi-VN')} <span className="text-sm font-normal text-gray-500 dark:text-white/50">VNĐ</span>
                  </div>
                  {document.originalPrice && document.originalPrice > document.price && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-gray-400 dark:text-white/30 line-through text-sm">
                        {document.originalPrice.toLocaleString('vi-VN')} VNĐ
                      </span>
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
                        -{Math.round((1 - document.price / document.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {isMentorProfileDocument ? (
              <button
                onClick={openDocument}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 rounded-xl font-bold hover:bg-green-200 dark:hover:bg-green-950/30 transition-colors shadow-sm"
              >
                <Download className="w-5 h-5" />
                Mở tài liệu
              </button>
            ) : owned ? (
              <button
                onClick={openDocument}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-955/20 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 rounded-xl font-bold hover:bg-green-200 dark:hover:bg-green-950/30 transition-colors shadow-sm"
              >
                <Download className="w-5 h-5" />
                Tải tài liệu
              </button>
            ) : (
              <button
                onClick={handleBuy}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <ShoppingCart className="w-5 h-5" />
                Mua ngay
              </button>
            )}

            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <Heart className="w-4 h-4" />
              Lưu vào yêu thích
            </button>

            <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-2.5 text-sm font-medium">
              <div className="flex justify-between">
                <span className="text-gray-400 dark:text-white/40">Loại file</span>
                <span className="text-gray-700 dark:text-white/70">{typeLabels[document.documentType] || document.documentType}</span>
              </div>
              {document.pageCount && (
                <div className="flex justify-between">
                  <span className="text-gray-400 dark:text-white/40">Số trang</span>
                  <span className="text-gray-700 dark:text-white/70">{document.pageCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400 dark:text-white/40">Ngày đăng</span>
                <span className="text-gray-700 dark:text-white/70">
                  {new Date(document.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
