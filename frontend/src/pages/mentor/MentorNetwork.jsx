import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Calendar,
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
  'mentorProfile.gpa': Number(form.gpa) || 0,
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
  'mentorProfile.exerciseTemplates': parseLines(form.exerciseTemplates, line => {
    const [title, subjectCode, level, url, description] = line.split('|').map(part => part.trim());
    return { title, subjectCode, level: level || 'intermediate', url, description };
  }),
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
  const [bookingMentor, setBookingMentor] = useState(null);
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
      toast.error(error.response?.data?.message || 'Khong the tai du lieu mentor');
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
              <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">Mentor Network</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                Tim mentor theo mon hoc, nang luc thuc chien, project mau va feedback tu cac buoi hoc da hoan thanh.
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
        {isMentorUser && <MentorProfileEditor user={user} onSaved={loadData} />}

        <FeatureStrip topMentors={topMentors} popularDocs={popularDocs} topRatedDocs={topRatedDocs} onOpenMentor={(mentor) => navigate(`/mentors/${mentor._id}`)} />

        {suggestions.length > 0 && (
          <section>
            <SectionTitle icon={Sparkles} title={isMentorUser ? 'Goi y mentor cung linh vuc' : 'Goi y mentor phu hop'} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {suggestions.slice(0, 4).map(mentor => (
                <MentorCard key={mentor._id} mentor={mentor} compact onOpen={() => navigate(`/mentors/${mentor._id}`)} onBook={() => setBookingMentor(mentor)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
            <SectionTitle icon={Search} title="Tim kiem mentor" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full xl:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={filters.search}
                  onChange={(event) => setFilters(prev => ({ ...prev, search: event.target.value }))}
                  placeholder="Ten, ky nang, project..."
                  className="glass-input w-full md:w-72 pl-10 pr-3 py-2.5"
                />
              </div>
              <select
                value={filters.subject}
                onChange={(event) => setFilters(prev => ({ ...prev, subject: event.target.value }))}
                className="glass-input px-3 py-2.5"
              >
                <option value="">Tat ca mon</option>
                {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <select
                value={filters.sortBy}
                onChange={(event) => setFilters(prev => ({ ...prev, sortBy: event.target.value }))}
                className="glass-input px-3 py-2.5"
              >
                <option value="rating">Rating tot nhat</option>
                <option value="mentorProfile.totalSessions">Nhieu session</option>
                <option value="mentorProfile.pricePerHour">Gia cao den thap</option>
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
                <MentorCard key={mentor._id} mentor={mentor} onOpen={() => navigate(`/mentors/${mentor._id}`)} onBook={() => setBookingMentor(mentor)} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-10 text-center text-gray-500">Khong tim thay mentor phu hop.</div>
          )}
        </section>
      </main>

      {selectedMentor && (
        <MentorDetailModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          onBook={() => setBookingMentor(selectedMentor)}
          navigate={navigate}
        />
      )}
      {bookingMentor && <BookingModal mentor={bookingMentor} onClose={() => setBookingMentor(null)} />}
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
    <FeaturePanel title="Tai lieu xem nhieu" icon={BookOpen}>
      {popularDocs.map(doc => <DocumentMini key={doc._id} doc={doc} metric={`${doc.downloads || 0} luot tai`} />)}
    </FeaturePanel>
    <FeaturePanel title="Rating tot nhat" icon={Star}>
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

const MentorCard = ({ mentor, onOpen, onBook, compact = false }) => {
  const p = mentor.mentorProfile || {};
  const promoted = p.promotion?.isPromoted && (!p.promotion?.paidUntil || new Date(p.promotion.paidUntil) > new Date());
  return (
    <div className="glass-card glass-hover-card rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <img src={mentor.avatar || avatarFor(mentor)} alt={mentor.name} className="w-14 h-14 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">{mentor.name}</h3>
            {promoted && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full">Uu tien</span>}
          </div>
          <p className="text-sm text-gray-500 truncate">{p.title || p.major || 'Mentor'}</p>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <Rating value={p.documentRating || 0} />
            <span className="text-gray-400">({p.documentReviewCount || 0})</span>
          </div>
        </div>
      </div>

      {!compact && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 min-h-[3.75rem]">{p.bio || p.experience || 'Mentor chua cap nhat gioi thieu.'}</p>}

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
          <p className="text-lg font-bold text-primary-600">{Number(p.pricePerHour || 0).toLocaleString()}d</p>
          <p className="text-xs text-gray-500">moi gio</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onOpen} className="glass-nav-link px-3 py-2 rounded-xl">Ho so</button>
          <button onClick={onBook} className="bg-primary-500 text-white px-3 py-2 rounded-xl hover:bg-primary-600">Dat lich</button>
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

const MentorDetailModal = ({ mentor, onClose, onBook, navigate }) => {
  const p = mentor.mentorProfile || {};
  const [reviews, setReviews] = useState([]);
  const [mentorDocuments, setMentorDocuments] = useState([]);
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
      })
      .catch(() => {
        setReviews([]);
        setMentorDocuments([]);
      });
  }, [mentor._id]);

  const submitReview = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await mentorService.addReview(mentor._id, reviewForm);
      toast.success('Da gui feedback mentor');
      const res = await mentorService.getReviews(mentor._id);
      setReviews(res.data?.data?.reviews || []);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chi co the review sau buoi hoc da hoan thanh');
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
                <span>{p.documentReviewCount || 0} danh gia tai lieu</span>
                <span>{p.totalSessions || 0} sessions</span>
                <span>{Number(p.pricePerHour || 0).toLocaleString()}d/gio</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="glass-nav-link p-2 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <DetailSection icon={GraduationCap} title="Thong tin ca nhan">
              <p className="text-gray-600 dark:text-gray-300">{p.bio || 'Mentor chua cap nhat gioi thieu.'}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Stat label="Nganh" value={p.major || '-'} />
                <Stat label="GPA" value={p.gpa || '-'} />
                <Stat label="Mon da qua" value={(p.passedSubjects || []).length} />
                <Stat label="Kinh nghiem" value={p.experience ? 'Co' : '-'} />
              </div>
            </DetailSection>

            <DetailSection icon={Award} title="Thanh tuu">
              <ItemList items={p.achievements} empty="Chua co thanh tuu" render={a => <RichItem title={a.title} meta={[a.issuer, a.year].filter(Boolean).join(' - ')} description={a.description} />} />
            </DetailSection>

            <DetailSection icon={FileText} title="Mau demo va bai tap">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ItemList items={p.demoMaterials} empty="Chua co demo" render={m => <RichItem title={m.title} meta={m.url} description={m.description} link={m.url} />} />
                <ItemList items={p.exerciseTemplates} empty="Chua co bai tap mau" render={e => <RichItem title={e.title} meta={`${e.subjectCode || ''} ${e.level || ''}`} description={e.description} link={e.url} />} />
              </div>
            </DetailSection>

            <DetailSection icon={Briefcase} title="Project">
              <ItemList items={p.projects} empty="Chua co project" render={project => (
                <RichItem title={project.title} meta={[project.role, (project.techStack || []).join(', ')].filter(Boolean).join(' - ')} description={project.description} link={project.url} />
              )} />
            </DetailSection>

            <DetailSection icon={BookOpen} title="Tai lieu cua mentor">
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
                          <p className="text-xs text-gray-500 mt-1">{doc.subjectCode || 'Khong ro mon'} • {doc.documentType || 'pdf'}</p>
                        </div>
                        <Rating value={doc.avgRating || doc.rating || 0} />
                      </div>
                      {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{doc.description}</p>}
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>{doc.reviewCount || doc.totalReviews || 0} danh gia</span>
                        <span>{doc.sourceType === 'google_drive' ? 'Google Drive' : doc.sourceType === 'external_link' ? 'External link' : 'File upload'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Chua co tai lieu.</p>
              )}
            </DetailSection>
          </div>

          <aside className="space-y-5">
            <div className="glass-card rounded-2xl p-5">
              <button onClick={onBook} className="w-full bg-primary-500 text-white rounded-xl py-3 font-semibold hover:bg-primary-600 flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                Dat lich mentor
              </button>
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
                <textarea value={reviewForm.comment} onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))} rows={3} className="glass-input w-full px-3 py-2" placeholder="Feedback sau buoi hoc..." />
                <button disabled={submitting} className="w-full glass-nav-link bg-primary-400/70 text-white rounded-xl py-2 disabled:opacity-50">
                  {submitting ? 'Dang gui...' : 'Gui feedback'}
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
                )) : <p className="text-sm text-gray-500">Chua co feedback.</p>}
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
      toast.error('Vui long chon file');
      return;
    }

    if (sourceType !== 'upload' && !form.externalUrl) {
      toast.error('Vui long nhap link tai lieu');
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
      toast.success('Da them tai lieu ca nhan');
      setForm({ title: '', description: '', subjectCode: '', semester: '1', documentType: 'pdf', tags: '', externalUrl: '' });
      setSelectedFile(null);
      setSourceType('upload');
      await loadDocuments();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the them tai lieu');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Ban co chac muon xoa tai lieu nay?')) return;
    try {
      await documentService.delete(docId);
      toast.success('Da xoa tai lieu');
      await loadDocuments();
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the xoa tai lieu');
    }
  };

  return (
    <section className="glass-card rounded-2xl p-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary-500" />
        <h3 className="text-xl font-bold">Tai lieu ca nhan cua mentor</h3>
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
        <p className="text-sm text-gray-500">Dang tai danh sach tai lieu...</p>
      ) : documents.length ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc._id} className="glass-subtle rounded-xl p-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{doc.title}</p>
                <p className="text-xs text-gray-500 mt-1">{doc.subjectCode || 'Khong ro mon'} • {doc.documentType || 'pdf'} • {doc.sourceType === 'google_drive' ? 'Google Drive' : doc.sourceType === 'external_link' ? 'External link' : 'File upload'}</p>
                {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{doc.description}</p>}
              </div>
              <button type="button" onClick={() => handleDelete(doc._id)} className="text-red-500 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Chua co tai lieu ca nhan nao.</p>
      )}
    </section>
  );
};

const MentorProfileEditor = ({ user, onSaved }) => {
  const [form, setForm] = useState({ ...emptyProfile, name: user?.name || '', avatar: user?.avatar || '' });
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    setForm({ ...emptyProfile, ...profileToForm(user), name: user?.name || '', avatar: user?.avatar || '' });
  }, [user]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await mentorService.updateProfile(user._id, formToPayload(form));
      const updated = res.data?.data;
      if (updated) localStorage.setItem('user', JSON.stringify(updated));
      toast.success('Da cap nhat profile mentor');
      onSaved?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the cap nhat profile');
    } finally {
      setSaving(false);
    }
  };

  const activatePromotion = async () => {
    setPromoting(true);
    try {
      const res = await mentorService.activatePromotion({
        mentorId: user._id,
        days: 7,
        priorityScore: 100,
        campaignName: 'Uu tien tim kiem 7 ngay',
      });
      const updated = res.data?.data?.mentor;
      if (updated) localStorage.setItem('user', JSON.stringify(updated));
      toast.success('Da bat uu tien de xuat trong 7 ngay');
      onSaved?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the bat uu tien de xuat');
    } finally {
      setPromoting(false);
    }
  };

  const promotion = user?.mentorProfile?.promotion;
  const isPromoted = promotion?.isPromoted && (!promotion?.paidUntil || new Date(promotion.paidUntil) > new Date());

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><BadgeCheck className="w-6 h-6 text-primary-500" />Profile mentor cua ban</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isPromoted
              ? `Dang duoc uu tien den ${new Date(promotion.paidUntil).toLocaleDateString('vi-VN')}`
              : 'Bat goi uu tien de len dau ket qua tim kiem va goi y.'}
          </p>
        </div>
        <button
          type="button"
          onClick={activatePromotion}
          disabled={promoting}
          className="bg-amber-500 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
          Uu tien 7 ngay
        </button>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Input label="Ho ten" value={form.name} onChange={v => update('name', v)} />
        <Input label="Avatar URL" value={form.avatar} onChange={v => update('avatar', v)} />
        <Input label="Chuc danh" value={form.title} onChange={v => update('title', v)} />
        <Input label="Nganh" value={form.major} onChange={v => update('major', v)} />
        <Input label="GPA" value={form.gpa} onChange={v => update('gpa', v)} />
        <Input label="Gia moi gio" value={form.pricePerHour} onChange={v => update('pricePerHour', v)} />
        <Input label="Chuyen mon, cach nhau bang dau phay" value={form.expertise} onChange={v => update('expertise', v)} className="lg:col-span-2" />
        <Input label="Mon da qua, cach nhau bang dau phay" value={form.passedSubjects} onChange={v => update('passedSubjects', v)} className="lg:col-span-2" />
        <Textarea label="Gioi thieu ca nhan" value={form.bio} onChange={v => update('bio', v)} />
        <Textarea label="Kinh nghiem" value={form.experience} onChange={v => update('experience', v)} />
        <Textarea label="Thanh tuu: title | issuer | year | description" value={form.achievements} onChange={v => update('achievements', v)} />
        <Textarea label="Demo: title | url | description" value={form.demoMaterials} onChange={v => update('demoMaterials', v)} />
        <Textarea label="Bai tap mau: title | subject | level | url | description" value={form.exerciseTemplates} onChange={v => update('exerciseTemplates', v)} />
        <Textarea label="Project: title | role | tech1, tech2 | url | description" value={form.projects} onChange={v => update('projects', v)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isAvailable} onChange={e => update('isAvailable', e.target.checked)} />
          Dang nhan lich mentor
        </label>
        <div className="lg:col-span-2 flex justify-end">
          <button disabled={saving} className="bg-primary-500 text-white rounded-xl px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Luu profile
          </button>
        </div>
      </form>
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

const BookingModal = ({ mentor, onClose }) => {
  const [form, setForm] = useState({
    subject: mentor.mentorProfile?.expertise?.[0] || '',
    topic: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await mentorService.createBooking({ ...form, mentorId: mentor._id });
      toast.success('Da tao lich mentor');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the tao lich mentor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 glass-overlay z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-modal rounded-3xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={mentor.avatar || avatarFor(mentor)} alt={mentor.name} className="w-12 h-12 rounded-full" />
            <div>
              <h3 className="font-bold text-lg">Dat lich voi {mentor.name}</h3>
              <p className="text-sm text-gray-500">{Number(mentor.mentorProfile?.pricePerHour || 0).toLocaleString()}d/gio</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="glass-nav-link p-2 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <select required value={form.subject} onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))} className="glass-input w-full px-3 py-2">
          <option value="">Chon mon</option>
          {(mentor.mentorProfile?.expertise || subjects).map(subject => <option key={subject} value={subject}>{subject}</option>)}
        </select>
        <input required value={form.topic} onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="Chu de can mentor" className="glass-input w-full px-3 py-2" />
        <div className="grid grid-cols-3 gap-3">
          <input required type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} className="glass-input px-3 py-2" />
          <input required type="time" value={form.startTime} onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))} className="glass-input px-3 py-2" />
          <input required type="time" value={form.endTime} onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))} className="glass-input px-3 py-2" />
        </div>
        <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Ghi chu them" className="glass-input w-full px-3 py-2" />
        <button disabled={submitting} className="w-full bg-primary-500 text-white rounded-xl py-3 disabled:opacity-50">
          {submitting ? 'Dang tao lich...' : 'Xac nhan dat lich'}
        </button>
      </form>
    </div>
  );
};

const avatarFor = (mentor) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor._id || mentor.email || mentor.name}`;
