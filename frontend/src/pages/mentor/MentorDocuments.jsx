import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink, FileText, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import { documentService } from '../../services/api';

const emptyForm = {
  title: '',
  description: '',
  subjectCode: '',
  semester: '1',
  documentType: 'pdf',
  tags: '',
  externalUrl: '',
};

const documentTypes = [
  { value: 'pdf', label: 'PDF' },
  { value: 'slide', label: 'Slide' },
  { value: 'source_code', label: 'Source Code' },
  { value: 'exam', label: 'Đề thi' },
  { value: 'assignment', label: 'Bài tập' },
  { value: 'checklist', label: 'Checklist' },
];

const sourceLabels = {
  upload: 'File upload',
  google_drive: 'Google Drive',
  external_link: 'Link bên ngoài',
};

const getDocumentTypeLabel = (value) => (
  documentTypes.find((type) => type.value === value)?.label || value || 'PDF'
);

export default function MentorDocuments() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [sourceType, setSourceType] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDocuments = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await documentService.getMentorDocuments(user._id, { limit: 100 });
      setDocuments(res.data?.data?.documents || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải tài liệu cá nhân');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role && user.role !== 'mentor') {
      navigate('/dashboard');
      return;
    }
    loadDocuments();
  }, [user?._id, user?.role]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedFile(null);
    setSourceType('upload');
  };

  const submit = async (event) => {
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
      setSubmitting(true);
      await documentService.createMentorProfile(formData);
      toast.success('Đã thêm tài liệu vào hồ sơ cá nhân');
      resetForm();
      await loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thêm tài liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const removeDocument = async (docId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này khỏi hồ sơ cá nhân?')) return;
    try {
      await documentService.delete(docId);
      toast.success('Đã xóa tài liệu');
      await loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài liệu');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="glass-card overflow-hidden">
        <div className="bg-gradient-to-br from-primary-500/15 via-primary-500/5 to-transparent p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tài liệu cá nhân</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
              Tài liệu ở đây sẽ hiện trong hồ sơ mentor của bạn để học viên xem. Tài liệu này không được đăng lên marketplace.
            </p>
          </div>
          <button onClick={loadDocuments} className="glass-nav-link rounded-xl px-4 py-2 flex items-center gap-2 font-semibold text-sm self-start sm:self-auto">
            <RefreshCw className="w-4 h-4" />
            Tải lại
          </button>
        </div>
      </section>

      <main className="grid grid-cols-1 gap-6">
        <section className="glass-card p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5 text-gray-900 dark:text-white">
            <Upload className="w-5 h-5 text-primary-500" />
            Thêm tài liệu vào hồ sơ
          </h2>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-end">
              <div>
                <span className="block text-sm font-semibold mb-2 text-gray-650 dark:text-gray-300">Nguồn tài liệu</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'upload', label: 'File' },
                    { value: 'google_drive', label: 'Drive' },
                    { value: 'external_link', label: 'Link' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSourceType(option.value);
                        setSelectedFile(null);
                        update('externalUrl', '');
                      }}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold border ${sourceType === option.value ? 'bg-primary-500 text-white border-primary-500' : 'glass-nav-hover'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {sourceType === 'upload' ? (
                <label className="block">
                  <span className="block text-sm font-semibold mb-1 text-gray-650 dark:text-gray-300">File tài liệu</span>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar,.pptx,.xlsx,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="glass-input w-full px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300" />
                </label>
              ) : (
                <Input label={sourceType === 'google_drive' ? 'Link Google Drive' : 'Link tài liệu'} value={form.externalUrl} onChange={(value) => update('externalUrl', value)} type="url" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
              <Input label="Môn học" value={form.subjectCode} onChange={(value) => update('subjectCode', value.toUpperCase())} />
              <Input label="Tags môn học" value={form.tags} onChange={(value) => update('tags', value)} />

              <label className="block">
                <span className="block text-sm font-semibold mb-1 text-gray-650 dark:text-gray-300">Loại tài liệu</span>
                <select value={form.documentType} onChange={(e) => update('documentType', e.target.value)} className="glass-input w-full px-3 py-2 text-sm font-semibold text-gray-750 dark:text-gray-350">
                  {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>

              <Input label="Kỳ học" value={form.semester} onChange={(value) => update('semester', value)} />
              <Input label="Mô tả" value={form.description} onChange={(value) => update('description', value)} />
              <Input label="Tiêu đề tài liệu" value={form.title} onChange={(value) => update('title', value)} />
            </div>

            <div className="flex justify-end pt-2">
              <button disabled={submitting} className="w-full md:w-auto bg-primary-500 text-white rounded-xl px-6 py-3 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 hover:bg-primary-600 shadow-sm shadow-primary-500/25 transition-all">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Đăng vào hồ sơ
              </button>
            </div>
          </form>
        </section>

        <section className="glass-card p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5 text-gray-900 dark:text-white">
            <FileText className="w-5 h-5 text-primary-500" />
            Tài liệu đang hiện trên hồ sơ
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => <div key={index} className="glass-subtle rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : documents.length ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc._id} className="glass-subtle rounded-xl p-4 flex items-start justify-between gap-3 border border-gray-150 dark:border-white/5 bg-white/40 dark:bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-white truncate mb-3">{doc.title}</p>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-sm font-semibold">
                      <InfoLine label="Môn học" value={doc.subjectCode || 'Chưa ghi môn học'} />
                      <InfoLine label="Tags môn học" value={(doc.tags || []).length ? doc.tags.join(', ') : 'Chưa có tags'} />
                      <InfoLine label="Loại tài liệu" value={getDocumentTypeLabel(doc.documentType)} />
                      <InfoLine label="Kỳ học" value={doc.semester ? `Kỳ ${doc.semester}` : 'Chưa ghi kỳ học'} />
                      <InfoLine label="Nguồn tài liệu" value={sourceLabels[doc.sourceType] || 'File upload'} />
                      <InfoLine label="Ngày đăng" value={doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : 'Chưa rõ'} />
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Mô tả</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {doc.description || 'Chưa có mô tả'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(doc.externalUrl || doc.fileUrl) && (
                      <a href={doc.externalUrl || doc.fileUrl} target="_blank" rel="noreferrer" className="glass-nav-link rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button type="button" onClick={() => removeDocument(doc._id)} className="text-red-500 hover:text-red-650 p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Chưa có tài liệu cá nhân nào.</p>
          )}
        </section>
      </main>
    </div>
  );
}

const Input = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="block text-sm font-semibold mb-1 text-gray-650 dark:text-gray-300">{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="glass-input w-full px-3 py-2 text-sm font-medium text-gray-800 dark:text-white" />
  </label>
);

const InfoLine = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{label}</p>
    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">{value}</p>
  </div>
);
