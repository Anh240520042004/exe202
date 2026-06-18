import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Award,
  BookOpen,
  Briefcase,
  Crown,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  MessageCircle,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentService, mentorService } from '../../services/api';

const subjects = ['SWP391', 'PRJ301', 'DBI202', 'MAD101', 'WED201', 'OSG201', 'MKT101', 'COM101'];

const emptyProfile = {
  title: '',
  bio: '',
  expertise: '',
  major: '',
  gpa: '',
  passedSubjects: '',
  experience: '',
  pricePerHour: '',
  isAvailable: true,
  achievements: '',
  demoMaterials: '',
  exerciseTemplates: '',
  projects: '',
};

const parseLines = (value, mapper) => String(value || '')
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean)
  .map(mapper);

const validTemplateLevels = ['beginner', 'intermediate', 'advanced'];

const normalizeTemplateLevel = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return validTemplateLevels.includes(normalized) ? normalized : null;
};

const looksLikeUrl = (value) => /^(https?:\/\/|www\.)/i.test(String(value || '').trim());

const normalizeGpa = (value) => {
  const gpa = Number(value);
  if (!Number.isFinite(gpa)) return 0;
  return Math.min(4, Math.max(0, gpa));
};

const parseExerciseTemplate = (line) => {
  const parts = line.split('|').map(part => part.trim());
  const [title = '', subjectCode = '', third = '', fourth = '', ...rest] = parts;
  const level = normalizeTemplateLevel(third);

  if (level) {
    return {
      title,
      subjectCode,
      level,
      url: fourth,
      description: rest.join(' | '),
    };
  }

  if (!fourth && !rest.length) {
    return {
      title,
      subjectCode,
      level: 'intermediate',
      url: looksLikeUrl(third) ? third : '',
      description: looksLikeUrl(third) ? '' : third,
    };
  }

  return {
    title,
    subjectCode,
    level: 'intermediate',
    url: looksLikeUrl(third) ? third : (looksLikeUrl(fourth) ? fourth : ''),
    description: [
      looksLikeUrl(third) ? '' : third,
      looksLikeUrl(fourth) ? '' : fourth,
      ...rest,
    ].filter(Boolean).join(' | '),
  };
};

const profileToForm = (user) => {
  const p = user?.mentorProfile || {};
  return {
    title: p.title || '',
    bio: p.bio || '',
    expertise: (p.expertise || []).join(', '),
    major: p.major || '',
    gpa: p.gpa || '',
    passedSubjects: (p.passedSubjects || []).join(', '),
    experience: p.experience || '',
    pricePerHour: p.pricePerHour || '',
    isAvailable: p.isAvailable !== false,
    achievements: (p.achievements || []).map(a => [a.title, a.issuer, a.year, a.description].filter(Boolean).join(' | ')).join('\n'),
    demoMaterials: (p.demoMaterials || []).map(m => [m.title, m.url, m.description].filter(Boolean).join(' | ')).join('\n'),
    exerciseTemplates: (p.exerciseTemplates || []).map(e => [e.title, e.subjectCode, e.level, e.url, e.description].filter(Boolean).join(' | ')).join('\n'),
    projects: (p.projects || []).map(project => [
      project.title,
      project.role,
      (project.techStack || []).join(', '),
      project.url,
      project.description,
    ].filter(Boolean).join(' | ')).join('\n'),
  };
};

const formToPayload = (form) => ({
  name: form.name,
  avatar: form.avatar,
  'mentorProfile.title': form.title,
  'mentorProfile.bio': form.bio,
  'mentorProfile.expertise': form.expertise.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
  'mentorProfile.major': form.major,
  'mentorProfile.gpa': normalizeGpa(form.gpa),
  'mentorProfile.passedSubjects': form.passedSubjects.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
  'mentorProfile.experience': form.experience,
  'mentorProfile.pricePerHour': Number(form.pricePerHour) || 0,
  'mentorProfile.isAvailable': form.isAvailable,
  'mentorProfile.achievements': parseLines(form.achievements, line => {
    const [title, issuer, year, description] = line.split('|').map(part => part.trim());
    return { title, issuer, year, description };
  }),
  'mentorProfile.demoMaterials': parseLines(form.demoMaterials, line => {
    const [title, url, description] = line.split('|').map(part => part.trim());
    return { title, url, description, type: 'link' };
  }),
  'mentorProfile.exerciseTemplates': parseLines(form.exerciseTemplates, parseExerciseTemplate),
  'mentorProfile.projects': parseLines(form.projects, line => {
    const [title, role, techStack, url, description] = line.split('|').map(part => part.trim());
    return { title, role, techStack: techStack ? techStack.split(',').map(t => t.trim()).filter(Boolean) : [], url, description };
  }),
});

export default function MentorNetwork() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [mentors, setMentors] = useState([]);
  const [topMentors, setTopMentors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [popularDocs, setPopularDocs] = useState([]);
  const [topRatedDocs, setTopRatedDocs] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', subject: '', sortBy: 'rating' });

  const isMentorUser = user?.role === 'mentor';

  useEffect(() => {
    loadData();
  }, [filters.search, filters.subject, filters.sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        sortBy: filters.sortBy,
        ...(filters.search && { search: filters.search }),
        ...(filters.subject && { subject: filters.subject }),
      };

      const [allRes, topRes, suggestionRes, popularRes, ratedRes] = await Promise.all([
        mentorService.getAll(params),
        mentorService.getTop({ limit: 6 }),
        isAuthenticated ? mentorService.getSuggestions() : Promise.resolve({ data: { data: { mentors: [] } } }),
        documentService.getPopular({ limit: 5 }),
        documentService.getTopRated({ limit: 5 }),
      ]);

      setMentors(allRes.data?.data?.mentors || []);
      setTopMentors(topRes.data?.data || []);
      setSuggestions(suggestionRes.data?.data?.mentors || []);
      setPopularDocs(popularRes.data?.data || []);
      setTopRatedDocs(ratedRes.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu mentor');
    } finally {
      setLoading(false);
    }
  };

  const averageRating = useMemo(() => {
    if (!mentors.length) return '0.0';
    const total = mentors.reduce((sum, mentor) => sum + Number(mentor.mentorProfile?.documentRating || 0), 0);
    return (total / mentors.length).toFixed(1);
  }, [mentors]);

  return (
    <div className="min-h-screen">
      <section className="glass-hero glass-hero-purple mx-4 mt-2 px-6 py-10 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-3 text-white drop-shadow-lg">Mentor Network</h1>
              <p className="text-lg font-medium text-blue-50/90 drop-shadow max-w-3xl">
                Tìm mentor theo môn học, năng lực thực chiến, dự án mẫu và phản hồi từ các buổi học đã hoàn thành.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 min-w-[320px]">
              <Metric icon={UserRound} label="Mentor" value={mentors.length} />
              <Metric icon={Star} label="Rating" value={averageRating} />
              <Metric icon={MessageCircle} label="Review" value={mentors.reduce((sum, m) => sum + Number(m.mentorProfile?.documentReviewCount || 0), 0)} />
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <FeatureStrip topMentors={topMentors} popularDocs={popularDocs} topRatedDocs={topRatedDocs} onOpenMentor={(mentor) => navigate(`/mentors/${mentor._id}`)} />

        {suggestions.length > 0 && (
          <section>
            <SectionTitle icon={Sparkles} title={isMentorUser ? 'Gợi ý mentor cùng lĩnh vực' : 'Gợi ý mentor phù hợp'} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {suggestions.slice(0, 4).map(mentor => (
                <MentorCard key={mentor._id} mentor={mentor} compact onOpen={() => navigate(`/mentors/${mentor._id}`)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
            <SectionTitle icon={Search} title="Tìm kiếm mentor" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full xl:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={filters.search}
                  onChange={(event) => setFilters(prev => ({ ...prev, search: event.target.value }))}
                  placeholder="Tên, kỹ năng, dự án..."
                  className="glass-input w-full md:w-72 pl-10 pr-3 py-2.5"
                />
              </div>
              <select
                value={filters.subject}
                onChange={(event) => setFilters(prev => ({ ...prev, subject: event.target.value }))}
                className="glass-input px-3 py-2.5"
              >
                <option value="">Tất cả môn</option>
                {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <select
                value={filters.sortBy}
                onChange={(event) => setFilters(prev => ({ ...prev, sortBy: event.target.value }))}
                className="glass-input px-3 py-2.5"
              >
                <option value="rating">Đánh giá tốt nhất</option>
                <option value="mentorProfile.totalSessions">Nhiều buổi học nhất</option>
                <option value="mentorProfile.pricePerHour">Giá từ cao đến thấp</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, index) => <div key={index} className="glass-card rounded-2xl h-72 animate-pulse" />)}
            </div>
          ) : mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {mentors.map(mentor => (
                <MentorCard key={mentor._id} mentor={mentor} onOpen={() => navigate(`/mentors/${mentor._id}`)} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 text-center text-gray-500">Không tìm thấy mentor phù hợp.</div>
          )}
        </section>
      </main>

      {selectedMentor && (
        <MentorDetailModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
}

const Metric = ({ icon: Icon, label, value }) => (
  <div className="glass-chip px-4 py-3">
    <Icon className="w-5 h-5 text-primary-500 mb-1" />
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
    <Icon className="w-6 h-6 text-primary-500" />
    {title}
  </h2>
);

const FeatureStrip = ({ topMentors, popularDocs, topRatedDocs, onOpenMentor }) => (
  <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
    <FeaturePanel title="Top mentor" icon={Crown}>
      {topMentors.slice(0, 4).map((mentor, index) => (
        <button key={mentor._id} onClick={() => onOpenMentor(mentor)} className="w-full flex items-center gap-3 text-left glass-nav-hover rounded-xl p-2">
          <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">{index + 1}</span>
          <img src={mentor.avatar || avatarFor(mentor)} alt={mentor.name} className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{mentor.name}</p>
            <p className="text-xs text-gray-500 truncate">{mentor.mentorProfile?.title || 'Mentor'}</p>
          </div>
          <Rating value={mentor.mentorProfile?.documentRating || 0} />
        </button>
      ))}
    </FeaturePanel>
    <FeaturePanel title="Tài liệu xem nhiều" icon={BookOpen}>
      {popularDocs.map(doc => <DocumentMini key={doc._id} doc={doc} metric={`${doc.downloads || 0} lượt tải`} />)}
    </FeaturePanel>
    <FeaturePanel title="Đánh giá tốt nhất" icon={Star}>
      {topRatedDocs.map(doc => <DocumentMini key={doc._id} doc={doc} metric={`${doc.rating || doc.avgRating || 0} sao`} />)}
    </FeaturePanel>
  </section>
);

const FeaturePanel = ({ title, icon: Icon, children }) => (
  <div className="glass-card rounded-2xl p-5">
    <h3 className="font-bold mb-4 flex items-center gap-2"><Icon className="w-5 h-5 text-primary-500" />{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const DocumentMini = ({ doc, metric }) => (
  <div className="flex items-center gap-3 glass-subtle rounded-xl p-2">
    <img src={doc.previewImages?.[0] || `https://picsum.photos/seed/${doc._id}/80/80`} alt={doc.title} className="w-10 h-10 rounded-lg object-cover" />
    <div className="min-w-0 flex-1">
      <p className="font-medium text-sm truncate">{doc.title}</p>
      <p className="text-xs text-gray-500">{doc.subjectCode} - {metric}</p>
    </div>
  </div>
);

const MentorCard = ({ mentor, onOpen, compact = false }) => {
  const p = mentor.mentorProfile || {};
  const promoted = p.promotion?.isPromoted && (!p.promotion?.paidUntil || new Date(p.promotion.paidUntil) > new Date());
  return (
    <div className="glass-card glass-hover-card rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <img src={mentor.avatar || avatarFor(mentor)} alt={mentor.name} className="w-14 h-14 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">{mentor.name}</h3>
            {promoted && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">Ưu tiên</span>}
          </div>
          <p className="text-sm text-gray-500 truncate">{p.title || p.major || 'Mentor'}</p>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <Rating value={p.documentRating || 0} />
            <span className="text-gray-400">({p.documentReviewCount || 0})</span>
          </div>
        </div>
      </div>

      {!compact && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 min-h-[3.75rem]">{p.bio || p.experience || 'Mentor chưa cập nhật giới thiệu.'}</p>}

      <div className="flex flex-wrap gap-2">
        {(p.expertise || []).slice(0, compact ? 3 : 5).map(item => <span key={item} className="glass-subtle rounded-lg px-2 py-1 text-xs">{item}</span>)}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="GPA" value={p.gpa || '-'} />
        <Stat label="Session" value={p.totalSessions || 0} />
        <Stat label="Project" value={(p.projects || []).length} />
      </div>

      <div className="flex items-center justify-between pt-3 border-t glass-divider">
        <div>
          <p className="text-lg font-bold text-primary-600">{Number(p.pricePerHour || 0).toLocaleString()}đ</p>
          <p className="text-xs text-gray-500">mỗi giờ</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onOpen} className="glass-nav-link px-3 py-2 rounded-xl">Hồ sơ</button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="glass-subtle rounded-lg p-2">
    <p className="font-bold">{value}</p>
    <p className="text-gray-500">{label}</p>
  </div>
);

const Rating = ({ value }) => (
  <span className="inline-flex items-center gap-1">
    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
    <span>{Number(value || 0).toFixed(1)}</span>
  </span>
);

const MentorDetailModal = ({ mentor, onClose, navigate }) => {
  const p = mentor.mentorProfile || {};
  const [reviews, setReviews] = useState([]);
  const [mentorDocuments, setMentorDocuments] = useState([]);
  const [docRestricted, setDocRestricted] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      mentorService.getReviews(mentor._id),
      documentService.getMentorDocuments(mentor._id),
    ])
      .then(([reviewRes, docRes]) => {
        setReviews(reviewRes.data?.data?.reviews || []);
        setMentorDocuments(docRes.data?.data?.documents || []);
        setDocRestricted(Boolean(docRes.data?.data?.restricted));
      })
      .catch(() => {
        setReviews([]);
        setMentorDocuments([]);
        setDocRestricted(false);
      });
  }, [mentor._id]);

  const submitReview = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await mentorService.addReview(mentor._id, reviewForm);
      toast.success('Đã gửi phản hồi thành công');
      const res = await mentorService.getReviews(mentor._id);
      setReviews(res.data?.data?.reviews || []);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chỉ có thể đánh giá sau buổi học đã hoàn thành');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 glass-overlay z-50 p-4 overflow-y-auto">
      <div className="glass-modal rounded-3xl max-w-5xl mx-auto my-6">
        <div className="p-6 border-b glass-divider flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={mentor.avatar || avatarFor(mentor)} alt={mentor.name} className="w-20 h-20 rounded-full object-cover" />
            <div>
              <h2 className="text-2xl font-bold">{mentor.name}</h2>
              <p className="text-gray-500">{p.title || p.major}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                <Rating value={p.documentRating || 0} />
                <span>{p.documentReviewCount || 0} đánh giá tài liệu</span>
                <span>{p.totalSessions || 0} sessions</span>
                <span>{Number(p.pricePerHour || 0).toLocaleString()}đ/giờ</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="glass-nav-link p-2 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DetailSection icon={GraduationCap} title="Thông tin cá nhân">
              <p className="text-gray-600 dark:text-gray-300">{p.bio || 'Mentor chưa cập nhật giới thiệu.'}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Stat label="Ngành" value={p.major || '-'} />
                <Stat label="GPA" value={p.gpa || '-'} />
                <Stat label="Môn đã qua" value={(p.passedSubjects || []).length} />
                <Stat label="Kinh nghiệm" value={p.experience ? 'Có' : '-'} />
              </div>
            </DetailSection>

            <DetailSection icon={Award} title="Thành tựu">
              <ItemList items={p.achievements} empty="Chưa có thành tựu" render={a => <RichItem title={a.title} meta={[a.issuer, a.year].filter(Boolean).join(' - ')} description={a.description} />} />
            </DetailSection>

            <DetailSection icon={FileText} title="Mẫu demo và bài tập">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ItemList items={p.demoMaterials} empty="Chưa có bản demo" render={m => <RichItem title={m.title} meta={m.url} description={m.description} link={m.url} />} />
                <ItemList items={p.exerciseTemplates} empty="Chưa có bài tập mẫu" render={e => <RichItem title={e.title} meta={`${e.subjectCode || ''} ${e.level || ''}`} description={e.description} link={e.url} />} />
              </div>
            </DetailSection>

            <DetailSection icon={Briefcase} title="Project">
              <ItemList items={p.projects} empty="Chưa có project" render={project => (
                <RichItem title={project.title} meta={[project.role, (project.techStack || []).join(', ')].filter(Boolean).join(' - ')} description={project.description} link={project.url} />
              )} />
            </DetailSection>

            <DetailSection icon={BookOpen} title="Tài liệu của mentor">
              {mentorDocuments.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mentorDocuments.map((doc) => (
                    <button
                      key={doc._id}
                      type="button"
                      onClick={() => navigate(`/documents/${doc._id}`)}
                      className="glass-subtle rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{doc.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{doc.subjectCode || 'Không rõ môn'} • {doc.documentType || 'pdf'}</p>
                        </div>
                        <Rating value={doc.avgRating || doc.rating || 0} />
                      </div>
                      {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{doc.description}</p>}
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>{doc.reviewCount || doc.totalReviews || 0} đánh giá</span>
                        <span>{doc.sourceType === 'google_drive' ? 'Google Drive' : doc.sourceType === 'external_link' ? 'External link' : 'File upload'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : docRestricted ? (
                <p className="text-sm text-gray-500">Tai lieu cua mentor nay dang duoc gioi han quyen xem.</p>
              ) : (
                <p className="text-sm text-gray-500">Chưa có tài liệu.</p>
              )}
            </DetailSection>
          </div>

          <aside className="space-y-5">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex flex-wrap gap-2 mt-4">
                {(p.expertise || []).map(item => <span key={item} className="glass-subtle rounded-lg px-2 py-1 text-xs">{item}</span>)}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary-500" />Feedback</h3>
              <form onSubmit={submitReview} className="space-y-3 mb-4">
                <select value={reviewForm.rating} onChange={e => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))} className="glass-input w-full px-3 py-2">
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}
                </select>
                <textarea value={reviewForm.comment} onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))} rows={3} className="glass-input w-full px-3 py-2" placeholder="Feedback sau buổi học..." />
                <button disabled={submitting} className="w-full glass-nav-link bg-primary-400/70 text-white rounded-xl py-2 disabled:opacity-50">
                  {submitting ? 'Đang gửi...' : 'Gửi feedback'}
                </button>
              </form>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {reviews.length ? reviews.map(review => (
                  <div key={review._id} className="glass-subtle rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm">{review.user?.name || 'Student'}</p>
                      <Rating value={review.rating} />
                    </div>
                    {review.comment && <p className="text-sm text-gray-500 mt-1">{review.comment}</p>}
                  </div>
                )) : <p className="text-sm text-gray-500">Chưa có feedback.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const DetailSection = ({ icon: Icon, title, children }) => (
  <section className="glass-card rounded-2xl p-5">
    <h3 className="font-bold mb-3 flex items-center gap-2"><Icon className="w-5 h-5 text-primary-500" />{title}</h3>
    {children}
  </section>
);

const ItemList = ({ items = [], empty, render }) => (
  <div className="space-y-3">
    {items.length ? items.map((item, index) => <div key={item._id || `${item.title}-${index}`}>{render(item)}</div>) : <p className="text-sm text-gray-500">{empty}</p>}
  </div>
);

const RichItem = ({ title, meta, description, link }) => (
  <div className="glass-subtle rounded-xl p-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-semibold">{title || 'Untitled'}</p>
        {meta && <p className="text-xs text-gray-500">{meta}</p>}
      </div>
      {link && <a href={link} target="_blank" rel="noreferrer" className="glass-nav-link p-1 rounded-lg"><ExternalLink className="w-4 h-4" /></a>}
    </div>
    {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>}
  </div>
);

const MentorDocumentManager = ({ user, onChanged }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sourceType, setSourceType] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectCode: '',
    semester: '1',
    documentType: 'pdf',
    tags: '',
    externalUrl: '',
  });

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentService.getMentorDocuments(user._id, { limit: 50 });
      setDocuments(res.data?.data?.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user._id]);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (sourceType === 'upload' && !selectedFile) {
      toast.error('Vui lòng chọn file');
      return;
    }

    if (sourceType !== 'upload' && !form.externalUrl) {
      toast.error('Vui lòng nhập link tài liệu');
      return;
    }

    const formData = new FormData();
    if (selectedFile) formData.append('file', selectedFile);
    if (form.title) formData.append('title', form.title);
    if (form.description) formData.append('description', form.description);
    if (form.subjectCode) formData.append('subjectCode', form.subjectCode);
    if (form.semester) formData.append('semester', form.semester);
    formData.append('documentType', form.documentType);
    if (form.tags) formData.append('tags', form.tags);
    if (sourceType !== 'upload') formData.append('externalUrl', form.externalUrl);

    try {
      setUploading(true);
      await documentService.createMentorProfile(formData);
      toast.success('Đã thêm tài liệu cá nhân thành công');
      setForm({ title: '', description: '', subjectCode: '', semester: '1', documentType: 'pdf', tags: '', externalUrl: '' });
      setSelectedFile(null);
      setSourceType('upload');
      await loadDocuments();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thêm tài liệu');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này?')) return;
    try {
      await documentService.delete(docId);
      toast.success('Đã xóa tài liệu thành công');
      await loadDocuments();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài liệu');
    }
  };

  return (
    <section className="glass-card rounded-2xl p-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary-500" />
        <h3 className="text-xl font-bold">Tài liệu cá nhân của mentor</h3>
      </div>

      <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="lg:col-span-2 flex flex-wrap gap-2">
          {[
            { value: 'upload', label: 'Upload file' },
            { value: 'google_drive', label: 'Google Drive' },
            { value: 'external_link', label: 'Link khac' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSourceType(option.value);
                setSelectedFile(null);
                setForm((prev) => ({ ...prev, externalUrl: '' }));
              }}
              className={`px-4 py-2 rounded-xl border ${sourceType === option.value ? 'bg-primary-500 text-white border-primary-500' : 'glass-nav-hover'}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {sourceType === 'upload' ? (
          <label className="block lg:col-span-2">
            <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">File tai lieu</span>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar,.pptx,.xlsx,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="glass-input w-full px-3 py-2" />
          </label>
        ) : (
          <Input label={sourceType === 'google_drive' ? 'Link Google Drive' : 'Link tai lieu'} value={form.externalUrl} onChange={(v) => setForm((prev) => ({ ...prev, externalUrl: v }))} className="lg:col-span-2" />
        )}

        <Input label="Tieu de" value={form.title} onChange={(v) => setForm((prev) => ({ ...prev, title: v }))} />
        <Input label="Mon hoc" value={form.subjectCode} onChange={(v) => setForm((prev) => ({ ...prev, subjectCode: v.toUpperCase() }))} />
        <Input label="Hoc ky" value={form.semester} onChange={(v) => setForm((prev) => ({ ...prev, semester: v }))} />
        <Input label="Tags" value={form.tags} onChange={(v) => setForm((prev) => ({ ...prev, tags: v }))} />
        <div>
          <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">Loai tai lieu</span>
          <select value={form.documentType} onChange={(e) => setForm((prev) => ({ ...prev, documentType: e.target.value }))} className="glass-input w-full px-3 py-2">
            <option value="pdf">PDF</option>
            <option value="slide">Slide</option>
            <option value="source_code">Source Code</option>
            <option value="exam">De thi</option>
            <option value="assignment">Bai tap</option>
            <option value="checklist">Checklist</option>
          </select>
        </div>
        <Textarea label="Mo ta" value={form.description} onChange={(v) => setForm((prev) => ({ ...prev, description: v }))} />
        <div className="lg:col-span-2 flex justify-end">
          <button disabled={uploading} className="bg-primary-500 text-white rounded-xl px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Dang tai lieu
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải danh sách tài liệu...</p>
      ) : documents.length ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc._id} className="glass-subtle rounded-xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{doc.title}</p>
                <p className="text-xs text-gray-500 mt-1">{doc.subjectCode || 'Không rõ môn'} • {doc.documentType || 'pdf'} • {doc.sourceType === 'google_drive' ? 'Google Drive' : doc.sourceType === 'external_link' ? 'External link' : 'File upload'}</p>
                {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{doc.description}</p>}
              </div>
              <button type="button" onClick={() => handleDelete(doc._id)} className="text-red-500 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Chưa có tài liệu cá nhân nào.</p>
      )}
    </section>
  );
};

const Input = ({ label, value, onChange, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{label}</span>
    <input value={value} onChange={e => onChange(e.target.value)} className="glass-input w-full px-3 py-2" />
  </label>
);

const Textarea = ({ label, value, onChange }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{label}</span>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} className="glass-input w-full px-3 py-2" />
  </label>
);

const avatarFor = (mentor) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor._id || mentor.email || mentor.name}`;
