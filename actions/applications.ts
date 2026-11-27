'use server';

import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/session';
import { createApplication, getUserById } from '@/lib/store';
import { applicationSchema } from '@/lib/validation';

export async function submitApplication(formData: FormData) {
    const programId = String(formData.get('programId') || '').trim();
    const programSlug = String(formData.get('programSlug') || '').trim();
    const applicantId = String(formData.get('applicantId') || '').trim();

    if (!programId || !programSlug) redirect('/programs');

    const payload = {
        programId,
        applicantId,
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        country: String(formData.get('country') || '').trim(),
        education: String(formData.get('education') || '').trim(),
        experience: String(formData.get('experience') || '').trim(),
        skills: formData.getAll('skills').map((item) => String(item).trim()).filter(Boolean),
        motivation: String(formData.get('motivation') || '').trim(),
        github: String(formData.get('github') || '').trim(),
        linkedin: String(formData.get('linkedin') || '').trim(),
        portfolio: String(formData.get('portfolio') || '').trim(),
        availability: 'SELF_PACED',
        answers: { questionOne: String(formData.get('questionOne') || '').trim() }
    };

    const parsed = applicationSchema.safeParse(payload);
    if (!parsed.success) redirect(`/programs/${encodeURIComponent(programSlug)}/apply?error=submit-failed`);

    const session = await getSessionUser();
    if (!session) redirect('/login');
    if (session.profileId !== applicantId) redirect('/dashboard');

    const trustedProfile = await getUserById(session.profileId);
    if (!trustedProfile) redirect('/dashboard');

    try {
        await createApplication({
            ...payload,
            applicantId: session.profileId,
            fullName: trustedProfile.fullName,
            email: trustedProfile.email,
            country: parsed.data.country,
            timezone: trustedProfile.timezone || 'UTC',
            education: parsed.data.education,
            experience: parsed.data.experience,
            motivation: parsed.data.motivation,
            availability: 'SELF_PACED',
            skills: parsed.data.skills.split(',').map((item) => item.trim()).filter(Boolean),
        });
    } catch (error) {
        console.error('Application submission failed:', error);
        redirect(`/programs/${encodeURIComponent(programSlug)}/apply?error=submit-failed`);
    }

    redirect(`/application-submitted?program=${encodeURIComponent(programSlug)}`);
}
