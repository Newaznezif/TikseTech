import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarRange, CheckCircle2, Clock3, Globe2, Users } from 'lucide-react';

import { getSessionUser } from '@/lib/session';
import { canAccessProgramCommunity, getProgramBySlug } from '@/lib/store';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const program = await getProgramBySlug(slug);
    if (!program) {
        return { title: 'Program Not Found | TIKSE TECH' };
    }

    return {
        title: `${program.title} | TIKSE TECH`,
        description: program.shortDescription
    };
}

export default async function ProgramDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const program = await getProgramBySlug(slug);

    if (!program) {
        notFound();
    }

    const session = await getSessionUser();
    const communityAccess = session && session.profileId ? await canAccessProgramCommunity(program.id, session.profileId) : false;

    return (
        <div className="container-shell py-20">
            <Link href="/programs" className="text-sm font-semibold text-blue-700">← Back to programs</Link>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold uppercase tracking-[0.18em] text-blue-700">{program.category}</span>
                        <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-blue-600" /> Remote — Worldwide</span>
                    </div>
                    <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">{program.title}</h1>
                    <p className="mt-5 text-lg text-slate-600">{program.description}</p>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        <div className="card-surface p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Official Program Information</p>
                            <ul className="mt-4 space-y-3 text-slate-700">
                                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-600" /> Program overview, duration, eligibility, and start date.</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-600" /> Completion requirements and certificate information.</li>
                            </ul>
                        </div>
                        <div className="card-surface p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Internship Community</p>
                            <p className="mt-4 text-slate-700">
                                Detailed internship guidelines and weekly task instructions are provided through the official TIKSE TECH community platform after participants are accepted.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        <div className="card-surface p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">What you will learn</p>
                            <ul className="mt-4 space-y-3 text-slate-700">
                                {program.learningOutcomes.map((item) => (
                                    <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-600" /> {item}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="card-surface p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Program structure</p>
                            <ul className="mt-4 space-y-3 text-slate-700">
                                <li className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-blue-600" /> {program.duration}</li>
                                <li className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-blue-600" /> {program.startDate} to {program.endDate}</li>
                                <li className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /> {program.availableSeats} available seats</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        <div className="card-surface p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Requirements</p>
                            <ul className="mt-4 space-y-2 text-slate-700">
                                {program.requirements.map((item) => <li key={item}>• {item}</li>)}
                            </ul>
                        </div>
                        <div className="card-surface p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Skills</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {program.skills.map((skill) => (
                                    <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {program.communityUrl && (
                        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                            <h2 className="text-xl font-black text-slate-900">Internship Community</h2>
                            {communityAccess ? (
                                <>
                                    <p className="mt-3 text-sm font-medium text-green-700">You have been accepted into this program.</p>
                                    <p className="mt-2 text-slate-700">Program start information and community updates are available through the official TIKSE TECH internship community.</p>
                                    <Link href={program.communityUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700">
                                        Join Internship Community
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="mt-3 text-slate-700">Detailed manuals, weekly task instructions, announcements, and discussions are delivered through the official TIKSE TECH community platform after acceptance.</p>
                                    <p className="mt-2 text-sm text-slate-500">Community access is limited to participants who are accepted, enrolled, or active.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <aside className="card-surface h-fit p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Application</p>
                    <div className="mt-5 space-y-4 text-sm text-slate-700">
                        <div className="flex justify-between"><span>Duration</span><strong>{program.duration}</strong></div>
                        <div className="flex justify-between"><span>Level</span><strong>{program.difficulty}</strong></div>
                        <div className="flex justify-between"><span>Deadline</span><strong>{program.applicationDeadline}</strong></div>
                        <div className="flex justify-between"><span>Seats</span><strong>{program.availableSeats}</strong></div>
                    </div>
                    <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                        Official record: participants who complete the program can receive a TIKSE TECH certificate of completion.
                    </div>
                    <Link href={`/programs/${program.slug}/apply`} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700">
                        Apply Now
                    </Link>
                </aside>
            </div>
        </div>
    );
}
