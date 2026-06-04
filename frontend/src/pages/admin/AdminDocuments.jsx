import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, ExternalLink, FileText, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import { documentService } from '../../services/api';

const emptyForm = {
  category: 'software_engineering',
  subjectCode: '',
  title: '',
  description: '',
  price: 0,
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

const categoryOptions = [
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'communication', label: 'Truyền thông' },
  { value: 'business', label: 'Kinh doanh' },
  { value: 'design', label: 'Thiết kế' },
  { value: 'data_science', label: 'Khoa học dữ liệu' },
  { value: 'other', label: 'Khác' },
];

const inferCategory = (doc) => {
  const subject = String(doc.subjectCode || '').toUpperCase();
  if (['SWP', 'PRJ', 'DBI', 'MAD'].some((prefix) => subject.startsWith(prefix))) return 'software_engineering';
  if (['COM', 'MKT'].some((prefix) => subject.startsWith(prefix))) return 'marketing';
  return doc.category || 'other';
};

const getCategoryLabel = (doc) => (
  categoryOptions.find((category) => category.value === inferCategory(doc))?.label || 'Khác'
);

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [sourceType, setSourceType] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const docRes = await documentService.getAll({ limit: 20 });
      setDocuments(docRes.data?.data?.documents || docRes.data?.documents || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedFile(null);
    setSourceType('upload');
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.category) {
      toast.error('Vui lòng chọn chuyên ngành');
      return;
    }

    if (!form.subjectCode) {
      toast.error('Vui lòng nhập môn học');
      return;
    }

    if (sourceType === 'upload' && !selectedFile) {
      toast.error('Vui lòng chọn file');
      return;
    }

    if (sourceType !== 'upload' && !form.externalUrl) {
      toast.error('Vui lòng nhập link tài liệu');
      return;
    }

    const formData = new FormData();
    if (sourceType === 'upload') {
      formData.append('file', selectedFile);
      formData.append('title', form.title || selectedFile.name);
    } else {
      formData.append('title', form.title || 'Tài liệu marketplace');
      formData.append('externalUrl', form.externalUrl);
    }
    formData.append('category', form.category);
    formData.append('subjectCode', form.subjectCode.toUpperCase());
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('documentType', form.documentType);
    formData.append('tags', form.tags);

    try {
      setSubmitting(true);
      await documentService.createMarketplace(formData);
      toast.success('Đã đăng tài liệu lên marketplace');
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đăng tài liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const removeDocument = async (doc) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu marketplace này?')) return;
    try {
      await documentService.delete(doc._id);
      toast.success('Đã xóa tài liệu');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa tài liệu');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="glass-card overflow-hidden">
        <div className="bg-gradient-to-br from-primary-500/15 via-primary-500/5 to-transparent p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tài liệu Marketplace</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
              Chỉ Admin được đăng và quản lý tài liệu bán trên marketplace.
            </p>
          </div>
          <button onClick={loadData} className="glass-nav-link rounded-xl px-4 py-2 flex items-center gap-2 font-semibold text-sm self-start sm:self-auto">
            <RefreshCw className="w-4 h-4" />
            Tải lại
          </button>
        </div>
      </section>

      <main className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="glass-card p-6 xl:col-span-1">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5 text-gray-900 dark:text-white">
            <Upload className="w-5 h-5 text-primary-500" />
            Đăng tài liệu
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-semibold mb-1 text-gray-650 dark:text-gray-300">Chuyên ngành</span>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} className="glass-input w-full px-3 py-2 text-sm font-semibold text-gray-750 dark:text-gray-350" required>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>

            <Input label="Môn học" value={form.subjectCode} onChange={(value) => update('subjectCode', value.toUpperCase())} />

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

            {sourceType === 'upload' ? (
              <label className="block">
                <span className="block text-sm font-semibold mb-1 text-gray-655 dark:text-gray-300">File</span>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar,.pptx,.xlsx,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="glass-input w-full px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300" />
              </label>
            ) : (
              <Input label={sourceType === 'google_drive' ? 'Link Google Drive' : 'Link tài liệu'} value={form.externalUrl} onChange={(value) => update('externalUrl', value)} type="url" />
            )}

            <Input label="Tiêu đề" value={form.title} onChange={(value) => update('title', value)} />
            <Textarea label="Mô tả" value={form.description} onChange={(value) => update('description', value)} />

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-semibold mb-1 text-gray-655 dark:text-gray-300">Loại</span>
                <select value={form.documentType} onChange={(e) => update('documentType', e.target.value)} className="glass-input w-full px-3 py-2 text-sm font-semibold text-gray-750 dark:text-gray-350">
                  {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <Input label="Giá VNĐ" value={form.price} onChange={(value) => update('price', value)} type="number" />
            </div>

            <Input label="Tags" value={form.tags} onChange={(value) => update('tags', value)} />

            <button disabled={submitting} className="w-full bg-primary-500 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 hover:bg-primary-600 shadow-sm shadow-primary-500/25 transition-all">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Đăng lên marketplace
            </button>
          </form>
        </section>

        <section className="glass-card p-6 xl:col-span-2">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5 text-gray-900 dark:text-white">
            <BookOpen className="w-5 h-5 text-primary-500" />
            Tài liệu mới nhất
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => <div key={index} className="glass-subtle rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : documents.length ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc._id} className="glass-subtle rounded-xl p-4 flex items-start justify-between gap-3 border border-gray-150 dark:border-white/5 bg-white/40 dark:bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-white truncate mb-2">{doc.title}</p>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {getCategoryLabel(doc)} - {doc.subjectCode || 'Không rõ môn'} - {doc.documentType || 'pdf'} - {Number(doc.price || 0).toLocaleString()}đ
                    </p>
                    {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">{doc.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(doc.externalUrl || doc.fileUrl) && (
                      <a href={doc.externalUrl || doc.fileUrl} target="_blank" rel="noreferrer" className="glass-nav-link rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400">
                        {doc.externalUrl ? <ExternalLink className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </a>
                    )}
                    <button onClick={() => removeDocument(doc)} className="text-red-500 hover:text-red-650 p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Chưa có tài liệu marketplace.</p>
          )}
        </section>
      </main>
    </div>
  );
}

const Input = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="block text-sm font-semibold mb-1 text-gray-655 dark:text-gray-300">{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="glass-input w-full px-3 py-2 text-sm font-medium text-gray-800 dark:text-white" />
  </label>
);

const Textarea = ({ label, value, onChange }) => (
  <label className="block">
    <span className="block text-sm font-semibold mb-1 text-gray-655 dark:text-gray-300">{label}</span>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="glass-input w-full px-3 py-2 text-sm font-medium text-gray-800 dark:text-white" />
  </label>
);
