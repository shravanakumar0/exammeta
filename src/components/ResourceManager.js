import React, { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaPlus, FaSave, FaTimes, FaTrash } from 'react-icons/fa';
import {
  createManagedResource,
  deleteManagedResource,
  getAdminResources,
  storeFrequentQuestions,
  updatePaperProcessingJob,
  uploadManagedResourceFile,
  updateManagedResource,
} from '../supabaseClient';
import { analyzePyqResources } from '../api/gemini';

const blankResource = {
  branch: 'first-year', semester: 1, subject_title: '', title: '', description: '',
  file_url: '', preview_url: '', resource_type: 'notes', category: 'notes',
  tags: '', is_essential: false, sort_order: 0, status: 'draft',
};

const categories = ['notes', 'pyq', 'important-questions', 'solved-qp', 'question-bank', 'lab-manual'];

export default function ResourceManager() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(blankResource);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error: loadError } = await getAdminResources();
    if (loadError) {
      if (loadError.code === 'PGRST205' || /managed_resources|Could not find the table/i.test(loadError.message || '')) {
        setError('The managed resources table is not installed. Apply supabase/migrations/202611220001_admin_schema_fixes.sql in the Supabase SQL Editor.');
      } else {
        setError(loadError.message || 'Could not load resources.');
      }
    }
    else setResources(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visibleResources = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return resources;
    return resources.filter((item) => [item.title, item.subject_title, item.branch, item.category]
      .some((value) => String(value || '').toLowerCase().includes(term)));
  }, [resources, search]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => { setForm(blankResource); setEditingId(null); setSelectedFile(null); setError(''); };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    let uploadedUrl = form.file_url.trim();
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setSaving(false); setError('Only PDF documents can be uploaded.'); return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setSaving(false); setError('The file is larger than the 50 MB limit.'); return;
      }
      const { data, error: uploadError } = await uploadManagedResourceFile(selectedFile, form.category);
      if (uploadError) { setSaving(false); setError(uploadError.message || 'File upload failed.'); return; }
      uploadedUrl = data;
    }
    if (!uploadedUrl) { setSaving(false); setError('Add a download URL or choose a PDF file to upload.'); return; }
    const payload = {
      ...form,
      branch: form.branch.trim().toLowerCase(),
      semester: Number(form.semester),
      subject_title: form.subject_title.trim(),
      title: form.title.trim(), description: form.description.trim() || null,
      file_url: uploadedUrl, preview_url: form.preview_url.trim() || uploadedUrl,
      resource_type: form.resource_type.trim() || 'notes', category: form.category,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      sort_order: Number(form.sort_order) || 0,
    };
    const result = editingId
      ? await updateManagedResource(editingId, payload)
      : await createManagedResource(payload);
    setSaving(false);
    if (result.error) { setError(result.error.message || 'Could not save this resource.'); return; }
    setResources((current) => editingId
      ? current.map((item) => item.id === editingId ? result.data : item)
      : [result.data, ...current]);

    const isPyq = /(pyq|question|question-paper|important)/i.test(
      `${payload.category} ${payload.resource_type} ${payload.title} ${payload.description || ''}`
    );
    if (!editingId && isPyq && result.data?.id) {
      const moduleMatch = payload.tags.find((tag) => /^module-\d+$/i.test(tag)) ||
        payload.title.match(/module\s*(\d+)/i);
      const moduleNumber = moduleMatch
        ? Number(String(moduleMatch).match(/\d+/)?.[0])
        : payload.semester <= 2 ? 1 : null;
      if (moduleNumber >= 1 && moduleNumber <= 5) {
        await updatePaperProcessingJob(result.data.id, {
          status: 'processing',
          attempt_count: 1,
          started_at: new Date().toISOString(),
        });
        try {
          const analysis = await analyzePyqResources({
            subject: `${payload.subject_title}${payload.title ? ` — ${payload.title}` : ''}`,
            moduleNumber,
            resourceUrls: [uploadedUrl],
          });
          const storageResult = await storeFrequentQuestions({
            paperId: result.data.id,
            subjectCode: payload.subject_title,
            subjectTitle: payload.subject_title,
            moduleNumber,
            scheme: '2022',
            examSession: '',
            questions: analysis.questions || [],
          });
          if (storageResult.error) throw storageResult.error;
          setNotice('Resource created and frequently asked questions processed successfully.');
        } catch (processingError) {
          await updatePaperProcessingJob(result.data.id, {
            status: 'failed',
            last_error: processingError.message || 'Could not process the PYQ.',
          });
          setNotice('Resource created, but question processing failed. It can be retried later.');
        }
      } else {
        setNotice('Resource created. Add a Module 1–5 tag before processing the PYQ.');
      }
    } else {
      setNotice(`Resource ${editingId ? 'updated' : 'created'} successfully.`);
    }
    resetForm();
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({ ...item, tags: (item.tags || []).join(', ') });
    setError(''); setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    setError(''); setNotice('');
    const { error: deleteError } = await deleteManagedResource(item.id);
    if (deleteError) { setError(deleteError.message || 'Could not delete resource.'); return; }
    setResources((current) => current.filter((resource) => resource.id !== item.id));
    if (editingId === item.id) resetForm();
    setNotice('Resource deleted.');
  };

  return (
    <section className="admin-resource-manager">
      <div className="admin-resource-intro">
        <div><p>CATALOGUE</p><h1>Study resources</h1><span>Publish notes, papers and links without redeploying the site.</span></div>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={load} disabled={loading}>Refresh</button>
      </div>
      {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {notice && <div className="admin-alert admin-alert-success" role="status">{notice}</div>}

      <form className="admin-resource-form" onSubmit={save}>
        <div className="admin-form-title"><h2>{editingId ? 'Edit resource' : 'Add resource'}</h2>{editingId && <button type="button" onClick={resetForm}><FaTimes /> Cancel</button>}</div>
        <div className="admin-form-grid">
          <label>Branch<input name="branch" value={form.branch} onChange={updateField} required placeholder="e.g. cse or first-year" /></label>
          <label>Semester<input name="semester" type="number" min="1" max="8" value={form.semester} onChange={updateField} required /></label>
          <label className="admin-form-wide">Subject title<input name="subject_title" value={form.subject_title} onChange={updateField} required placeholder="Must exactly match the subject title on the site" /></label>
          <label className="admin-form-wide">Resource title<input name="title" value={form.title} onChange={updateField} required /></label>
          <label className="admin-form-wide">Description<textarea name="description" value={form.description || ''} onChange={updateField} rows="2" /></label>
          <label className="admin-form-wide">Download URL<input name="file_url" type="url" value={form.file_url} onChange={updateField} placeholder="https://…" /></label>
          <label className="admin-form-wide">Upload PDF (optional — use this instead of a URL)<input type="file" accept="application/pdf" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />{selectedFile && <small>Selected: {selectedFile.name}</small>}</label>
          <label className="admin-form-wide">Preview URL (optional)<input name="preview_url" type="url" value={form.preview_url || ''} onChange={updateField} placeholder="https://…" /></label>
          <label>Type<input name="resource_type" value={form.resource_type} onChange={updateField} /></label>
          <label>Category<select name="category" value={form.category} onChange={updateField}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Tags<input name="tags" value={form.tags} onChange={updateField} placeholder="module-1, theory" /></label>
          <label>Display order<input name="sort_order" type="number" value={form.sort_order} onChange={updateField} /></label>
          <label>Status<select name="status" value={form.status} onChange={updateField}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <label className="admin-checkbox"><input name="is_essential" type="checkbox" checked={form.is_essential} onChange={updateField} /> Mark as essential</label>
        </div>
        <button className="admin-btn admin-btn-approve" type="submit" disabled={saving}><FaSave /> {saving ? 'Saving…' : editingId ? 'Update resource' : 'Add resource'}</button>
      </form>

      <div className="admin-toolbar"><label className="admin-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources" aria-label="Search resources" /></label></div>
      {loading ? <p className="admin-status">Loading resources…</p> : visibleResources.length === 0 ? <p className="admin-status">No managed resources yet.</p> : (
        <div className="admin-resource-list">{visibleResources.map((item) => <article className="admin-resource-card" key={item.id}>
          <div><span className={`admin-status-badge admin-resource-${item.status}`}>{item.status}</span><h2>{item.title}</h2><p>{item.branch} · Semester {item.semester} · {item.subject_title}</p><small>{item.category} · {item.resource_type}</small></div>
          <div className="admin-card-actions"><button className="admin-btn admin-btn-secondary" type="button" onClick={() => edit(item)}><FaEdit /> Edit</button><button className="admin-btn admin-btn-delete" type="button" onClick={() => remove(item)}><FaTrash /> Delete</button></div>
        </article>)}</div>
      )}
    </section>
  );
}
