import React, { useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle, Copy, Crown, Loader2, QrCode, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { mentorService } from '../../services/api';
import { Card, Button } from '../ui';

const promotionPlans = [
  {
    id: '7_days',
    title: '7 ngay',
    days: 7,
    price: 19000,
    caption: 'Thu hut hoc vien trong tuan nay',
  },
  {
    id: '30_days',
    title: '30 ngay',
    days: 30,
    price: 49000,
    caption: 'Lua chon phu hop de duy tri hien dien',
  },
  {
    id: 'yearly',
    title: '1 nam',
    days: 365,
    price: 299000,
    caption: 'Tiet kiem nhat cho mentor hoat dong dai han',
  },
];

const fallbackBankInfo = {
  bankName: 'BIDV',
  bankCode: 'BIDV',
  accountNumber: '96247ANH2004',
  accountName: 'LE DUC ANH',
};

const createFallbackPromotionPayment = (plan) => {
  const transactionId = `FPTBOOST${Date.now().toString().slice(-8)}`;
  const qrUrl = `https://qr.sepay.vn/img?acc=${fallbackBankInfo.accountNumber}&bank=${encodeURIComponent(fallbackBankInfo.bankCode)}&amount=${plan.price}&des=${encodeURIComponent(transactionId)}`;

  return {
    plan,
    amount: plan.price,
    transactionId,
    qrUrl,
    bankInfo: fallbackBankInfo,
    method: 'sepay',
    fallback: true,
  };
};

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
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [promotionPayment, setPromotionPayment] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    setForm({ ...emptyProfile, ...profileToForm(user) });
  }, [user]);

  useEffect(() => {
    if (!promotionPayment?.transactionId || promotionPayment?.fallback || paymentConfirmed) return undefined;

    let attempts = 0;
    let stopped = false;

    const checkPayment = async () => {
      if (stopped) return;
      attempts += 1;
      setPollingCount(attempts);

      try {
        const response = await api.get(`/payments/check/${promotionPayment.transactionId}`);
        const payload = response.data?.data;
        if (response.data?.success && (payload?.paymentStatus === 'paid' || payload?.status === 'completed')) {
          stopped = true;
          setPaymentConfirmed(true);
          toast.success('Thanh toan thanh cong! Ho so da duoc gan nhan uu tien.');
          onSaved?.();
        }
      } catch {
        if (attempts >= 60) {
          stopped = true;
          toast.error('Chua nhan duoc xac nhan thanh toan. Vui long kiem tra lai sau.');
        }
      }
    };

    checkPayment();
    const intervalId = window.setInterval(checkPayment, 3000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [promotionPayment?.transactionId, paymentConfirmed, onSaved]);

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
  const startPromotionPayment = async (plan) => {
    setPromoting(true);
    try {
      setSelectedPlan(plan);
      setPaymentConfirmed(false);
      setPollingCount(0);
      const response = await api.post('/payments/mentor-promotion/create', { planId: plan.id });
      setPromotionPayment(response.data?.data || response.data);
      toast.success('Da tao ma QR thanh toan goi uu tien.');
    } catch (error) {
      if (error.response?.status === 404) {
        setPromotionPayment(createFallbackPromotionPayment(plan));
        toast.error('Backend chua co API goi uu tien moi. Tam thoi hien QR, can deploy backend de tu dong xac nhan.');
        return;
      }
      toast.error(error.response?.data?.message || 'Khong the tao thanh toan goi uu tien');
    } finally {
      setPromoting(false);
    }
  };

  const openPromotionModal = () => {
    setShowPromotionModal(true);
    setSelectedPlan(null);
    setPromotionPayment(null);
    setPaymentConfirmed(false);
    setPollingCount(0);
  };

  const closePromotionModal = () => {
    setShowPromotionModal(false);
    setSelectedPlan(null);
    setPromotionPayment(null);
    setPaymentConfirmed(false);
    setPollingCount(0);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Da sao chep');
  };

  const formatPrice = (amount) => `${new Intl.NumberFormat('vi-VN').format(amount)}d`;

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
          onClick={openPromotionModal}
          isLoading={promoting}
          className="gap-2"
        >
          {!promoting && <Crown className="w-4 h-4" />}
          Uu tien
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
      {showPromotionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <button type="button" aria-label="Dong" className="fixed inset-0 glass-overlay" onClick={closePromotionModal} />
          <div className="relative min-h-full flex items-center justify-center p-4">
            <div className="glass-modal w-full max-w-4xl rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b glass-divider flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Crown className="w-6 h-6 text-primary-500" />
                    Goi uu tien mentor
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Chon thoi gian hien thi noi bat tren danh sach mentor.</p>
                </div>
                <button type="button" onClick={closePromotionModal} className="glass-nav-link rounded-xl px-3 py-2 text-sm font-semibold">Dong</button>
              </div>

              <div className="p-6">
                {!promotionPayment ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {promotionPlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => startPromotionPayment(plan)}
                        disabled={promoting}
                        className="glass-subtle text-left rounded-2xl p-5 border border-primary-200/50 hover:border-primary-400 hover:bg-primary-100/30 dark:hover:bg-primary-400/10 transition-all disabled:opacity-60"
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="w-11 h-11 rounded-2xl bg-primary-400/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-500" />
                          </div>
                          {plan.id === '30_days' && <span className="text-xs font-bold rounded-full bg-amber-100 text-amber-700 px-2 py-1">Pho bien</span>}
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">Uu tien {plan.title}</p>
                        <p className="text-3xl font-black text-primary-600 mt-3">{formatPrice(plan.price)}</p>
                        <p className="text-sm text-gray-500 mt-3 min-h-[2.5rem]">{plan.caption}</p>
                        <div className="mt-5 w-full rounded-xl bg-primary-500 text-white py-2 text-center font-semibold">Chon goi</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                    <div className="glass-subtle rounded-2xl p-5 text-center">
                      <p className="font-bold text-gray-900 dark:text-white mb-3">{selectedPlan ? `Uu tien ${selectedPlan.title}` : promotionPayment.plan?.name}</p>
                      <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-gray-300 inline-flex">
                        {promotionPayment.qrUrl ? (
                          <img src={promotionPayment.qrUrl} alt="Ma QR thanh toan uu tien" className="w-56 h-56 object-contain" />
                        ) : (
                          <div className="w-56 h-56 flex items-center justify-center"><QrCode className="w-16 h-16 text-gray-400" /></div>
                        )}
                      </div>
                      <div className={`mt-4 rounded-xl px-3 py-2 text-sm font-semibold ${paymentConfirmed ? 'bg-emerald-100 text-emerald-700' : promotionPayment.fallback ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {paymentConfirmed ? (
                          <span className="inline-flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Thanh toan thanh cong</span>
                        ) : promotionPayment.fallback ? (
                          <span>QR da tao. Can deploy backend moi de tu dong xac nhan.</span>
                        ) : (
                          <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Dang cho xac nhan {pollingCount ? `(${pollingCount})` : ''}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="glass-subtle rounded-2xl p-5">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Thong tin chuyen khoan</h4>
                        {[
                          { label: 'Ngan hang', value: promotionPayment.bankInfo?.bankName || 'BIDV' },
                          { label: 'So tai khoan', value: promotionPayment.bankInfo?.accountNumber, copy: true },
                          { label: 'Chu tai khoan', value: promotionPayment.bankInfo?.accountName },
                          { label: 'So tien', value: formatPrice(promotionPayment.amount), highlight: true },
                          { label: 'Noi dung CK', value: promotionPayment.transactionId, copy: true, mono: true },
                        ].map(({ label, value, copy, highlight, mono }) => (
                          <div key={label} className="flex items-center justify-between gap-3 py-2 border-b border-white/10 last:border-b-0">
                            <span className="text-sm text-gray-500">{label}</span>
                            <div className="flex items-center gap-2 text-right">
                              <span className={`font-semibold ${highlight ? 'text-primary-600' : 'text-gray-900 dark:text-white'} ${mono ? 'font-mono text-sm' : ''}`}>{value}</span>
                              {copy && <button type="button" onClick={() => copyToClipboard(value)} className="glass-nav-link rounded-lg p-1"><Copy className="w-4 h-4" /></button>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 dark:bg-amber-400/10 dark:border-amber-500/30 p-4 text-sm text-amber-800 dark:text-amber-200">
                        {promotionPayment.fallback
                          ? 'Server hien tai dang tra 404 cho API goi uu tien. Sau khi deploy backend moi, QR nay se duoc tao va xac nhan tu dong.'
                          : 'Sau khi thanh toan thanh cong, he thong se tu dong gan chu Uu tien vao ho so mentor cua ban.'}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button type="button" variant="secondary" onClick={() => { setPromotionPayment(null); setSelectedPlan(null); setPaymentConfirmed(false); }}>Chon goi khac</Button>
                        {paymentConfirmed && <Button type="button" onClick={closePromotionModal}>Hoan tat</Button>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}    </Card>
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
