'use server';

import { redirect } from 'next/navigation';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase';

const skillOptions = [
  'Programming', 'Web Development', 'Mobile Development', 'Cybersecurity',
  'Networking', 'Artificial Intelligence', 'Data Analysis', 'Cloud Computing',
  'DevOps', 'UI/UX Design', 'Graphic Design', 'Project Management',
  'Research', 'Communication', 'Digital Marketing'
];

export async function saveParticipantAdminAction(formData: FormData) {
  const session = await getSessionUser();
  if (!session || !hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
    throw new Error('Administrator access is required to manage participant accounts.');
  }

  const participantId = String(formData.get('participantId') || '').trim();
  const fullName = String(formData.get('fullName') || '').trim().slice(0, 160);
  const country = String(formData.get('country') || '').trim().slice(0, 100);
  const timezone = String(formData.get('timezone') || '').trim().slice(0, 100);
  const education = String(formData.get('education') || '').trim().slice(0, 160);
  const experience = String(formData.get('experience') || '').trim().slice(0, 100);
  const participantNumber = String(formData.get('participantNumber') || '').trim().toUpperCase().slice(0, 40);
  const accountStatus = String(formData.get('accountStatus') || 'ACTIVE');
  const skills = formData.getAll('skills').map(value => String(value)).filter(value => skillOptions.includes(value));

  if (!participantId || fullName.length < 2 || !/^TT-P-[A-Z0-9-]{4,32}$/.test(participantNumber)) {
    throw new Error('Provide a valid participant name and ID (format: TT-P-XXXXXXXX).');
  }
  if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) throw new Error('Invalid account status.');

  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error('Supabase server credentials are not configured.');

  const { data: before, error: readError } = await admin.from('profiles')
    .select('id, auth_user_id, role, participant_number, account_status').eq('id', participantId).maybeSingle();
  if (readError || !before || before.role !== 'PARTICIPANT') {
    throw new Error('The participant record could not be found or is not editable.');
  }

  const { error } = await admin.from('profiles').update({
    full_name: fullName,
    country: country || null,
    timezone: timezone || null,
    education: education || null,
    experience: experience || null,
    skills,
    participant_number: participantNumber,
    account_status: accountStatus,
    updated_at: new Date().toISOString()
  }).eq('id', participantId).eq('role', 'PARTICIPANT');

  if (error) {
    if (error.code === '23505') throw new Error('That participant ID is already assigned to another account.');
    throw new Error('Participant account could not be updated: ' + error.message);
  }

  if (before.auth_user_id) {
    const { error: authError } = await admin.auth.admin.updateUserById(before.auth_user_id, {
      ban_duration: accountStatus === 'SUSPENDED' ? '876000h' : 'none'
    });
    if (authError) {
      await admin.from('profiles').update({ account_status: before.account_status || 'ACTIVE' }).eq('id', participantId);
      throw new Error('Participant profile was saved, but authentication access could not be updated: ' + authError.message);
    }
  }

  await admin.from('audit_logs').insert({
    actor: session.profileId,
    action: 'PARTICIPANT_ACCOUNT_UPDATED',
    entity: 'profiles',
    entity_id: participantId,
    metadata: {
      participant_number_before: before.participant_number,
      participant_number_after: participantNumber,
      account_status: accountStatus
    }
  });

  redirect('/admin/participants/' + participantId + '?updated=1');
}
