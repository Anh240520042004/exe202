import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import FollowListModal from '../../components/user/FollowListModal';
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
import { userService } from '../../services/userService';

const typeLabels = {
  pdf: 'PDF',
  slide: 'Slide',
  source_code: 'Code',
  exam: 'Đề thi',
  assignment: 'Bài tập',
  checklist: 'Checklist',
};

export default function MentorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [mentor, setMentor] = useState(null);
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followModalType, setFollowModalType] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [mentorRes, docRes, reviewRes, userProfile] = await Promise.all([
          mentorService.getById(id),
          documentService.getMentorDocuments(id, { limit: 100 }),
          mentorService.getReviews(id, { limit: 8 }),
          userService.getUserProfile(id),
        ]);

        const payload = mentorRes.data?.data || {};
        setMentor(payload.mentor || null);
        setStats({
          ...(payload.stats || {}),
          followerCount: userProfile?.stats?.followerCount ?? 0,
          followeeCount: userProfile?.stats?.followeeCount ?? 0,
        });
        setDocuments(docRes.data?.data?.documents || []);
        setReviews(reviewRes.data?.data?.reviews || payload.recentReviews || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể tải hồ sơ mentor');
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
          <button onClick={() => navigate('/mentors')} className="glass-nav-link rounded-xl px-3 py-2 mb-5 flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Quay lại Mentors
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <img src={mentor.avatar || avatarFor(mentor)} alt={mentor.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-white/50 dark:border-white/10" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{mentor.name}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">{profile.title || profile.major || 'Mentor'}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                  <Rating value={profile.rating || profile.documentRating || stats?.averageRating || 0} />
                  <span>{stats?.totalSessions || profile.totalSessions || 0} buổi học</span>
                  <span>{Number(profile.pricePerHour || 0).toLocaleString()}đ/giờ</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setFollowModalType('followers')}
                    className="glass-subtle rounded-xl px-4 py-2 text-left hover:bg-white/10 transition-colors"
                  >
                    <p className="font-bold text-gray-900 dark:text-white">{stats?.followerCount ?? 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowModalType('following')}
                    className="glass-subtle rounded-xl px-4 py-2 text-left hover:bg-white/10 transition-colors"
                  >
                    <p className="font-bold text-gray-900 dark:text-white">{stats?.followeeCount ?? 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
                  </button>
                </div>
              </div>
            </div>

            <button className="bg-primary-500 text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:bg-primary-600 font-semibold shadow-md hover:shadow-primary-500/20 transition-all">
              <Calendar className="w-5 h-5" />
              Đặt lịch Mentor
            </button>
          </div>
        </div>
      </section>

      <FollowListModal
        isOpen={Boolean(followModalType)}
        onClose={() => setFollowModalType(null)}
        userId={id}
        type={followModalType || 'followers'}
        currentUserId={currentUser?.id || currentUser?._id}
      />

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfileSection icon={GraduationCap} title="Hồ sơ cá nhân">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{profile.bio || 'Mentor chưa cập nhật giới thiệu.'}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Stat label="Ngành" value={profile.major || '-'} />
              <Stat label="GPA" value={profile.gpa || '-'} />
              <Stat label="Môn đã qua" value={(profile.passedSubjects || []).length} />
              <Stat label="Kinh nghiệm" value={profile.experience ? 'Có' : '-'} />
            </div>
          </ProfileSection>

          <ProfileSection icon={BookOpen} title="Tài liệu mentor tải lên hồ sơ">
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
                        <p className="font-semibold truncate text-gray-900 dark:text-white">{doc.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {doc.subjectCode || 'Không rõ môn'} - {typeLabels[doc.documentType] || doc.documentType || 'PDF'}
                        </p>
                      </div>
                      <FileText className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    </div>
                    {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{doc.description}</p>}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{doc.sourceType === 'google_drive' ? 'Google Drive' : doc.sourceType === 'external_link' ? 'External link' : 'File upload'}</span>
                      <span>{doc.downloads || 0} lượt xem</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-550 dark:text-gray-400">Mentor chưa tải tài liệu nào lên hồ sơ.</p>
            )}
          </ProfileSection>

          <ProfileSection icon={Award} title="Thành tựu">
            <ItemList items={profile.achievements} empty="Chưa có thành tựu" render={(item) => (
              <RichItem title={item.title} meta={[item.issuer, item.year].filter(Boolean).join(' - ')} description={item.description} />
            )} />
          </ProfileSection>

          <ProfileSection icon={Briefcase} title="Dự án">
            <ItemList items={profile.projects} empty="Chưa có dự án" render={(item) => (
              <RichItem title={item.title} meta={[item.role, (item.techStack || []).join(', ')].filter(Boolean).join(' - ')} description={item.description} link={item.url} />
            )} />
          </ProfileSection>
        </div>

        <aside className="space-y-6">
          <ProfileSection icon={Star} title="Chuyên môn">
            <div className="flex flex-wrap gap-2">
              {(profile.expertise || []).length
                ? profile.expertise.map((item) => <span key={item} className="glass-subtle rounded-lg px-3 py-1 text-sm font-semibold">{item}</span>)
                : <p className="text-sm text-gray-500">Chưa cập nhật chuyên môn.</p>}
            </div>
          </ProfileSection>

          <ProfileSection icon={FileText} title="Demo và bài tập">
            <div className="space-y-3">
              <ItemList items={profile.demoMaterials} empty="Chưa có tài liệu demo" render={(item) => (
                <RichItem title={item.title} meta={item.url} description={item.description} link={item.url} />
              )} />
              <ItemList items={profile.exerciseTemplates} empty="Chưa có bài tập mẫu" render={(item) => (
                <RichItem title={item.title} meta={[item.subjectCode, item.level].filter(Boolean).join(' - ')} description={item.description} link={item.url} />
              )} />
            </div>
          </ProfileSection>

          <ProfileSection icon={Star} title="Đánh giá & Phản hồi">
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {reviews.length ? reviews.map((review) => (
                <div key={review._id} className="glass-subtle rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{review.user?.name || review.student?.name || 'Học viên'}</p>
                    <Rating value={review.rating} />
                  </div>
                  {(review.comment || review.review?.comment) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.comment || review.review?.comment}</p>
                  )}
                </div>
              )) : <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có phản hồi.</p>}
            </div>
          </ProfileSection>
        </aside>
      </main>
    </div>
  );
}

const ProfileSection = ({ icon: Icon, title, children }) => (
  <section className="glass-card rounded-2xl p-5">
    <h2 className="font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
      <Icon className="w-5 h-5 text-primary-500" />
      {title}
    </h2>
    {children}
  </section>
);

const Stat = ({ label, value }) => (
  <div className="glass-subtle rounded-lg p-3 text-center">
    <p className="font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
  </div>
);

const Rating = ({ value }) => (
  <span className="inline-flex items-center gap-1 font-semibold text-gray-950 dark:text-white">
    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
    <span>{Number(value || 0).toFixed(1)}</span>
  </span>
);

const ItemList = ({ items = [], empty, render }) => (
  <div className="space-y-3">
    {items.length ? items.map((item, index) => <div key={item._id || `${item.title}-${index}`}>{render(item)}</div>) : <p className="text-sm text-gray-500 dark:text-gray-400">{empty}</p>}
  </div>
);

const RichItem = ({ title, meta, description, link }) => (
  <div className="glass-subtle rounded-xl p-3">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white">{title || 'Chưa đặt tiêu đề'}</p>
        {meta && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{meta}</p>}
      </div>
      {link && <a href={link} target="_blank" rel="noreferrer" className="glass-nav-link p-1 rounded-lg"><ExternalLink className="w-4 h-4" /></a>}
    </div>
    {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>}
  </div>
);

const avatarFor = (mentor) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor._id || mentor.email || mentor.name}`;
