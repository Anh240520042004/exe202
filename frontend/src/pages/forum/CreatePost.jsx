import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, X, Send, Hash } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const makeMediaUrl = (url) => {
  if (!url) return url;
  return url.startsWith('/uploads') ? `${API_URL}${url}` : url;
};

export default function CreatePost() {
  const navigate = useNavigate();
  const { accessToken } = useSelector(state => state.auth);
  const fileInputRef = useRef();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const allowedTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = /\.(jpe?g|png)$/i;
    const invalidFile = files.find(file => !allowedTypes.includes(file.type) || !allowedExtensions.test(file.name));
    if (invalidFile) {
      toast.error('Chỉ hỗ trợ ảnh .jpg, .jpeg hoặc .png');
      e.target.value = '';
      return;
    }
    if (images.length + files.length > 5) {
      toast.error('Tối đa 5 ảnh');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await axios.post(`${API_URL}/api/upload`, formData, {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' },
        });
        return data.url || data.data?.url;
      });

      const urls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...urls.filter(Boolean)]);
    } catch (err) {
      toast.error('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Tiêu đề không được để trống');
    if (!content.trim()) return toast.error('Nội dung không được để trống');

    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/api/posts`,
        { title: title.trim(), content: content.trim(), tags, images },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success('Bài viết đã được đăng!');
      navigate('/forum');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đăng bài mới</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Chia sẻ kiến thức với cộng đồng học tập</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            placeholder="Tiêu đề bài viết..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-0 py-3 bg-transparent border-b border-gray-200 dark:border-white/10 focus:border-primary-500 text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 outline-none transition-colors"
          />
          <p className="text-gray-400 dark:text-white/20 text-xs mt-1 text-right">{title.length}/200</p>
        </div>

        {/* Content */}
        <div>
          <textarea
            placeholder="Viết nội dung bài viết của bạn..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            maxLength={10000}
            className="w-full px-4 py-3 bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 outline-none focus:border-primary-500/50 transition-colors resize-none leading-relaxed"
          />
          <p className="text-gray-400 dark:text-white/20 text-xs mt-1 text-right">{content.length}/10000</p>
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-gray-400 dark:text-white/40" />
            <span className="text-sm text-gray-500 dark:text-white/40">Tags (tối đa 5)</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300 text-sm font-semibold rounded-full border border-primary-200 dark:border-primary-500/20">
                #{tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Nhập tên tag và nhấn Enter..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            disabled={tags.length >= 5}
            className="w-full px-4 py-2.5 bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 outline-none focus:border-primary-500/50 transition-colors text-sm"
          />
        </div>

        {/* Images */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 dark:text-white/40">Hình ảnh (tối đa 5)</span>
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline transition-colors font-semibold"
              >
                <Image className="w-4 h-4" />
                Thêm ảnh
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {images.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={makeMediaUrl(url)} alt="" className="w-full h-28 object-cover rounded-xl border border-gray-200 dark:border-white/10" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-white/40">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Đang tải lên...
            </div>
          )}
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => navigate('/forum')}
            className="px-6 py-2.5 text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white transition-colors font-semibold"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Đăng bài
          </button>
        </div>
      </form>
    </div>
  );
}
