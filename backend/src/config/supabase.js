/**
 * Supabase Client Configuration
 */

const { createClient } = require('@supabase/supabase-js');

function getConfiguredEnvValue(name) {
  const value = process.env[name]?.trim();

  if (!value) return null;

  const normalizedValue = value.toLowerCase();
  const placeholderMarkers = [
    'your-project.supabase.co',
    'your-anon-key',
    'your-service-key',
    'your-supabase-anon-key',
    'your-supabase-service-role-key',
  ];

  return placeholderMarkers.some((marker) => normalizedValue.includes(marker)) ? null : value;
}

const supabaseUrl = getConfiguredEnvValue('SUPABASE_URL');
const supabaseAnonKey = getConfiguredEnvValue('SUPABASE_ANON_KEY');
const supabaseServiceKey = getConfiguredEnvValue('SUPABASE_SERVICE_KEY');

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const isSupabaseConfigured = Boolean(supabase);
const isSupabaseLoggingConfigured = Boolean(supabaseAdmin);

async function logActivity(data) {
  if (!supabaseAdmin) return null;
  try {
    const { error } = await supabaseAdmin
      .from('processing_logs')
      .insert([{
        user_id: data.user_id || null,
        tool_used: data.tool_used,
        input_files: data.input_files,
        input_size: data.input_size,
        output_size: data.output_size,
        processing_time_ms: data.processing_time_ms,
        status: data.status,
        error_message: data.error_message || null,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
      }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to log activity:', err.message);
    return null;
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  logActivity,
  isSupabaseConfigured,
  isSupabaseLoggingConfigured,
};
