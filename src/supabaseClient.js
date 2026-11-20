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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

// Hackathon registration helpers
export const registerForHackathon = async (registrationData) => {
  const { data, error } = await supabase
    .from('hackathon_registrations')
    .insert([{
      ...registrationData,
      created_at: new Date().toISOString(),
    }]);
  return { data, error };
};

export const getHackathonRegistrations = async () => {
  const { data, error } = await supabase
    .from('hackathon_registrations')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

export default supabase;
