import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  Star,
} from 'lucide-react';
import { documentService, mentorService } from '../../services/api';

const typeLabels = {
  pdf: 'PDF',
  slide: 'Slide',
  source_code: 'Code',
  exam: 'De thi',
  assignment: 'Bai tap',
  checklist: 'Checklist',
};

export default function MentorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [mentorRes, docRes, reviewRes] = await Promise.all([
          mentorService.getById(id),
          documentService.getMentorDocuments(id, { limit: 100 }),
          mentorService.getReviews(id, { limit: 8 }),
        ]);

        const payload = mentorRes.data?.data || {};
        setMentor(payload.mentor || null);
        setStats(payload.stats || null);
        setDocuments(docRes.data?.data?.documents || []);
        setReviews(reviewRes.data?.data?.reviews || payload.recentReviews || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Khong the tai ho so mentor');
        navigate('/mentors');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!mentor) return null;

  const profile = mentor.mentorProfile || {};

  return (
    <div className="min-h-screen">
      <section className="glass-hero glass-hero-purple mx-4 mt-2 px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate('/mentors')} className="glass-nav-link rounded-xl px-3 py-2 mb-5 flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Quay lai mentors
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <img src={mentor.avatar || avatarFor(mentor)} alt={mentor.name} className="w-24 h-24 rounded-2xl object-cover" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{mentor.name}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">{profile.title || profile.major || 'Mentor'}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600 dark:text-gray-300">
                  <Rating value={profile.rating || profile.documentRating || stats?.averageRating || 0} />
                  <span>{stats?.totalSessions || profile.totalSessions || 0} sessions</span>
                  <span>{Number(profile.pricePerHour || 0).toLocaleString()}d/gio</span>
                </div>
              </div>
            </div>

            <button className="bg-primary-500 text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:bg-primary-600">
              <Calendar className="w-5 h-5" />
              Dat lich mentor
            </button>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfileSection icon={GraduationCap} title="Ho so ca nhan">
            <p className="text-gray-600 dark:text-gray-300">{profile.bio || 'Mentor chua cap nhat gioi thieu.'}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Stat label="Nganh" value={profile.major || '-'} />
              <Stat label="GPA" value={profile.gpa || '-'} />
              <Stat label="Mon da qua" value={(profile.passedSubjects || []).length} />
              <Stat label="Kinh nghiem" value={profile.experience ? 'Co' : '-'} />
            </div>
          </ProfileSection>

          <ProfileSection icon={BookOpen} title="Tai lieu mentor upload len ho so">
            {documents.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((doc) => (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    className="glass-subtle rounded-xl p-4 text-left hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{doc.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {doc.subjectCode || 'Khong ro mon'} - {typeLabels[doc.documentType] || doc.documentType || 'PDF'}
                        </p>
                      </div>
                      <FileText className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    </div>
                    {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{doc.description}</p>}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{doc.sourceType === 'google_drive' ? 'Google Drive' : doc.sourceType === 'external_link' ? 'External link' : 'File upload'}</span>
                      <span>{doc.downloads || 0} luot xem</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Mentor chua upload tai lieu nao len ho so.</p>
            )}
          </ProfileSection>

          <ProfileSection icon={Award} title="Thanh tuu">
            <ItemList items={profile.achievements} empty="Chua co thanh tuu" render={(item) => (
              <RichItem title={item.title} meta={[item.issuer, item.year].filter(Boolean).join(' - ')} description={item.description} />
            )} />
          </ProfileSection>

          <ProfileSection icon={Briefcase} title="Project">
            <ItemList items={profile.projects} empty="Chua co project" render={(item) => (
              <RichItem title={item.title} meta={[item.role, (item.techStack || []).join(', ')].filter(Boolean).join(' - ')} description={item.description} link={item.url} />
            )} />
          </ProfileSection>
        </div>

        <aside className="space-y-6">
          <ProfileSection icon={Star} title="Chuyen mon">
            <div className="flex flex-wrap gap-2">
              {(profile.expertise || []).length
                ? profile.expertise.map((item) => <span key={item} className="glass-subtle rounded-lg px-3 py-1 text-sm">{item}</span>)
                : <p className="text-sm text-gray-500">Chua cap nhat chuyen mon.</p>}
            </div>
          </ProfileSection>

          <ProfileSection icon={FileText} title="Demo va bai tap">
            <div className="space-y-3">
              <ItemList items={profile.demoMaterials} empty="Chua co demo" render={(item) => (
                <RichItem title={item.title} meta={item.url} description={item.description} link={item.url} />
              )} />
              <ItemList items={profile.exerciseTemplates} empty="Chua co bai tap mau" render={(item) => (
                <RichItem title={item.title} meta={[item.subjectCode, item.level].filter(Boolean).join(' - ')} description={item.description} link={item.url} />
              )} />
            </div>
          </ProfileSection>

          <ProfileSection icon={Star} title="Feedback">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reviews.length ? reviews.map((review) => (
                <div key={review._id} className="glass-subtle rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{review.user?.name || review.student?.name || 'Student'}</p>
                    <Rating value={review.rating} />
                  </div>
                  {(review.comment || review.review?.comment) && (
                    <p className="text-sm text-gray-500 mt-1">{review.comment || review.review?.comment}</p>
                  )}
                </div>
              )) : <p className="text-sm text-gray-500">Chua co feedback.</p>}
            </div>
          </ProfileSection>
        </aside>
      </main>
    </div>
  );
}

const ProfileSection = ({ icon: Icon, title, children }) => (
  <section className="glass-card rounded-2xl p-5">
    <h2 className="font-bold mb-3 flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary-500" />
      {title}
    </h2>
    {children}
  </section>
);

const Stat = ({ label, value }) => (
  <div className="glass-subtle rounded-lg p-3">
    <p className="font-bold">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </div>
);

const Rating = ({ value }) => (
  <span className="inline-flex items-center gap-1">
    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
    <span>{Number(value || 0).toFixed(1)}</span>
  </span>
);

const ItemList = ({ items = [], empty, render }) => (
  <div className="space-y-3">
    {items.length ? items.map((item, index) => <div key={item._id || `${item.title}-${index}`}>{render(item)}</div>) : <p className="text-sm text-gray-500">{empty}</p>}
  </div>
);

const RichItem = ({ title, meta, description, link }) => (
  <div className="glass-subtle rounded-xl p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold">{title || 'Untitled'}</p>
        {meta && <p className="text-xs text-gray-500 truncate">{meta}</p>}
      </div>
      {link && <a href={link} target="_blank" rel="noreferrer" className="glass-nav-link p-1 rounded-lg"><ExternalLink className="w-4 h-4" /></a>}
    </div>
    {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>}
  </div>
);

const avatarFor = (mentor) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor._id || mentor.email || mentor.name}`;
