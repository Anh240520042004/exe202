import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService, documentService, downloadOrderDocument } from '../../services/api';
import { Search, Download, BookOpen, Calendar, CheckCircle, FileText, Grid, List, FolderOpen, Loader2, Eye, X } from 'lucide-react';
import { LoginRequired } from "../../components/ui";
import axios from 'axios';
import { API_BASE } from '../../config/api';

const API_URL = API_BASE;

const MyDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const response = await orderService.getMyDocuments({ page, limit: 20, search });
      const data = response.data?.data || {};
      setDocuments(data.documents || []);
      setPagination(data.pagination || { page: 1, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadDocuments(1, searchQuery);
  };

  const handleViewDocument = async (doc) => {
    const document = doc.document;
    const documentUrl = document?.externalUrl || document?.fileUrl;
    if (!document || !documentUrl) {
      alert('Không tìm thấy tài liệu');
      return;
    }

    if (document.externalUrl || documentUrl.startsWith('http')) {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setPreviewDoc(doc);
    setLoadingPreview(true);

    try {
      const fullUrl = `${API_URL.replace('/api', '')}${documentUrl}`;

      const response = await axios.get(fullUrl);
      setPreviewContent(response.data);
    } catch (error) {
      console.error('Failed to load document:', error);
      setPreviewContent('Không thể tải nội dung tài liệu.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const docId = doc.document?._id;
      const orderId = doc.orderId;

      if (!docId || !orderId) {
        alert('Không tìm thấy thông tin tài liệu');
        return;
      }

      setDownloadingId(docId);
      await downloadOrderDocument(orderId, docId);
      loadDocuments(pagination.page, searchQuery);
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

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      case 'pptx': return '📊';
      case 'xlsx': return '📈';
      default: return '📁';
    }
  };

  const renderDownloadButton = (doc) => {
    if (doc.downloaded) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-xl">
          <CheckCircle size={14} />
          Đã tải
        </span>
      );
    }

    const isDownloading = downloadingId === doc.document?._id;
    
    if (isDownloading) {
      return (
        <button disabled className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-400/70 text-white text-xs font-medium rounded-xl opacity-50">
          <Loader2 size={14} className="animate-spin" />
          Đang tải...
        </button>
      );
    }

    return (
      <button
        onClick={() => handleDownload(doc)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-400/70 text-white text-xs font-medium rounded-xl hover:bg-primary-500/75 transition-colors"
      >
        <Download size={14} />
        Tải xuống
      </button>
    );
  };

  const renderDocumentCard = (doc) => {
    return (
      <div
        key={doc._id}
        className={`glass-card rounded-2xl shadow-sm hover:shadow-lg transition-all group ${
          viewMode === 'list' ? 'flex' : ''
        }`}
      >
        <div className={`relative ${viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-40'}`}>
          {doc.document?.previewImages?.[0] ? (
            <img 
              src={doc.document.previewImages[0]} 
              alt={doc.document?.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
              <span className="text-5xl">{getFileIcon(doc.document?.fileType)}</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              Đã mua
            </span>
          </div>
        </div>

        <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
          <div>
            <h3 className={`font-semibold mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors ${
              viewMode === 'list' ? 'text-lg' : 'text-sm'
            }`}>
              {doc.document?.title || 'Tài liệu'}
            </h3>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="px-2 py-0.5 glass-subtle rounded uppercase text-xs">
                {doc.document?.subjectCode || 'general'}
              </span>
              <span className="uppercase text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                {doc.document?.fileType || 'txt'}
              </span>
              {doc.document?.pageCount > 0 && (
                <span className="text-xs">{doc.document?.pageCount} trang</span>
              )}
              {doc.document?.fileSize && (
                <span className="text-xs text-gray-400">{doc.document?.fileSize} MB</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              {doc.document?.author && (
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {typeof doc.document?.author === 'object' ? doc.document.author.name : 'Tác giả'}
                </span>
              )}
              {doc.downloaded && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle size={14} />
                  Đã tải
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-gray-400">
              Mua ngày: {formatDate(doc.orderDate)}
            </span>
            <div className="flex items-center gap-2">
              {renderDownloadButton(doc)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <LoginRequired title="Tài liệu của tôi" message="Bạn cần đăng nhập để xem tài liệu đã mua">
      <div className="min-h-screen">
      <div className="bg-gradient-to-r from-primary-400/75 to-primary-500/75 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tài Liệu Của Tôi</h1>
              <p className="text-primary-100">
                {pagination.total} tài liệu đã tải
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : documents.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {documents.map(renderDocumentCard)}
          </div>
        ) : (
          <div className="text-center py-16 glass-card rounded-2xl">
            <FileText size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chưa có tài liệu nào</h3>
            <p className="text-gray-500 mb-6">Bạn chưa tải tài liệu nào. Hãy khám phá marketplace để tìm tài liệu phù hợp.</p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400/70 text-white font-medium rounded-2xl hover:bg-primary-500/75 transition-colors"
            >
              <BookOpen size={20} />
              Khám phá Marketplace
            </Link>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => loadDocuments(page, searchQuery)}
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

      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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

            <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
              <div className="text-sm text-gray-500">
                {previewDoc.downloaded ? 'Đã tải' : 'Chưa tải'} - Mua ngày: {formatDate(previewDoc.orderDate)}
              </div>
              <button
                onClick={() => handleDownload(previewDoc)}
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
    </LoginRequired>
  );
};

export default MyDocuments;
