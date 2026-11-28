'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';

const skillOptions = [
    'Programming', 'Web Development', 'Mobile Development', 'Cybersecurity',
    'Networking', 'Artificial Intelligence', 'Data Analysis', 'Cloud Computing',
    'DevOps', 'UI/UX Design', 'Graphic Design', 'Project Management',
    'Research', 'Communication', 'Digital Marketing'
];

function safeUrl(value: string, label: string) {
    if (!value) return null;
    try {
        const parsed = new URL(value);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        return parsed.toString();
    } catch {
        throw new Error(label + ' must be a valid HTTP or HTTPS URL.');
    }
}

export async function updateOwnProfile(formData: FormData) {
    const session = await getSessionUser();
    if (!session) redirect('/login?next=/profile');

    const fullName = String(formData.get('fullName') || '').trim();
    const country = String(formData.get('country') || '').trim();
    const timezone = String(formData.get('timezone') || '').trim();
    const shortBio = String(formData.get('shortBio') || '').trim();
    const education = String(formData.get('education') || '').trim();
    const experience = String(formData.get('experience') || '').trim();
    const skills = formData.getAll('skills').map(value => String(value)).filter(value => skillOptions.includes(value));

    if (fullName.length < 2 || fullName.length > 160) redirect('/profile?error=name');
    if (country.length > 100 || timezone.length > 100 || shortBio.length > 500 || education.length > 160 || experience.length > 160) {
        redirect('/profile?error=length');
    }

    let github: string | null, linkedin: string | null, portfolio: string | null, website: string | null;
    try {
        github = safeUrl(String(formData.get('github') || '').trim(), 'GitHub profile');
        linkedin = safeUrl(String(formData.get('linkedin') || '').trim(), 'LinkedIn profile');
        portfolio = safeUrl(String(formData.get('portfolio') || '').trim(), 'Portfolio');
        website = safeUrl(String(formData.get('website') || '').trim(), 'Website');
    } catch {
        redirect('/profile?error=url');
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('profiles').update({
        full_name: fullName,
        country: country || null,
        timezone: timezone || null,
        short_bio: shortBio || null,
        education: education || null,
        experience: experience || null,
        skills,
        github,
        linkedin,
        portfolio,
        website,
        updated_at: new Date().toISOString()
    }).eq('id', session.profileId).select('id').maybeSingle();

    if (error || !data) redirect('/profile?error=save');
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    redirect('/profile?saved=1');
}
