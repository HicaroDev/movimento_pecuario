import { supabaseAdmin } from '../lib/supabase';

export async function logActivity(params: {
  farmId: string;
  userId: string;
  userName: string;
  module: string;
  action: string; // 'criou' | 'editou' | 'excluiu'
  description: string;
}) {
  try {
    await supabaseAdmin.from('activity_log').insert({
      farm_id:     params.farmId,
      user_id:     params.userId || null,
      user_name:   params.userName,
      module:      params.module,
      action:      params.action,
      description: params.description,
    });
  } catch {
    // fire-and-forget: não bloqueia a operação principal
  }
}
