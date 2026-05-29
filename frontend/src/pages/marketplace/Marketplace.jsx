import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { courseService, documentService } from '../../services/api';
import { Search, Grid, List, Star, Download, Heart, BookOpen, X, ChevronRight, Book } from 'lucide-react';

const Marketplace = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [viewMode, setViewMode] = useState('grid');
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    type: '',
    semester: '',
    minPrice: '',
    maxPrice: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load documents when course or filters change
  useEffect(() => {
    if (selectedCourse) {
      loadDocuments();
    }
  }, [selectedCourse, localFilters]);

  const loadCourses = async () => {
    try {
      const response = await courseService.getAll({ limit: 100 });
      const courseList = response.data?.courses 
        || response.data?.data?.courses 
        || response.data?.data 
        || [];
      setCourses(Array.isArray(courseList) ? courseList : []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]);
    }
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const params = {
        subjectCode: selectedCourse.code,
        limit: 12,
        ...(localFilters.type && { type: localFilters.type }),
        ...(localFilters.semester && { semester: localFilters.semester }),
        ...(localFilters.minPrice && { minPrice: localFilters.minPrice }),
        ...(localFilters.maxPrice && { maxPrice: localFilters.maxPrice }),
      };
      
      const response = await documentService.getAll(params);
      const data = response.data;
      
      const docList = data?.documents || data?.data?.documents || data?.data || data || [];
      const pageInfo = data?.pagination || data?.data?.pagination || { page: 1, total: 0, pages: 0 };
      
      setDocuments(Array.isArray(docList) ? docList : []);
      setPagination(pageInfo);
      
      console.log('Loaded documents:', docList.length, 'for course:', selectedCourse.code);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setLocalFilters({ type: '', semester: '', minPrice: '', maxPrice: '' });
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setDocuments([]);
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setLocalFilters({ type: '', semester: '', minPrice: '', maxPrice: '' });
  };

  const filteredCourses = courses.filter(course => 
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const types = [
    { value: 'pdf', label: 'PDF' },
    { value: 'slide', label: 'Slide' },
    { value: 'source_code', label: 'Source Code' },
    { value: 'exam', label: 'Đề thi' },
    { value: 'assignment', label: 'Bài tập' },
    { value: 'checklist', label: 'Checklist' },
  ];

  const semesters = [
    { value: '1', label: 'Học kỳ 1' },
    { value: '2', label: 'Học kỳ 2' },
    { value: '3', label: 'Học kỳ 3' },
    { value: 'summer', label: 'Summer' },
  ];

  // ==================== COURSE LIST VIEW ====================
  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Marketplace Học Liệu</h1>
            <p className="text-lg text-primary-100 mb-8">Chọn môn học để xem tài liệu</p>
            
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm môn học (VD: SWP, PRJ...)"
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Book className="text-primary-600" />
            Danh sách môn học
          </h2>
          
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Đang tải danh sách môn học...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  onClick={() => handleSelectCourse(course)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer group p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                      <BookOpen className="text-primary-600" size={28} />
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" size={20} />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{course.code}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {course.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {course.credits} tín chỉ
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      HK{course.semester}
                    </span>
                  </div>
                  {course.documentCount > 0 && (
                    <p className="text-xs text-primary-600 mt-2">
                      {course.documentCount} tài liệu
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== DOCUMENTS VIEW ====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={handleBackToCourses}
            className="flex items-center gap-2 text-primary-200 hover:text-white mb-4"
          >
            ← Quay lại danh sách môn học
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{selectedCourse.code}</h1>
              <p className="text-primary-200">
                {selectedCourse.name} • {pagination.total} tài liệu
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* FILTERS SIDEBAR */}
          <aside className="lg:w-72">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="font-semibold text-lg mb-4">Bộ lọc</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Loại tài liệu</label>
                <div className="space-y-2">
                  {types.map(t => (
                    <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={t.value}
                        checked={localFilters.type === t.value}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm">{t.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value=""
                      checked={localFilters.type === ''}
                      onChange={(e) => handleFilterChange('type', '')}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm font-medium">Tất cả</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Học kỳ</label>
                <div className="space-y-2">
                  {semesters.map(s => (
                    <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="semester"
                        value={s.value}
                        checked={localFilters.semester === s.value}
                        onChange={(e) => handleFilterChange('semester', e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="semester"
                      value=""
                      checked={localFilters.semester === ''}
                      onChange={(e) => handleFilterChange('semester', '')}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm font-medium">Tất cả</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Khoảng giá</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Từ"
                    value={localFilters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Đến"
                    value={localFilters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleClearFilters}
                className="w-full py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2"
              >
                <X size={18} />
                Xóa bộ lọc
              </button>
            </div>
          </aside>

          {/* DOCUMENTS LIST */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-600 dark:text-gray-400">
                {pagination.total} tài liệu
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl h-72 animate-pulse" />
                ))}
              </div>
            ) : documents.length > 0 ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {documents.map(doc => (
                  <DocumentCard key={doc._id} document={doc} viewMode={viewMode} isAuthenticated={isAuthenticated} navigate={navigate} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Không có tài liệu nào phù hợp</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const DocumentCard = ({ document, viewMode = 'grid', isAuthenticated, navigate }) => {
  const typeLabels = {
    pdf: 'PDF',
    slide: 'Slide',
    source_code: 'Code',
    exam: 'Đề thi',
    assignment: 'Bài tập',
    checklist: 'Checklist',
  };

  const handleBuy = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/checkout/document/${document._id}`);
  };

  const handleCardClick = () => {
    navigate(`/documents/${document._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all group cursor-pointer ${viewMode === 'list' ? 'flex' : ''}`}
    >
      <div className={`relative ${viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-40'}`}>
        <img
          src={document.previewImages?.[0] || `https://picsum.photos/seed/${document._id}/300/200`}
          alt={document.title}
          className={`w-full h-full object-cover ${viewMode === 'list' ? 'rounded-l-xl' : 'rounded-t-xl'}`}
        />
        <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
          <Heart size={16} className="text-gray-600 hover:text-red-500" />
        </button>
        {document.isPremium && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
              Premium
            </span>
          </div>
        )}
        {document.isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full flex items-center gap-1">
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              Nổi bật
            </span>
          </div>
        )}
      </div>
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
        <div>
          <h3 className={`font-semibold mb-2 line-clamp-2 group-hover:text-primary-600 ${viewMode === 'list' ? 'text-lg' : 'text-sm'}`}>
            {document.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
              {typeLabels[document.documentType] || document.documentType}
            </span>
            <span className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              {document.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download size={14} />
              {document.downloads}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-primary-600">
            {document.price?.toLocaleString()}đ
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {document.pageCount > 0 ? `${document.pageCount} trang` : document.fileSize}
            </span>
            <button
              onClick={handleBuy}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
