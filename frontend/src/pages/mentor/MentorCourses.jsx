import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/api';
import {
  Plus,
  BookOpen,
  FileText,
  Upload,
  Trash2,
  Edit,
  Eye,
  Download,
  CheckCircle,
  X,
  Folder,
  MoreVertical,
  Filter,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Tất cả', icon: '📚' },
  { value: 'software_engineering', label: 'Kỹ thuật phần mềm', icon: '💻' },
  { value: 'marketing', label: 'Marketing', icon: '📈' },
  { value: 'communication', label: 'Truyền thông', icon: '🎤' },
  { value: 'business', label: 'Kinh doanh', icon: '💼' },
  { value: 'design', label: 'Thiết kế', icon: '🎨' },
  { value: 'data_science', label: 'Khoa học dữ liệu', icon: '📊' },
  { value: 'other', label: 'Khác', icon: '📁' },
];

const SEMESTER_OPTIONS = Array.from({ length: 9 }, (_, index) => String(index + 1));

const MentorCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: '',
    description: '',
    credits: 3,
    faculty: '',
    category: 'software_engineering',
    semester: '1',
    thumbnail: '',
    price: 0,
  });

  const [documentForm, setDocumentForm] = useState({
    title: '',
    description: '',
    price: 0,
    documentType: 'pdf',
    tags: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentSourceType, setDocumentSourceType] = useState('upload'); // 'upload' | 'google_drive' | 'external_link'
  const [externalUrl, setExternalUrl] = useState('');

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      // Use getMyCourses to only get mentor's own courses
      const response = await courseService.getMyCourses(params);
      let filteredCourses = response.data?.data || [];
      
      setCourses(filteredCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyCourses();
  }, [selectedCategory, searchTerm]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await courseService.create(courseForm);
      setShowCreateModal(false);
      setCourseForm({
        name: '',
        description: '',
        credits: 3,
        faculty: '',
        category: 'software_engineering',
        semester: '1',
        thumbnail: '',
        price: 0,
      });
      loadMyCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Tạo khóa học thất bại');
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();

    // Validate based on source type
    if (documentSourceType === 'upload' && !selectedFile) {
      alert('Vui lòng chọn file để tải lên');
      return;
    }
    if (documentSourceType !== 'upload' && !externalUrl) {
      alert('Vui lòng nhập đường dẫn');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      if (documentSourceType === 'upload') {
        formData.append('file', selectedFile);
        formData.append('title', documentForm.title || selectedFile.name);
      } else {
        formData.append('title', documentForm.title || 'Tài liệu bên ngoài');
        formData.append('externalUrl', externalUrl);
      }

      formData.append('description', documentForm.description);
      formData.append('price', documentForm.price);
      formData.append('documentType', documentForm.documentType);
      formData.append('tags', documentForm.tags);

      await courseService.addDocument(selectedCourse.code, formData);
      setShowDocumentModal(false);
      setSelectedCourse(null);
      setDocumentForm({
        title: '',
        description: '',
        price: 0,
        documentType: 'pdf',
        tags: '',
      });
      setSelectedFile(null);
      setExternalUrl('');
      setDocumentSourceType('upload');
      loadMyCourses();
    } catch (error) {
      console.error('Failed to add document:', error);
      alert('Thêm tài liệu thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCourse = async (code) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này?')) return;
    try {
      await courseService.delete(code);
      loadMyCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Xóa khóa học thất bại');
    }
  };

  const handleRemoveDocument = async (courseCode, docId) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    try {
      await courseService.removeDocument(courseCode, docId);
      loadMyCourses();
    } catch (error) {
      console.error('Failed to remove document:', error);
      alert('Xóa tài liệu thất bại');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
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
      default:
        return '📁';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-400/75 to-primary-500/75 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <BookOpen size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Quản Lý Khóa Học</h1>
                <p className="text-primary-100">
                  {courses.length} khóa học
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-2xl hover:bg-primary-50 transition-colors"
            >
              <Plus size={20} />
              Tạo Khóa Học Mới
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="glass-card rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadMyCourses()}
                className="w-full pl-10 pr-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-primary-400/70 text-white'
                      : 'glass-subtle text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Course List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const categoryInfo = CATEGORY_OPTIONS.find(c => c.value === course.category) || CATEGORY_OPTIONS[7];
              const docCount = course.documents?.length || course.documentCount || 0;
              const downloadCount = course.totalDownloads || 0;
              
              return (
              <div
                key={course._id}
                className="glass-card rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Course Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-primary-400 to-primary-600 relative">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Folder size={48} className="text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className="px-3 py-1 bg-white/90 text-primary-600 text-xs font-medium rounded-full">
                      {course.code}
                    </span>
                  </div>
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      course.category === 'software_engineering' ? 'bg-blue-500/90 text-white' :
                      course.category === 'marketing' ? 'bg-green-500/90 text-white' :
                      course.category === 'communication' ? 'bg-purple-500/90 text-white' :
                      course.category === 'business' ? 'bg-orange-500/90 text-white' :
                      course.category === 'design' ? 'bg-pink-500/90 text-white' :
                      course.category === 'data_science' ? 'bg-cyan-500/90 text-white' :
                      'bg-gray-500/90 text-white'
                    }`}>
                      {categoryInfo.icon} {categoryInfo.label}
                    </span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">
                    {course.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                    {course.description || 'Không có mô tả'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {docCount} tài liệu
                    </span>
                    <span className="flex items-center gap-1">
                      <Download size={14} />
                      {downloadCount} lượt tải
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 glass-subtle rounded-xl text-xs text-gray-500 text-center">
                      Tai lieu marketplace chi admin moi duoc dang. Tai lieu ca nhan dang tren profile mentor.
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(course.code)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Document List */}
                  {course.documents && course.documents.length > 0 && (
                    <div className="mt-4 pt-4 border-t glass-divider border">
                      <p className="text-xs text-gray-500 mb-2">Tài liệu:</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {course.documents.slice(0, 3).map((doc) => (
                          <div
                            key={doc._id}
                            className="flex items-center justify-between text-sm glass-subtle/50 rounded-xl px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span>{getFileIcon(doc.fileType)}</span>
                              <span className="truncate">{doc.title}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveDocument(course.code, doc._id)}
                              className="text-red-500 hover:text-red-700 flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {course.documents.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{course.documents.length - 3} tài liệu khác
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Folder size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chưa có khóa học nào</h3>
            <p className="text-gray-500 mb-6">Tạo khóa học đầu tiên để bắt đầu</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400/70 text-white font-medium rounded-2xl hover:bg-primary-500/75 transition-colors"
            >
              <Plus size={20} />
              Tạo Khóa Học
            </button>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b glass-divider border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Tạo Khóa Học Mới</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 glass-nav-hover rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên Khóa Học *</label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="VD: Lập Trình Python Cơ Bản"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô Tả</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Mô tả về khóa học..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số Tín Chỉ</label>
                  <input
                    type="number"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Học Phí (VNĐ)</label>
                  <input
                    type="number"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tên ngành</label>
                <input
                  type="text"
                  value={courseForm.faculty}
                  onChange={(e) => setCourseForm({ ...courseForm, faculty: e.target.value })}
                  className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="VD: Công nghệ thông tin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Chuyên ngành</label>
                <select
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                >
                  {CATEGORY_OPTIONS.filter(c => c.value !== 'all').map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Học Kỳ</label>
                <select
                  value={courseForm.semester}
                  onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                  className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                >
                  {SEMESTER_OPTIONS.map((semester) => (
                    <option key={semester} value={semester}>
                      Học Kỳ {semester}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border glass-divider border rounded-xl glass-nav-hover"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-400/70 text-white rounded-xl hover:bg-primary-500/75"
                >
                  Tạo Khóa Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showDocumentModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b glass-divider border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Thêm Tài Liệu</h2>
                  <p className="text-sm text-gray-500">{selectedCourse.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedCourse(null);
                    setExternalUrl('');
                    setDocumentSourceType('upload');
                  }}
                  className="p-2 glass-nav-hover rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4">
              {/* Source Type Toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">Nguồn Tài Liệu</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentSourceType('upload');
                      setExternalUrl('');
                      setSelectedFile(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                      documentSourceType === 'upload'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'glass-divider border hover:border-gray-300'
                    }`}
                  >
                    <Upload size={18} />
                    <span className="font-medium">Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentSourceType('google_drive');
                      setSelectedFile(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                      documentSourceType === 'google_drive'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'glass-divider border hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0L6 4.5v6L12 24l6-13.5v-6L12 0zm0 2.25l4.5 1.5v4.5L12 12l-4.5-3.75v-4.5L12 2.25zm0 3.75l-3-1.5v9l3-1.5 3 1.5v-9l-3 1.5z"/>
                    </svg>
                    <span className="font-medium">Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentSourceType('external_link');
                      setSelectedFile(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                      documentSourceType === 'external_link'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'glass-divider border hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span className="font-medium">Link Khác</span>
                  </button>
                </div>
              </div>

              {/* File Upload Section */}
              {documentSourceType === 'upload' && (
                <div>
                  <label className="block text-sm font-medium mb-1">File *</label>
                  <div className="border-2 border-dashed glass-divider border rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar,.pptx,.xlsx,.txt"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {selectedFile ? (
                        <div className="text-primary-600">
                          <FileText size={32} className="mx-auto mb-2" />
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          <Upload size={32} className="mx-auto mb-2" />
                          <p>Click để chọn file</p>
                          <p className="text-xs mt-1">
                            PDF, DOC, DOCX, JPG, PNG, ZIP, RAR, PPTX, XLSX, TXT
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* External URL Section */}
              {documentSourceType !== 'upload' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {documentSourceType === 'google_drive' ? 'Link Google Drive *' : 'Đường Dẫn *'}
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    placeholder={
                      documentSourceType === 'google_drive'
                        ? 'https://drive.google.com/...'
                        : 'https://...'
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {documentSourceType === 'google_drive'
                      ? 'Hỗ trợ: Google Drive, Google Docs, Google Slides'
                      : 'Hỗ trợ: Dropbox, OneDrive, SharePoint, hoặc bất kỳ link nào'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Tiêu Đề Tài Liệu</label>
                <input
                  type="text"
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                  className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Để trống sẽ dùng tên file"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô Tả</label>
                <textarea
                  value={documentForm.description}
                  onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                  className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="Mô tả về tài liệu..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại Tài Liệu</label>
                  <select
                    value={documentForm.documentType}
                    onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value })}
                    className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  >
                    <option value="pdf">PDF</option>
                    <option value="slide">Slide</option>
                    <option value="source_code">Source Code</option>
                    <option value="exam">Đề Thi</option>
                    <option value="assignment">Bài Tập</option>
                    <option value="checklist">Checklist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá (VNĐ)</label>
                  <input
                    type="number"
                    value={documentForm.price}
                    onChange={(e) => setDocumentForm({ ...documentForm, price: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={documentForm.tags}
                  onChange={(e) => setDocumentForm({ ...documentForm, tags: e.target.value })}
                  className="w-full px-4 py-2 border glass-divider border rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="python, lap-trinh, co-ban (phân cách bằng dấu phẩy)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedCourse(null);
                    setExternalUrl('');
                    setDocumentSourceType('upload');
                  }}
                  className="flex-1 px-4 py-2 border glass-divider border rounded-xl glass-nav-hover"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-primary-400/70 text-white rounded-xl hover:bg-primary-500/75 disabled:opacity-50"
                >
                  {uploading ? 'Đang tải lên...' : 'Thêm Tài Liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorCourses;
