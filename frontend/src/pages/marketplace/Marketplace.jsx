import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { documentService } from '../../services/api';
import { Book, BookOpen, ChevronRight, Download, Grid, Heart, List, Search, Star, X } from 'lucide-react';

const categoryOptions = [
  { value: 'software_engineering', label: 'Software Engineering', hint: 'SWP, PRJ, DBI, MAD' },
  { value: 'marketing', label: 'Marketing', hint: 'COM, MKT' },
  { value: 'communication', label: 'Truyen thong', hint: 'Communication' },
  { value: 'business', label: 'Kinh doanh', hint: 'Business' },
  { value: 'design', label: 'Thiet ke', hint: 'Design' },
  { value: 'data_science', label: 'Khoa hoc du lieu', hint: 'Data' },
  { value: 'other', label: 'Khac', hint: 'Mon hoc khac' },
];

const typeLabels = {
  pdf: 'PDF',
  slide: 'Slide',
  source_code: 'Code',
  exam: 'De thi',
  assignment: 'Bai tap',
  checklist: 'Checklist',
};

const inferCategory = (doc) => {
  const subject = String(doc.subjectCode || '').toUpperCase();
  if (['SWP', 'PRJ', 'DBI', 'MAD'].some((prefix) => subject.startsWith(prefix))) return 'software_engineering';
  if (['COM', 'MKT'].some((prefix) => subject.startsWith(prefix))) return 'marketing';
  if (doc.category) return doc.category;
  return 'other';
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [viewMode, setViewMode] = useState('grid');
  const [allDocuments, setAllDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    type: '',
    semester: '',
    minPrice: '',
    maxPrice: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setSubjects([]);
      return;
    }

    const subjectMap = new Map();
    allDocuments
      .filter((doc) => inferCategory(doc) === selectedCategory.value)
      .forEach((doc) => {
        const code = doc.subjectCode || 'OTHER';
        const current = subjectMap.get(code) || {
          code,
          documentCount: 0,
        };
        current.documentCount += 1;
        subjectMap.set(code, current);
      });

    setSubjects([...subjectMap.values()].sort((a, b) => a.code.localeCompare(b.code)));
  }, [allDocuments, selectedCategory]);

  useEffect(() => {
    if (selectedSubject) loadDocuments();
  }, [selectedSubject, localFilters]);

  const loadCatalog = async () => {
    try {
      const response = await documentService.getAll({ limit: 500 });
      const docList = response.data?.data?.documents || response.data?.documents || [];
      setAllDocuments(Array.isArray(docList) ? docList : []);
    } catch (error) {
      console.error('Failed to load marketplace catalog:', error);
      setAllDocuments([]);
    }
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const params = {
        category: selectedCategory?.value,
        subjectCode: selectedSubject.code,
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
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setSelectedSubject(null);
    setDocuments([]);
    setSearchQuery('');
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setLocalFilters({ type: '', semester: '', minPrice: '', maxPrice: '' });
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubject(null);
    setDocuments([]);
    setSearchQuery('');
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setDocuments([]);
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setLocalFilters({ type: '', semester: '', minPrice: '', maxPrice: '' });
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryCounts = categoryOptions.map((category) => ({
    ...category,
    documentCount: allDocuments.filter((doc) => inferCategory(doc) === category.value).length,
  }));

  const types = [
    { value: 'pdf', label: 'PDF' },
    { value: 'slide', label: 'Slide' },
    { value: 'source_code', label: 'Source Code' },
    { value: 'exam', label: 'De thi' },
    { value: 'assignment', label: 'Bai tap' },
    { value: 'checklist', label: 'Checklist' },
  ];

  const semesters = [
    { value: '1', label: 'Hoc ky 1' },
    { value: '2', label: 'Hoc ky 2' },
    { value: '3', label: 'Hoc ky 3' },
    { value: 'summer', label: 'Summer' },
  ];

  if (!selectedCategory) {
    return (
      <div className="min-h-screen">
        <Hero title="Marketplace Hoc Lieu" subtitle="Chon chuyen nganh truoc khi vao mon hoc." />
        <div className="container mx-auto px-4 py-8">
          <SectionTitle title="Chuyen nganh" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryCounts.map((category) => (
              <SelectCard
                key={category.value}
                title={category.label}
                subtitle={category.hint}
                metric={`${category.documentCount} tai lieu`}
                onClick={() => handleSelectCategory(category)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedSubject) {
    return (
      <div className="min-h-screen">
        <Hero
          title={selectedCategory.label}
          subtitle="Chon mon hoc de xem tai lieu."
          backLabel="Quay lai chuyen nganh"
          onBack={handleBackToCategories}
        >
          <div className="relative max-w-xl mt-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tim mon hoc (VD: SWP, PRJ...)"
              className="glass-input glass-hover-card w-full pl-12 pr-4 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400/40"
            />
          </div>
        </Hero>

        <div className="container mx-auto px-4 py-8">
          <SectionTitle title="Danh sach mon hoc" />
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Chua co mon hoc nao trong chuyen nganh nay.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSubjects.map((subject) => (
                <SelectCard
                  key={subject.code}
                  title={subject.code}
                  subtitle={selectedCategory.label}
                  metric={`${subject.documentCount} tai lieu`}
                  onClick={() => handleSelectSubject(subject)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Hero
        title={selectedSubject.code}
        subtitle={`${selectedCategory.label} - ${pagination.total} tai lieu`}
        backLabel="Quay lai danh sach mon hoc"
        onBack={handleBackToSubjects}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72">
            <div className="glass-card glass-hover-card rounded-2xl p-6 sticky top-4">
              <h3 className="font-semibold text-lg mb-4">Bo loc</h3>

              <FilterRadioGroup label="Loai tai lieu" name="type" options={types} value={localFilters.type} onChange={(value) => handleFilterChange('type', value)} />
              <FilterRadioGroup label="Hoc ky" name="semester" options={semesters} value={localFilters.semester} onChange={(value) => handleFilterChange('semester', value)} />

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Khoang gia</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Tu"
                    value={localFilters.minPrice}
                    onChange={(event) => handleFilterChange('minPrice', event.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl glass-input text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Den"
                    value={localFilters.maxPrice}
                    onChange={(event) => handleFilterChange('maxPrice', event.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl glass-input text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <button onClick={handleClearFilters} className="w-full py-2 text-gray-600 dark:text-gray-400 glass-nav-hover rounded-xl flex items-center justify-center gap-2">
                <X size={18} />
                Xoa bo loc
              </button>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-600 dark:text-gray-400">{pagination.total} tai lieu</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('grid')} className={`glass-nav-link glass-chip p-2 rounded-xl ${viewMode === 'grid' ? 'glass-nav-active text-primary-600' : 'glass-subtle text-gray-600'}`}>
                  <Grid size={20} />
                </button>
                <button onClick={() => setViewMode('list')} className={`glass-nav-link glass-chip p-2 rounded-xl ${viewMode === 'list' ? 'glass-nav-active text-primary-600' : 'glass-subtle text-gray-600'}`}>
                  <List size={20} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => <div key={index} className="glass-card rounded-2xl h-72 animate-pulse" />)}
              </div>
            ) : documents.length > 0 ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {documents.map((doc) => (
                  <DocumentCard key={doc._id} document={doc} viewMode={viewMode} isAuthenticated={isAuthenticated} navigate={navigate} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass-card rounded-2xl">
                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Khong co tai lieu nao phu hop.</p>
                <button onClick={handleClearFilters} className="mt-4 px-4 py-2 bg-primary-400/70 text-white rounded-xl hover:bg-primary-500/75">
                  Xoa bo loc
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const Hero = ({ title, subtitle, backLabel, onBack, children }) => (
  <div className="glass-hero glass-hero-accent mx-4 mt-2 px-6 py-10 md:px-10">
    <div className="max-w-7xl mx-auto">
      {backLabel && (
        <button onClick={onBack} className="glass-nav-link flex items-center gap-2 text-primary-600 dark:text-primary-300 mb-4 rounded-ios px-2 py-1">
          ← {backLabel}
        </button>
      )}
      <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">{subtitle}</p>
      {children}
    </div>
  </div>
);

const SectionTitle = ({ title }) => (
  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
    <Book className="text-primary-600" />
    {title}
  </h2>
);

const SelectCard = ({ title, subtitle, metric, onClick }) => (
  <div onClick={onClick} className="glass-card glass-hover-card rounded-2xl group p-6 cursor-pointer">
    <div className="flex items-start justify-between mb-4">
      <div className="w-14 h-14 bg-primary-200/40 dark:bg-primary-400/12 rounded-2xl flex items-center justify-center">
        <BookOpen className="text-primary-600" size={28} />
      </div>
      <ChevronRight className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" size={20} />
    </div>
    <h3 className="text-xl font-bold mb-1">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{subtitle}</p>
    <p className="text-xs text-primary-600 mt-2">{metric}</p>
  </div>
);

const FilterRadioGroup = ({ label, name, options, value, onChange }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{label}</label>
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={(event) => onChange(event.target.value)} className="w-4 h-4 text-primary-600" />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="radio" name={name} value="" checked={value === ''} onChange={() => onChange('')} className="w-4 h-4 text-primary-600" />
        <span className="text-sm font-medium">Tat ca</span>
      </label>
    </div>
  </div>
);

const DocumentCard = ({ document, viewMode = 'grid', isAuthenticated, navigate }) => {
  const handleBuy = (event) => {
    event.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/checkout/document/${document._id}`);
  };

  return (
    <div onClick={() => navigate(`/documents/${document._id}`)} className={`glass-card glass-hover-card rounded-2xl group cursor-pointer ${viewMode === 'list' ? 'flex' : ''}`}>
      <div className={`relative ${viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'h-40'}`}>
        <img
          src={document.previewImages?.[0] || `https://picsum.photos/seed/${document._id}/300/200`}
          alt={document.title}
          className={`w-full h-full object-cover ${viewMode === 'list' ? 'rounded-l-xl' : 'rounded-t-xl'}`}
        />
        <button className="glass-nav-link absolute top-3 right-3 p-2 glass-chip rounded-full">
          <Heart size={16} className="text-gray-600 hover:text-red-500" />
        </button>
        {document.isPremium && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">Premium</span>
          </div>
        )}
        {document.isFeatured && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-primary-400/70 text-white text-xs rounded-full flex items-center gap-1">
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              Noi bat
            </span>
          </div>
        )}
      </div>
      <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
        <div>
          <h3 className={`font-semibold mb-2 line-clamp-2 group-hover:text-primary-600 ${viewMode === 'list' ? 'text-lg' : 'text-sm'}`}>{document.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="px-2 py-0.5 glass-subtle rounded">{typeLabels[document.documentType] || document.documentType}</span>
            <span className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              {document.rating || document.avgRating || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download size={14} />
              {document.downloads || 0}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-primary-600">{Number(document.price || 0).toLocaleString()}d</span>
          <button onClick={handleBuy} className="px-4 py-2 bg-primary-400/70 text-white text-sm font-medium rounded-xl hover:bg-primary-500/75 transition-colors">
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
