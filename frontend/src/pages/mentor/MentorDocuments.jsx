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
  { value: 'exam', label: 'De thi' },
  { value: 'assignment', label: 'Bai tap' },
  { value: 'checklist', label: 'Checklist' },
];

const sourceLabels = {
  upload: 'File upload',
  google_drive: 'Google Drive',
  external_link: 'Link ben ngoai',
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
      toast.error(error.response?.data?.message || 'Khong the tai tai lieu ca nhan');
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
      setSubmitting(true);
      await documentService.createMentorProfile(formData);
      toast.success('Da them tai lieu vao ho so ca nhan');
      resetForm();
      await loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the them tai lieu');
    } finally {
      setSubmitting(false);
    }
  };

  const removeDocument = async (docId) => {
    if (!window.confirm('Ban co chac muon xoa tai lieu nay khoi ho so ca nhan?')) return;
    try {
      await documentService.delete(docId);
      toast.success('Da xoa tai lieu');
      await loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the xoa tai lieu');
    }
  };

  return (
    <div className="min-h-screen">
      <section className="glass-hero glass-hero-purple mx-4 mt-2 px-6 py-8 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tai lieu ca nhan</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Tai lieu o day se hien trong ho so mentor cua ban de student xem. No khong duoc dang len marketplace.
            </p>
          </div>
          <button onClick={loadDocuments} className="glass-nav-link rounded-xl px-4 py-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Tai lai
          </button>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 gap-6">
        <section className="glass-card rounded-2xl p-5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
            <Upload className="w-5 h-5 text-primary-500" />
            Them tai lieu vao ho so
          </h2>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-end">
              <div>
                <span className="block text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">Nguon tai lieu</span>
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
              </div>

              {sourceType === 'upload' ? (
                <label className="block">
                  <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">File tai lieu</span>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar,.pptx,.xlsx,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="glass-input w-full px-3 py-2" />
                </label>
              ) : (
                <Input label={sourceType === 'google_drive' ? 'Link Google Drive' : 'Link tai lieu'} value={form.externalUrl} onChange={(value) => update('externalUrl', value)} type="url" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
              <Input label="Mon hoc" value={form.subjectCode} onChange={(value) => update('subjectCode', value.toUpperCase())} />
              <Input label="Tags mon hoc" value={form.tags} onChange={(value) => update('tags', value)} />

              <label className="block">
                <span className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">Loai tai lieu</span>
                <select value={form.documentType} onChange={(e) => update('documentType', e.target.value)} className="glass-input w-full px-3 py-2">
                  {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>

              <Input label="Ky hoc" value={form.semester} onChange={(value) => update('semester', value)} />
              <Input label="Mo ta" value={form.description} onChange={(value) => update('description', value)} />
              <Input label="Tieu de tai lieu" value={form.title} onChange={(value) => update('title', value)} />
            </div>

            <div className="flex justify-end">
              <button disabled={submitting} className="w-full md:w-auto bg-primary-500 text-white rounded-xl px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Dang vao ho so
              </button>
            </div>
          </form>
        </section>

        <section className="glass-card rounded-2xl p-5">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
            <FileText className="w-5 h-5 text-primary-500" />
            Tai lieu dang hien tren ho so
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => <div key={index} className="glass-subtle rounded-xl h-20 animate-pulse" />)}
            </div>
          ) : documents.length ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc._id} className="glass-subtle rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate mb-3">{doc.title}</p>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-sm">
                      <InfoLine label="Mon hoc" value={doc.subjectCode || 'Chua ghi mon hoc'} />
                      <InfoLine label="Tags mon hoc" value={(doc.tags || []).length ? doc.tags.join(', ') : 'Chua co tags'} />
                      <InfoLine label="Loai tai lieu" value={getDocumentTypeLabel(doc.documentType)} />
                      <InfoLine label="Ky hoc" value={doc.semester ? `Ky ${doc.semester}` : 'Chua ghi ky hoc'} />
                      <InfoLine label="Nguon tai lieu" value={sourceLabels[doc.sourceType] || 'File upload'} />
                      <InfoLine label="Ngay dang" value={doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : 'Chua ro'} />
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500">Mo ta</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {doc.description || 'Chua co mo ta'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(doc.externalUrl || doc.fileUrl) && (
                      <a href={doc.externalUrl || doc.fileUrl} target="_blank" rel="noreferrer" className="glass-nav-link rounded-lg p-2">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button type="button" onClick={() => removeDocument(doc._id)} className="text-red-500 hover:text-red-600 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chua co tai lieu ca nhan nao.</p>
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
    <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="glass-input w-full px-3 py-2" />
  </label>
);

const InfoLine = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">{value}</p>
  </div>
);
