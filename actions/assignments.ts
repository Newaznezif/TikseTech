'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { canAccessProgramCommunity } from '@/lib/store';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUBMISSION_TYPES = new Set([
    'application/pdf', 'application/zip', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

function safeFileName(name: string) {
    return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').slice(-100) || 'submission';
}

async function hasExpectedSignature(file: File) {
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (file.type === 'application/pdf') return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
    if (file.type === 'application/zip' || file.type.includes('wordprocessingml')) {
        return bytes[0] === 0x50 && bytes[1] === 0x4b;
    }
    return file.type === 'text/plain';
}

export async function createChallengeDocument(formData: FormData) {
    const session = await getSessionUser();
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) throw new Error('Administrator access is required.');

    const programId = String(formData.get('programId') || '');
    const title = String(formData.get('title') || '').trim();
    const field = String(formData.get('field') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const file = formData.get('file');
    if (!programId || title.length < 3 || field.length < 2 || !(file instanceof File)) throw new Error('Complete all required challenge fields.');
    if (file.type !== 'application/pdf' || file.size < 1 || file.size > MAX_FILE_SIZE) throw new Error('Upload a PDF file up to 10 MB.');
    if (!(await hasExpectedSignature(file))) throw new Error('The uploaded file does not appear to be a valid PDF.');

    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error('Supabase server credentials are not configured.');
    const { data: program, error: programError } = await admin.from('programs').select('id').eq('id', programId).maybeSingle();
    if (programError || !program) throw new Error('Select a valid program.');

    const id = randomUUID();
    const path = programId + '/' + id + '-' + safeFileName(file.name);
    const { error: uploadError } = await admin.storage.from('challenge-pdfs').upload(path, file, {
        contentType: 'application/pdf', upsert: false
    });
    if (uploadError) throw new Error('Challenge upload failed: ' + uploadError.message);

    const { error: insertError } = await admin.from('challenge_documents').insert({
        id, program_id: programId, title, field, description, file_path: path,
        original_file_name: file.name, mime_type: 'application/pdf', file_size_bytes: file.size,
        is_published: formData.get('isPublished') === 'on', created_by: session!.profileId
    });
    if (insertError) {
        await admin.storage.from('challenge-pdfs').remove([path]);
        throw new Error('Challenge record could not be saved: ' + insertError.message);
    }
    revalidatePath('/admin/challenges');
    revalidatePath('/dashboard/assignments');
    redirect('/admin/challenges?created=1');
}

export async function submitAssignment(formData: FormData) {
    const session = await getSessionUser();
    if (!session) redirect('/login');
    const challengeId = String(formData.get('challengeId') || '');
    const note = String(formData.get('submissionNote') || '').trim();
    const file = formData.get('file');
    if (!challengeId || !(file instanceof File)) throw new Error('Choose a challenge and attach your assignment.');
    if (!SUBMISSION_TYPES.has(file.type) || file.size < 1 || file.size > MAX_FILE_SIZE) {
        throw new Error('Use PDF, DOCX, ZIP, or TXT up to 10 MB.');
    }
    if (!(await hasExpectedSignature(file))) throw new Error('The file signature does not match its declared format.');

    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error('Supabase server credentials are not configured.');
    const { data: challenge, error: challengeError } = await admin.from('challenge_documents')
        .select('id, program_id, is_published').eq('id', challengeId).maybeSingle();
    if (challengeError || !challenge || !challenge.is_published) throw new Error('This challenge is not available.');
    const eligible = hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN']) ||
        await canAccessProgramCommunity(challenge.program_id, session.profileId);
    if (!eligible) throw new Error('You must be accepted into or enrolled in this program before submitting work.');

    const id = randomUUID();
    const path = session.profileId + '/' + id + '-' + safeFileName(file.name);
    const { error: uploadError } = await admin.storage.from('assignment-submissions').upload(path, file, {
        contentType: file.type, upsert: false
    });
    if (uploadError) throw new Error('Assignment upload failed: ' + uploadError.message);

    const { error: insertError } = await admin.from('assignment_submissions').insert({
        id, challenge_id: challenge.id, program_id: challenge.program_id, applicant_id: session.profileId,
        file_path: path, original_file_name: file.name, mime_type: file.type, file_size_bytes: file.size,
        submission_note: note || null, status: 'SUBMITTED'
    });
    if (insertError) {
        await admin.storage.from('assignment-submissions').remove([path]);
        throw new Error('Assignment record could not be saved: ' + insertError.message);
    }
    revalidatePath('/dashboard/assignments');
    revalidatePath('/admin/reviews');
    redirect('/dashboard/assignments?submitted=1');
}

export async function reviewAssignment(formData: FormData) {
    const session = await getSessionUser();
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) throw new Error('Administrator access is required.');
    const id = String(formData.get('submissionId') || '');
    const status = String(formData.get('status') || 'UNDER_REVIEW');
    const scoreText = String(formData.get('score') || '').trim();
    const feedback = String(formData.get('feedback') || '').trim();
    const allowed = ['UNDER_REVIEW', 'NEEDS_REVISION', 'ACCEPTED', 'REJECTED'];
    if (!id || !allowed.includes(status)) throw new Error('Invalid review request.');
    const score = scoreText === '' ? null : Number(scoreText);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) throw new Error('Score must be between 0 and 100.');
    if (status === 'ACCEPTED' && (score === null || score < 70)) throw new Error('An assignment can only be accepted with a score of at least 70/100.');
    if (feedback.length > 5000) throw new Error('Feedback must be 5,000 characters or fewer.');

    const admin = getSupabaseAdminClient();
    if (!admin) throw new Error('Supabase server credentials are not configured.');
    const { data, error } = await admin.from('assignment_submissions').update({
        status, score, max_score: 100, feedback: feedback || null,
        reviewer_id: session!.profileId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).eq('id', id).select('id, applicant_id, program_id').single();
    if (error || !data) throw new Error('Could not save the review: ' + (error?.message || 'Submission not found.'));
    await admin.from('audit_logs').insert({
        actor: session!.profileId, action: 'ASSIGNMENT_REVIEWED', entity: 'assignment_submissions',
        entity_id: id, metadata: { status, score }
    });
    const [participantResult, programResult] = await Promise.all([
        admin.from('profiles').select('full_name,email').eq('id', data.applicant_id).maybeSingle(),
        admin.from('programs').select('title').eq('id', data.program_id).maybeSingle()
    ]);
    if (participantResult.data?.email && programResult.data?.title) {
        const { sendStatusEmail } = await import('@/lib/email');
        await sendStatusEmail({ to: participantResult.data.email, name: participantResult.data.full_name,
            subject: 'TIKSE TECH assignment review update', programTitle: programResult.data.title, status, feedback });
    }
    revalidatePath('/admin/reviews');
    revalidatePath('/dashboard/assignments');
    redirect('/admin/reviews?saved=1');
}
