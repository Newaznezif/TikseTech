'use server';

import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/session';
import { createApplication } from '@/lib/store';
import { applicationSchema } from '@/lib/validation';

export async function submitApplication(formData: FormData) {
    const programId = String(formData.get('programId') || '').trim();
    const applicantId = String(formData.get('applicantId') || '').trim();

    if (!programId) {
        throw new Error('A valid program is required before submitting an application.');
    }

    const payload = {
        programId,
        applicantId,
        fullName: String(formData.get('fullName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        country: String(formData.get('country') || '').trim(),
        timezone: String(formData.get('timezone') || 'UTC').trim(),
        education: String(formData.get('education') || '').trim(),
        experience: String(formData.get('experience') || '').trim(),
        skills: String(formData.get('skills') || '').split(',').map((item) => item.trim()).filter(Boolean),
        motivation: String(formData.get('motivation') || '').trim(),
        github: String(formData.get('github') || '').trim(),
        linkedin: String(formData.get('linkedin') || '').trim(),
        portfolio: String(formData.get('portfolio') || '').trim(),
        availability: String(formData.get('availability') || '').trim(),
        answers: {
            questionOne: String(formData.get('questionOne') || '').trim()
        }
    };

    const parsed = applicationSchema.safeParse({
        ...payload,
        skills: payload.skills
    });
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Please enter a valid email address before submitting.');
    }

    const session = await getSessionUser();
    if (!session) {
        throw new Error('Please log in before applying to a program.');
    }

    const finalApplicantId = applicantId || session.profileId;
    if (session.profileId !== finalApplicantId) {
        throw new Error('You can only submit an application from your own account.');
    }

    const skills = String(parsed.data.skills)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    await createApplication({
        ...payload,
        applicantId: finalApplicantId,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        country: parsed.data.country,
        timezone: parsed.data.timezone,
        education: parsed.data.education,
        experience: parsed.data.experience,
        motivation: parsed.data.motivation,
        availability: parsed.data.availability,
        skills,
        applicationId: `${programId}-${finalApplicantId}`
    });

    redirect('/dashboard');
}
