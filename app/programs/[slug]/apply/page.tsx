import { redirect } from 'next/navigation';

import { submitApplication } from '@/actions/applications';
import { getSessionUser } from '@/lib/session';
import { listPrograms } from '@/lib/store';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const program = (await listPrograms()).find((item) => item.slug === slug);
    return { title: `Apply to ${program?.title || 'Program'} | TIKSE TECH` };
}

export default async function ApplyToProgramPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const program = (await listPrograms()).find((item) => item.slug === slug);
    const session = await getSessionUser();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Application</p>
                <h1 className="mt-4 text-3xl font-black text-slate-900">Apply to {program?.title || 'this program'}</h1>
                {!session && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        Please log in to apply and ensure your profile email is available.
                    </div>
                )}
                <form action={submitApplication} className="mt-8 grid gap-5 md:grid-cols-2">
                    <input type="hidden" name="programId" value={program?.id || ''} />
                    <input type="hidden" name="applicantId" value={session?.profileId || ''} />
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                        <input name="fullName" defaultValue={session?.name || ''} required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Jane Doe" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                        <input name="email" type="email" defaultValue={session?.email || ''} required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="name@example.com" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Country</label>
                        <input name="country" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Country" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Timezone</label>
                        <input name="timezone" defaultValue="UTC" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="UTC" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Education</label>
                        <input name="education" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Degree or study" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Experience</label>
                        <input name="experience" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Experience" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Skills</label>
                        <input name="skills" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="TypeScript, Design, Security" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Availability</label>
                        <input name="availability" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="8-10 hours/week" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Motivation</label>
                        <textarea name="motivation" required className="min-h-32 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Tell us about your motivation for joining this program." />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Program-specific answer</label>
                        <textarea name="questionOne" required className="min-h-20 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Why do you want to participate?" />
                    </div>
                    <div className="md:col-span-2">
                        <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700" type="submit">Submit application</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
