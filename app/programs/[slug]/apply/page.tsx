import { redirect } from 'next/navigation';

import { submitApplication } from '@/actions/applications';
import { getSessionUser } from '@/lib/session';
import { listPrograms } from '@/lib/store';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const program = (await listPrograms()).find((item) => item.slug === slug);
    return { title: `Apply to ${program?.title || 'Program'} | TIKSE TECH` };
}

const educationOptions = [
    'High School', 'TVET / Technical Certificate', 'Certificate',
    'Diploma', 'Bachelor’s Degree', 'Master’s Degree', 'Doctorate (PhD)',
    'Other / Self-taught'
];

const experienceOptions = [
    'No formal experience yet',
    'Less than 1 year',
    '1–2 years',
    '3–5 years',
    '6–10 years',
    'More than 10 years'
];

const skillOptions = [
    'Programming', 'Web Development', 'Mobile Development', 'Cybersecurity',
    'Networking', 'Artificial Intelligence', 'Data Analysis', 'Cloud Computing',
    'DevOps', 'UI/UX Design', 'Graphic Design', 'Project Management',
    'Research', 'Communication', 'Digital Marketing'
];

export default async function ApplyToProgramPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const program = (await listPrograms()).find((item) => item.slug === slug);
    const session = await getSessionUser();

    if (!session) redirect('/login');
    if (!program) redirect('/programs');

    return (
        <div className="container-shell py-16">
            <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-9">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Participant application</p>
                <h1 className="mt-3 text-3xl font-black text-slate-900">Apply to {program.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Tell us about your background and the skills you want to develop. This is a self-paced, project-based program: work through the published guidelines and submit each project by its deadline. You do not need to declare weekly availability.</p>

                <form action={submitApplication} className="mt-8 grid gap-5 md:grid-cols-2">
                    <input type="hidden" name="programId" value={program.id} />
                    <input type="hidden" name="applicantId" value={session.profileId} />
                    <div className="md:col-span-2">
                        <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                        <input id="fullName" name="fullName" defaultValue={session.name} required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" />
                    </div>
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                        <input id="email" name="email" type="email" defaultValue={session.email} required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" />
                    </div>
                    <div>
                        <label htmlFor="country" className="mb-2 block text-sm font-semibold text-slate-700">Country</label>
                        <input id="country" name="country" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="Your country" />
                    </div>
                    <div>
                        <label htmlFor="timezone" className="mb-2 block text-sm font-semibold text-slate-700">Timezone</label>
                        <input id="timezone" name="timezone" defaultValue="UTC" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="e.g. Africa/Addis_Ababa" />
                    </div>
                    <div>
                        <label htmlFor="education" className="mb-2 block text-sm font-semibold text-slate-700">Education level</label>
                        <select id="education" name="education" required defaultValue="" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800">
                            <option value="" disabled>Select your highest education level</option>
                            {educationOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="experience" className="mb-2 block text-sm font-semibold text-slate-700">Years of experience</label>
                        <select id="experience" name="experience" required defaultValue="" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800">
                            <option value="" disabled>Select your experience</option>
                            {experienceOptions.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>

                    <fieldset className="md:col-span-2">
                        <legend className="mb-2 text-sm font-semibold text-slate-700">Skills (select all that apply)</legend>
                        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                            {skillOptions.map(skill => (
                                <label key={skill} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-white">
                                    <input type="checkbox" name="skills" value={skill} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    {skill}
                                </label>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Choose at least one skill. You can demonstrate additional skills in your project work.</p>
                    </fieldset>

                    <div>
                        <label htmlFor="github" className="mb-2 block text-sm font-semibold text-slate-700">GitHub profile (optional)</label>
                        <input id="github" name="github" type="url" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="https://github.com/username" />
                    </div>
                    <div>
                        <label htmlFor="linkedin" className="mb-2 block text-sm font-semibold text-slate-700">LinkedIn profile (optional)</label>
                        <input id="linkedin" name="linkedin" type="url" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="https://linkedin.com/in/username" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="portfolio" className="mb-2 block text-sm font-semibold text-slate-700">Portfolio or personal website (optional)</label>
                        <input id="portfolio" name="portfolio" type="url" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="https://yourportfolio.com" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="motivation" className="mb-2 block text-sm font-semibold text-slate-700">Why do you want to join this program?</label>
                        <textarea id="motivation" name="motivation" required minLength={20} className="min-h-32 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="Describe your motivation and what you want to accomplish." />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="questionOne" className="mb-2 block text-sm font-semibold text-slate-700">Program-specific answer</label>
                        <textarea id="questionOne" name="questionOne" required className="min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3" placeholder="Tell us how you would approach the projects and guidelines in this program." />
                    </div>
                    <div className="md:col-span-2">
                        <button className="w-full rounded-xl bg-blue-700 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-800" type="submit">Submit application</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
