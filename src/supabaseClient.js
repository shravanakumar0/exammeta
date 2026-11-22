import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        created_at: new Date().toISOString(),
      },
    },
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Profile helpers
export const upsertProfile = async (user) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      updated_at: new Date().toISOString(),
    });
  return { data, error };
};

export const getProfile = async (userId) => {
  let { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!error && !data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === userId) {
      await upsertProfile(user);
      const repaired = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      data = repaired.data;
      error = repaired.error;
    }
  }

  return { data, error };
};

// Hackathon registration helpers
export const registerForHackathon = async (registrationData) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return { data: null, error: authError };
  if (!user) {
    return { data: null, error: new Error('You must sign in before submitting a hackathon.') };
  }

  const { data, error } = await supabase
    .from('hackathon_submissions')
    .insert({
      ...registrationData,
      submitted_by: user.id,
      status: 'pending',
    })
    .select('*')
    .maybeSingle();
  return { data: data || null, error };
};

export const getHackathonRegistrations = async () => {
  const { data, error } = await supabase
    .from('hackathon_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getApprovedHackathons = async () => {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
  const { data, error } = await supabase
    .from('hackathon_submissions')
    .select('*')
    .eq('status', 'approved')
    .gte('registration_deadline', today)
    .order('registration_deadline', { ascending: true });
  return { data, error };
};

export const updateHackathonSubmission = async (submissionId, status, adminNote = '', recordReview = true) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return { data: null, error: authError };
  if (!user) {
    return { data: null, error: new Error('You must sign in before reviewing submissions.') };
  }

  const updates = {
    status,
    admin_note: adminNote.trim() || null,
  };
  if (recordReview) {
    const isPending = status === 'pending';
    updates.reviewed_by = isPending ? null : user.id;
    updates.reviewed_at = isPending ? null : new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('hackathon_submissions')
    .update(updates)
    .eq('id', submissionId)
    .select('*')
    .maybeSingle();

  if (!error && data) return { data, error: null };
  if (error) return { data: null, error };

  const fallback = await supabase
    .from('hackathon_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();
  return fallback;
};

export const deleteHackathonSubmission = async (submissionId) => {
  const { error } = await supabase
    .from('hackathon_submissions')
    .delete()
    .eq('id', submissionId);
  return { error };
};

// Resource management helpers.  These resources are stored separately from the
// bundled catalogue so an administrator can publish changes without a deploy.
export const getAdminResources = async () => {
  const { data, error } = await supabase
    .from('managed_resources')
    .select('*')
    .order('updated_at', { ascending: false });
  return { data, error };
};

export const getPublishedResources = async (branch, semester, subjectTitle) => {
  const { data, error } = await supabase
    .from('managed_resources')
    .select('*')
    .eq('branch', String(branch || '').toLowerCase())
    .eq('semester', Number(semester))
    .eq('subject_title', subjectTitle)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createManagedResource = async (resource) => {
  const { data, error } = await supabase
    .from('managed_resources')
    .insert(resource)
    .select('*')
    .maybeSingle();
  return { data: data || null, error };
};

export const updateManagedResource = async (resourceId, resource) => {
  const { data, error } = await supabase
    .from('managed_resources')
    .update(resource)
    .eq('id', resourceId)
    .select('*')
    .maybeSingle();
  return { data: data || null, error };
};

export const deleteManagedResource = async (resourceId) => {
  const { error } = await supabase.from('managed_resources').delete().eq('id', resourceId);
  return { error };
};

const normalizeQuestion = (value) => String(value || '')
  .toLowerCase()
  .replace(/\[[^\]]*\]/g, ' ')
  .replace(/[^a-z0-9+\-.]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const questionSimilarity = (left, right) => {
  const leftTerms = new Set(normalizeQuestion(left).split(' ').filter((term) => term.length > 2));
  const rightTerms = new Set(normalizeQuestion(right).split(' ').filter((term) => term.length > 2));
  if (!leftTerms.size || !rightTerms.size) return 0;
  let intersection = 0;
  leftTerms.forEach((term) => { if (rightTerms.has(term)) intersection += 1; });
  return intersection / Math.sqrt(leftTerms.size * rightTerms.size);
};

const hashOccurrence = (paperId, normalizedText) => {
  const input = `${paperId}:${normalizedText}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}${input.length.toString(16)}`;
};

export const getFrequentQuestions = async ({ subjectCode, subjectTitle = '', moduleNumber = null, scheme = '2022' }) => {
  const scopedQueries = [];
  const uniqueScopes = [...new Set([subjectCode, subjectTitle].filter(Boolean))];

  for (const scope of uniqueScopes) {
    let query = supabase
      .from('question_clusters')
      .select('*')
      .eq('scheme', scheme)
      .order('repeat_count', { ascending: false })
      .order('representative_question', { ascending: true });
    if (scope === subjectCode && subjectCode !== subjectTitle) {
      query = query.eq('subject_code', scope);
    } else {
      query = query.or(`subject_code.eq.${scope},subject_title.eq.${scope}`);
    }
    if (moduleNumber) query = query.eq('module_number', Number(moduleNumber));
    scopedQueries.push(query);
  }

  if (!scopedQueries.length) return { data: [], error: null };
  const results = await Promise.all(scopedQueries);
  const error = results.find((result) => result.error)?.error || null;
  if (error) return { data: null, error };
  const unique = new Map();
  results.forEach((result) => {
    (result.data || []).forEach((item) => unique.set(item.id, item));
  });
  return {
    data: [...unique.values()].sort((a, b) => b.repeat_count - a.repeat_count),
    error: null,
  };
};

export const storeFrequentQuestions = async ({
  paperId,
  subjectCode,
  subjectTitle,
  moduleNumber,
  scheme = '2022',
  examSession = '',
  questions,
}) => {
  if (!paperId || !subjectCode || !Array.isArray(questions)) {
    return { data: null, error: new Error('Missing paper or question analysis data.') };
  }

  let existing = [];
  const existingResult = await supabase
    .from('question_clusters')
    .select('*')
    .eq('subject_code', subjectCode)
    .eq('scheme', scheme)
    .eq('module_number', Number(moduleNumber));
  if (existingResult.error) return existingResult;
  existing = existingResult.data || [];

  for (const question of questions) {
    const normalized = normalizeQuestion(question.question);
    if (!normalized) continue;

    let cluster = existing.find((item) => item.normalized_question === normalized);
    if (!cluster) {
      cluster = existing
        .map((item) => ({ item, score: questionSimilarity(item.representative_question, question.question) }))
        .filter(({ score }) => score >= 0.78)
        .sort((a, b) => b.score - a.score)[0]?.item;
    }

    if (!cluster) {
      const created = await supabase
        .from('question_clusters')
        .insert({
          subject_code: subjectCode,
          subject_title: subjectTitle || subjectCode,
          scheme,
          module_number: Number(moduleNumber),
          representative_question: String(question.question).trim().slice(0, 5000),
          normalized_question: normalized.slice(0, 5000),
          repeat_count: 1,
          typical_marks: question.marks && question.marks !== 'unknown' ? String(question.marks) : null,
          years_appeared: examSession ? [examSession] : [],
          embedding_model: 'cosine-keyword-v1',
        })
        .select('*')
        .maybeSingle();
      if (created.error) return created;
      cluster = created.data;
      if (cluster) existing.push(cluster);
    }
    if (!cluster) continue;

    const occurrenceHash = hashOccurrence(paperId, normalized);
    const occurrence = await supabase
      .from('raw_questions')
      .upsert({
        cluster_id: cluster.id,
        paper_id: paperId,
        module_number: Number(moduleNumber),
        question_text: String(question.question).trim().slice(0, 5000),
        normalized_text: normalized.slice(0, 5000),
        occurrence_hash: occurrenceHash,
        marks: question.marks && question.marks !== 'unknown' ? String(question.marks) : null,
        exam_session: examSession || null,
      }, { onConflict: 'paper_id,occurrence_hash', ignoreDuplicates: true });
    if (occurrence.error) return occurrence;
  }

  const updatedClusters = [];
  for (const cluster of existing) {
    const raw = await supabase
      .from('raw_questions')
      .select('paper_id, marks, exam_session')
      .eq('cluster_id', cluster.id);
    if (raw.error) return raw;

    const occurrences = raw.data || [];
    const paperIds = [...new Set(occurrences.map((item) => item.paper_id).filter(Boolean))];
    const marks = occurrences.map((item) => item.marks).filter(Boolean);
    const markCounts = marks.reduce((counts, mark) => {
      counts[mark] = (counts[mark] || 0) + 1;
      return counts;
    }, {});
    const typicalMarks = Object.entries(markCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const years = [...new Set(occurrences.map((item) => item.exam_session).filter(Boolean))].sort();

    const update = await supabase
      .from('question_clusters')
      .update({
        repeat_count: paperIds.length,
        typical_marks: typicalMarks,
        years_appeared: years,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cluster.id)
      .select('*')
      .maybeSingle();
    if (update.error) return update;
    if (update.data) updatedClusters.push(update.data);
  }

  await supabase
    .from('paper_processing_jobs')
    .upsert({
      paper_id: paperId,
      status: 'completed',
      completed_at: new Date().toISOString(),
      last_error: null,
    }, { onConflict: 'paper_id' });

  return { data: updatedClusters, error: null };
};

export const updatePaperProcessingJob = async (paperId, updates) => {
  if (!paperId) return { data: null, error: new Error('Paper ID is required.') };
  const { data, error } = await supabase
    .from('paper_processing_jobs')
    .upsert({
      paper_id: paperId,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'paper_id' })
    .select('*')
    .maybeSingle();
  return { data: data || null, error };
};

export const uploadManagedResourceFile = async (file, category = 'notes') => {
  const bucket = category === 'pyq' ? 'previous-year-papers' : 'academic-documents';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `admin-resources/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) return { data: null, error };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { data: data.publicUrl, error: null };
};

export default supabase;
