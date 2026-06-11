import React, { useEffect, useState } from 'react';
import { BadgeCheck, Crown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { mentorService } from '../../services/api';
import { Card, Button } from '../ui';

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
  .map((line) => line.trim())
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
  const parts = line.split('|').map((part) => part.trim());
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
    achievements: (p.achievements || []).map((item) => [item.title, item.issuer, item.year, item.description].filter(Boolean).join(' | ')).join('\n'),
    demoMaterials: (p.demoMaterials || []).map((item) => [item.title, item.url, item.description].filter(Boolean).join(' | ')).join('\n'),
    exerciseTemplates: (p.exerciseTemplates || []).map((item) => [item.title, item.subjectCode, item.level, item.url, item.description].filter(Boolean).join(' | ')).join('\n'),
    projects: (p.projects || []).map((item) => [
      item.title,
      item.role,
      (item.techStack || []).join(', '),
      item.url,
      item.description,
    ].filter(Boolean).join(' | ')).join('\n'),
  };
};

const formToPayload = (user, form) => ({
  name: user?.name,
  avatar: user?.avatar,
  'mentorProfile.title': form.title,
  'mentorProfile.bio': form.bio,
  'mentorProfile.expertise': form.expertise.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean),
  'mentorProfile.major': form.major,
  'mentorProfile.gpa': normalizeGpa(form.gpa),
  'mentorProfile.passedSubjects': form.passedSubjects.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean),
  'mentorProfile.experience': form.experience,
  'mentorProfile.pricePerHour': Number(form.pricePerHour) || 0,
  'mentorProfile.isAvailable': form.isAvailable,
  'mentorProfile.achievements': parseLines(form.achievements, (line) => {
    const [title, issuer, year, description] = line.split('|').map((part) => part.trim());
    return { title, issuer, year, description };
  }),
  'mentorProfile.demoMaterials': parseLines(form.demoMaterials, (line) => {
    const [title, url, description] = line.split('|').map((part) => part.trim());
    return { title, url, description, type: 'link' };
  }),
  'mentorProfile.exerciseTemplates': parseLines(form.exerciseTemplates, parseExerciseTemplate),
  'mentorProfile.projects': parseLines(form.projects, (line) => {
    const [title, role, techStack, url, description] = line.split('|').map((part) => part.trim());
    return {
      title,
      role,
      techStack: techStack ? techStack.split(',').map((item) => item.trim()).filter(Boolean) : [],
      url,
      description,
    };
  }),
});

export default function MentorProfileEditor({ user, onSaved }) {
  const [form, setForm] = useState({ ...emptyProfile });
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    setForm({ ...emptyProfile, ...profileToForm(user) });
  }, [user]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const syncStoredUser = (updatedUser) => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedUser }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await mentorService.updateProfile(user._id, formToPayload(user, form));
      const updated = res.data?.data;
      if (updated) {
        syncStoredUser(updated);
      }
      toast.success('Đã cập nhật profile mentor');
      onSaved?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật profile mentor');
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
        campaignName: 'Ưu tiên tìm kiếm 7 ngày',
      });
      const updated = res.data?.data?.mentor;
      if (updated) {
        syncStoredUser(updated);
      }
      toast.success('Đã bật ưu tiên đề xuất trong 7 ngày');
      onSaved?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể bật ưu tiên đề xuất');
    } finally {
      setPromoting(false);
    }
  };

  const promotion = user?.mentorProfile?.promotion;
  const isPromoted = promotion?.isPromoted && (!promotion?.paidUntil || new Date(promotion.paidUntil) > new Date());

  return (
    <Card title="Hồ sơ mentor">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-1">
            <BadgeCheck className="w-5 h-5 text-primary-500" />
            <span className="font-semibold">Thông tin hiển thị cho học viên</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isPromoted
              ? `Đang được ưu tiên đến ${new Date(promotion.paidUntil).toLocaleDateString('vi-VN')}`
              : 'Điền hồ sơ mentor để học viên xem được kinh nghiệm, chuyên môn và dự án của bạn.'}
          </p>
        </div>
        <Button
          type="button"
          onClick={activatePromotion}
          isLoading={promoting}
          className="gap-2"
        >
          {!promoting && <Crown className="w-4 h-4" />}
          Ưu tiên 7 ngày
        </Button>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Field label="Chức danh" value={form.title} onChange={(value) => update('title', value)} />
        <Field label="Ngành" value={form.major} onChange={(value) => update('major', value)} />
        <Field label="GPA" value={form.gpa} onChange={(value) => update('gpa', value)} />
        <Field label="Giá mỗi giờ" value={form.pricePerHour} onChange={(value) => update('pricePerHour', value)} />
        <Field label="Chuyên môn (cách nhau bằng dấu phẩy)" value={form.expertise} onChange={(value) => update('expertise', value)} className="lg:col-span-2" />
        <Field label="Môn đã qua (cách nhau bằng dấu phẩy)" value={form.passedSubjects} onChange={(value) => update('passedSubjects', value)} className="lg:col-span-2" />
        <TextArea label="Giới thiệu cá nhân" value={form.bio} onChange={(value) => update('bio', value)} />
        <TextArea label="Kinh nghiệm" value={form.experience} onChange={(value) => update('experience', value)} />
        <TextArea label="Thành tựu: Tên | Đơn vị cấp | Năm | Mô tả" value={form.achievements} onChange={(value) => update('achievements', value)} />
        <TextArea label="Demo: Tiêu đề | URL | Mô tả" value={form.demoMaterials} onChange={(value) => update('demoMaterials', value)} />
        <TextArea label="Bài tập mẫu: Tiêu đề | Môn học | Cấp độ (beginner/intermediate/advanced) | URL | Mô tả" value={form.exerciseTemplates} onChange={(value) => update('exerciseTemplates', value)} />
        <TextArea label="Dự án / Project: Tên dự án | Vai trò | Công nghệ | URL | Mô tả" value={form.projects} onChange={(value) => update('projects', value)} />
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 lg:col-span-2">
          <input type="checkbox" checked={form.isAvailable} onChange={(event) => update('isAvailable', event.target.checked)} />
          Đang nhận lịch mentor
        </label>
        <div className="lg:col-span-2 flex justify-end">
          <Button type="submit" isLoading={saving} className="gap-2 font-semibold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Lưu hồ sơ mentor
          </Button>
        </div>
      </form>
    </Card>
  );
}

const Field = ({ label, value, onChange, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} className="glass-input w-full px-3 py-2" />
  </label>
);

const TextArea = ({ label, value, onChange }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{label}</span>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="glass-input w-full px-3 py-2" />
  </label>
);
