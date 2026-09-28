import Link from 'next/link';
import { ArrowRight, CalendarRange, Globe2, Users } from 'lucide-react';

import { listPrograms } from '@/lib/store';

export const metadata = {
    title: 'Programs | TIKSE TECH',
    description: 'Browse open remote technology programs and learning opportunities.'
};

export default async function ProgramsPage() {
    const programs = await listPrograms();

    return (
        <div className="container-shell py-20">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Open programs</p>
                    <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Explore remote learning opportunities</h1>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:flex">
                    <Globe2 className="h-4 w-4 text-blue-600" />
                    Remote — Worldwide
                </div>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {programs.map((program) => (
                    <article key={program.id} className="card-surface overflow-hidden p-6">
                        <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">{program.category}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{program.status}</span>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900">{program.title}</h2>
                        <p className="mt-3 text-slate-600">{program.shortDescription}</p>

                        <div className="mt-5 space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-blue-600" /> {program.duration}</div>
                            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> {program.availableSeats} seats available</div>
                        </div>

                        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                            <span>{program.difficulty}</span>
                            <span>{program.applicationDeadline}</span>
                        </div>

                        <Link href={`/programs/${program.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
                            View program <ArrowRight className="h-4 w-4" />
                        </Link>
                    </article>
                ))}
            </div>
        </div>
    );
}
