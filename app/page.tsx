import Link from 'next/link';
import { BriefcaseBusiness, CheckCircle2, Globe2, GraduationCap, ShieldCheck, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { listPrograms } from '@/lib/store';

export default async function HomePage() {
    const programs = (await listPrograms()).slice(0, 3);

    return (
        <div>
            <section className="bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_55%,_#ffffff)]">
                <div className="container-shell grid gap-12 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
                    <div>
                        <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                            Global remote technology learning
                        </div>
                        <h1 className="max-w-xl text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
                            Build Skills. Gain Experience. Connect Globally.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-slate-600">
                            TIKSE TECH connects young technology talent from around the world with fully remote technology programs, internships, practical experience, mentorship, and global opportunities.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link href="/programs" className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-base font-medium text-white hover:bg-blue-700">
                                Explore Programs
                            </Link>
                            <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-base font-medium text-slate-900 hover:bg-slate-50">
                                Join TIKSE TECH
                            </Link>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-blue-600" /> Worldwide participation</span>
                            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Global community</span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Open programs</p>
                        <div className="mt-6 space-y-4">
                            {programs.map((program) => (
                                <div key={program.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{program.category}</p>
                                    <h2 className="mt-2 text-xl font-bold text-slate-900">{program.title}</h2>
                                    <p className="mt-2 text-sm text-slate-600">{program.shortDescription}</p>
                                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                                        <span>{program.duration}</span>
                                        <span>{program.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="container-shell py-20">
                <div className="mb-12 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Technology categories</p>
                    <h2 className="mt-4 section-title">Build in the areas shaping tomorrow</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Programming / Software Development', 'Build apps, systems, and products with modern engineering workflows.'],
                        ['Cybersecurity', 'Learn defense, monitoring, and incident response fundamentals.'],
                        ['Computer Networking', 'Understand networks, systems, and reliable digital infrastructure.'],
                        ['Artificial Intelligence', 'Explore AI, models, data pipelines, and applied experimentation.'],
                        ['Cloud & DevOps', 'Deploy systems, automate workflows, and manage operations.'],
                        ['Data & Analytics', 'Work with data, insights, and dashboards for decision-making.'],
                        ['IT & Systems', 'Strengthen configuration, support, and digital operations skills.'],
                        ['UI/UX and Digital Technology', 'Design user-centered digital products and polished experiences.']
                    ].map(([title, text]) => (
                        <div key={title} className="card-surface p-6">
                            <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
                                <BriefcaseBusiness className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                            <p className="mt-3 text-sm text-slate-600">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-slate-900 py-20 text-white">
                <div className="container-shell">
                    <div className="mb-12 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">How TIKSE TECH works</p>
                        <h2 className="mt-4 section-title text-white">A simple path from learning to opportunity</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            ['1. Discover', 'Explore remote programs that offer skills, real projects, and mentorship.'],
                            ['2. Apply', 'Create an account, submit your application, and track your progress.'],
                            ['3. Grow', 'Join a cohort, complete learning tasks, and earn a certificate of completion.']
                        ].map(([step, text]) => (
                            <div key={step} className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                                <p className="text-blue-300">{step}</p>
                                <p className="mt-4 text-lg font-semibold">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="container-shell py-20">
                <div className="mb-12 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Why join TIKSE TECH</p>
                    <h2 className="mt-4 section-title">A global pathway to practical technology experience</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Remotely accessible', 'Programs are designed for participants anywhere in the world.'],
                        ['Mentorship and support', 'Learn from mentors, facilitators, and community peers.'],
                        ['Career-ready projects', 'Build practical skills with applied work and guided learning.'],
                        ['Verified certificates', 'Ready for public verification and reusable recognition.']
                    ].map(([title, text]) => (
                        <div key={title} className="card-surface p-6">
                            <CheckCircle2 className="h-7 w-7 text-blue-600" />
                            <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
                            <p className="mt-3 text-sm text-slate-600">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-slate-100 py-20">
                <div className="container-shell grid gap-10 lg:grid-cols-2">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Certificate verification</p>
                        <h2 className="mt-4 section-title">Public verification for credentials</h2>
                        <p className="mt-4 text-slate-600">Participants can share a verification code and the public verification page confirms whether a certificate is active or revoked.</p>
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 text-slate-700"><ShieldCheck className="h-5 w-5 text-blue-600" /> Secure unique verification codes</div>
                            <div className="flex items-center gap-3 text-slate-700"><GraduationCap className="h-5 w-5 text-blue-600" /> Completion-based certificate issuance</div>
                            <div className="flex items-center gap-3 text-slate-700"><Users className="h-5 w-5 text-blue-600" /> Global, trustworthy, and easy to verify</div>
                        </div>
                    </div>
                    <div className="card-surface p-8">
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                            <p className="text-sm font-medium text-slate-500">Verify a certificate</p>
                            <input aria-label="Verification code" className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-3 text-base" placeholder="TT-2026-8F4K9X2M7Q" />
                            <div className="mt-4 flex gap-3">
                                <Button variant="primary">Verify</Button>
                                <Link href="/certificates/verify" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-800">Open Page</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container-shell py-20">
                <div className="card-surface overflow-hidden p-10">
                    <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Join the community</p>
                            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Ready to grow your future in tech?</h2>
                            <p className="mt-4 max-w-xl text-slate-600">Explore open programs, apply for opportunities, and connect with a global network built for young technology talent.</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/programs" className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-base font-medium text-white hover:bg-blue-700">
                                Explore Programs
                            </Link>
                            <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-6 text-base font-medium text-slate-900 hover:bg-slate-50">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
