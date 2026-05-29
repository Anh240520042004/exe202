import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentService } from '../../services/api';
import { Search, Download, Calendar, FileText, Grid, List, Clock, TrendingUp, Eye, X } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DownloadHistory = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalDownloads: 0, thisMonth: 0 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const response = await documentService.getDownloadHistory({ page, limit: 20, search });
      const data = response.data?.data || {};
      setHistory(data.downloads || []);
      setStats(data.stats || { totalDownloads: 0, thisMonth: 0 });
      setPagination(data.pagination || { page: 1, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadHistory(1, searchQuery);
  };

  const handleViewDocument = async (item) => {
    const doc = item.document;
    if (!doc || !doc.fileUrl) {
      alert('Không tìm thấy tài liệu');
      return;
    }

    setPreviewDoc(item);
    setLoadingPreview(true);

    try {
      // Get file URL
      const fullUrl = doc.fileUrl.startsWith('http') 
        ? doc.fileUrl 
        : `${API_URL.replace('/api', '')}${doc.fileUrl}`;

      // Fetch file content
      const response = await axios.get(fullUrl);
      setPreviewContent(response.data);
    } catch (error) {
      console.error('Failed to load document:', error);
      setPreviewContent('Không thể tải nội dung tài liệu.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      setDownloadingId(docId);
      
      const downloadResponse = await documentService.download(docId);
      const downloadData = downloadResponse.data?.data || {};
      
      if (downloadData.downloadUrl) {
        const fullUrl = downloadData.downloadUrl.startsWith('http') 
          ? downloadData.downloadUrl 
          : `${API_URL}${downloadData.downloadUrl}`;
        
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = downloadData.fileName || fileName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      loadHistory(pagination.page, searchQuery);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Không thể tải tài liệu. Vui lòng thử lại.');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      case 'zip':
      case 'rar':
        return '📦';
      case 'pptx':
        return '📊';
      case 'xlsx':
        return '📈';
      default:
        return '📁';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Clock size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Lịch Sử Tải Xuống</h1>
              <p className="text-blue-100">
                Theo dõi tất cả tài liệu bạn đã tải
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Download size={24} />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Tổng số lượt tải</p>
                  <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Tháng này</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Tài liệu đã tải</p>
                  <p className="text-2xl font-bold">{pagination.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative max-w-xl mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border glass-divider border glass-card focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </form>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">
              {pagination.total} tài liệu
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-400/15'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-400/15'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className={`space-y-4 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : ''
          }`}>
            {history.map((item) => {
              const doc = item.document;
              return (
                <div
                  key={item._id}
                  className={`glass-card rounded-2xl shadow-sm hover:shadow-lg transition-all ${
                    viewMode === 'list' ? 'flex items-center' : ''
                  }`}
                >
                  {viewMode === 'list' ? (
                    <>
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0 rounded-l-xl">
                        <span className="text-3xl">{getFileIcon(doc?.fileType)}</span>
                      </div>
                      <div className="flex-1 p-4 flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{doc?.title || 'Tài liệu'}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="uppercase text-xs px-2 py-0.5 glass-subtle rounded">
                              {doc?.fileType || 'file'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(item.downloadedAt)}
                            </span>
                            {doc?.fileSize && (
                              <span className="text-xs">{formatFileSize(doc.fileSize)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <button
                            onClick={() => handleViewDocument(item)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <Eye size={16} />
                            Xem
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <span className="text-5xl">{getFileIcon(doc?.fileType)}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">{doc?.title || 'Tài liệu'}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <span className="uppercase px-2 py-0.5 glass-subtle rounded">
                            {doc?.fileType || 'file'}
                          </span>
                          {doc?.fileSize && (
                            <span>{formatFileSize(doc.fileSize)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                          <Calendar size={12} />
                          {formatDate(item.downloadedAt)}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDocument(item)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <Eye size={14} />
                            Xem
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Clock size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chưa có lịch sử tải</h3>
            <p className="text-gray-500 mb-6">Bạn chưa tải tài liệu nào. Hãy khám phá marketplace để tìm tài liệu phù hợp.</p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400/70 text-white font-medium rounded-2xl hover:bg-primary-500/75 transition-colors"
            >
              <FileText size={20} />
              Khám phá Marketplace
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => loadHistory(page, searchQuery)}
                className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                  pagination.page === page
                    ? 'bg-primary-400/70 text-white'
                    : 'glass-subtle text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold">{previewDoc.document?.title}</h2>
                <p className="text-sm text-gray-500">
                  {previewDoc.document?.subjectCode} • {previewDoc.document?.fileType?.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 glass-nav-hover rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 ">
              {loadingPreview ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm glass-card p-6 rounded-2xl shadow-sm overflow-auto max-h-[60vh]">
                  {previewContent}
                </pre>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
              <div className="text-sm text-gray-500">
                Tải ngày: {formatDate(previewDoc.downloadedAt)}
              </div>
              <button
                onClick={() => handleDownload(previewDoc.document?._id, previewDoc.document?.fileName)}
                className="flex items-center gap-2 px-6 py-2 bg-primary-400/70 text-white font-medium rounded-xl hover:bg-primary-500/75 transition-colors"
              >
                <Download size={18} />
                Tải xuống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadHistory;
