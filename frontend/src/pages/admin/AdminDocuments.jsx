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
  { value: 'exam', label: 'De thi' },
  { value: 'assignment', label: 'Bai tap' },
  { value: 'checklist', label: 'Checklist' },
];

const categoryOptions = [
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'communication', label: 'Truyen thong' },
  { value: 'business', label: 'Kinh doanh' },
  { value: 'design', label: 'Thiet ke' },
  { value: 'data_science', label: 'Khoa hoc du lieu' },
  { value: 'other', label: 'Khac' },
];

const inferCategory = (doc) => {
  const subject = String(doc.subjectCode || '').toUpperCase();
  if (['SWP', 'PRJ', 'DBI', 'MAD'].some((prefix) => subject.startsWith(prefix))) return 'software_engineering';
  if (['COM', 'MKT'].some((prefix) => subject.startsWith(prefix))) return 'marketing';
  return doc.category || 'other';
};

const getCategoryLabel = (doc) => (
  categoryOptions.find((category) => category.value === inferCategory(doc))?.label || 'Khac'
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
      toast.error(error.response?.data?.message || 'Khong the tai du lieu');
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
      toast.error('Vui long chon chuyen nganh');
      return;
    }

    if (!form.subjectCode) {
      toast.error('Vui long nhap mon hoc');
      return;
    }

    if (sourceType === 'upload' && !selectedFile) {
      toast.error('Vui long chon file');
      return;
    }

    if (sourceType !== 'upload' && !form.externalUrl) {
      toast.error('Vui long nhap link tai lieu');
      return;
    }

    const formData = new FormData();
    if (sourceType === 'upload') {
      formData.append('file', selectedFile);
      formData.append('title', form.title || selectedFile.name);
    } else {
      formData.append('title', form.title || 'Tai lieu marketplace');
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
      toast.success('Da dang tai lieu len marketplace');
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the dang tai lieu');
    } finally {
      setSubmitting(false);
    }
  };

  const removeDocument = async (doc) => {
    if (!window.confirm('Ban co chac muon xoa tai lieu marketplace nay?')) return;
    try {
      await documentService.delete(doc._id);
      toast.success('Da xoa tai lieu');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the xoa tai lieu');
    }
  };

  return (
    <div className="min-h-screen">
      <section className="glass-hero glass-hero-accent mx-4 mt-2 px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tai lieu Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Chi admin duoc dang va quan ly tai lieu ban tren marketplace.</p>
          </div>
          <button onClick={loadData} className="glass-nav-link rounded-xl px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Tai lai
          </button>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="glass-card rounded-2xl p-5 xl:col-span-1">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
            <Upload className="w-5 h-5 text-primary-500" />
            Dang tai lieu
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">Chuyen nganh</span>
              <select value={form.category} onChange={(e) => update('category', e.target.value)} className="glass-input w-full px-3 py-2" required>
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>

            <Input label="Mon hoc" value={form.subjectCode} onChange={(value) => update('subjectCode', value.toUpperCase())} />

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
                  className={`rounded-xl px-3 py-2 text-sm border ${sourceType === option.value ? 'bg-primary-500 text-white border-primary-500' : 'glass-nav-hover'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {sourceType === 'upload' ? (
              <label className="block">
                <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">File</span>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar,.pptx,.xlsx,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="glass-input w-full px-3 py-2" />
              </label>
            ) : (
              <Input label={sourceType === 'google_drive' ? 'Link Google Drive' : 'Link tai lieu'} value={form.externalUrl} onChange={(value) => update('externalUrl', value)} type="url" />
            )}

            <Input label="Tieu de" value={form.title} onChange={(value) => update('title', value)} />
            <Textarea label="Mo ta" value={form.description} onChange={(value) => update('description', value)} />

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">Loai</span>
                <select value={form.documentType} onChange={(e) => update('documentType', e.target.value)} className="glass-input w-full px-3 py-2">
                  {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <Input label="Gia VND" value={form.price} onChange={(value) => update('price', value)} type="number" />
            </div>

            <Input label="Tags" value={form.tags} onChange={(value) => update('tags', value)} />

            <button disabled={submitting} className="w-full bg-primary-500 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Dang len marketplace
            </button>
          </form>
        </section>

        <section className="glass-card rounded-2xl p-5 xl:col-span-2">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
            <BookOpen className="w-5 h-5 text-primary-500" />
            Tai lieu moi nhat
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => <div key={index} className="glass-subtle rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : documents.length ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc._id} className="glass-subtle rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getCategoryLabel(doc)} - {doc.subjectCode || 'Khong ro mon'} - {doc.documentType || 'pdf'} - {Number(doc.price || 0).toLocaleString()}d
                    </p>
                    {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{doc.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {(doc.externalUrl || doc.fileUrl) && (
                      <a href={doc.externalUrl || doc.fileUrl} target="_blank" rel="noreferrer" className="glass-nav-link rounded-lg p-2">
                        {doc.externalUrl ? <ExternalLink className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </a>
                    )}
                    <button onClick={() => removeDocument(doc)} className="text-red-500 hover:text-red-600 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chua co tai lieu marketplace.</p>
          )}
        </section>
      </main>
    </div>
  );
}

const Input = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="glass-input w-full px-3 py-2" />
  </label>
);

const Textarea = ({ label, value, onChange }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">{label}</span>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="glass-input w-full px-3 py-2" />
  </label>
);
