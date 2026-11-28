import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Archive, BookOpen, Plus, Save } from 'lucide-react';
import { createProgram, updateProgram } from '@/actions/programs';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata = { title: 'Program management | TIKSE TECH' };

const statuses = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'COMPLETED', 'ARCHIVED'];

function dateValue(value: string | null) {
    return value ? value.slice(0, 10) : '';
}

export default async function AdminProgramsPage({ searchParams }: { searchParams?: Promise<{ saved?: string }> }) {
    const params = searchParams ? await searchParams : {};
    const session = await getSessionUser();
    if (!session) redirect('/admin/login');
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) redirect('/dashboard');

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('programs')
        .select('id, slug, title, category, short_description, description, duration, difficulty, start_date, end_date, application_deadline, available_seats, current_participants, status, community_url, created_at')
        .order('created_at', { ascending: false });
    if (error) throw new Error('Program records could not be loaded: ' + error.message);

    const programs = data || [];

    return (
        <main className="container-shell py-10 sm:py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Learning operations</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Program management</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create, edit, publish, close, and archive programs using the live database. Existing public URLs remain stable when a program title changes.</p>
                </div>
                <Link href="/admin" className="text-sm font-semibold text-blue-700 hover:underline">← Administrator overview</Link>
            </div>

            {params.saved ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Program changes saved successfully.</p> : null}

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                    <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Plus className="h-5 w-5" aria-hidden="true" /></span>
                    <div><h2 className="text-lg font-black text-slate-950">Create a program</h2><p className="mt-1 text-sm text-slate-500">New records start as drafts unless you explicitly publish them.</p></div>
                </div>
                <form action={createProgram} className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">Program title<input name="title" required minLength={3} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" placeholder="e.g. Digital Skills Fellowship" /></label>
                    <label className="text-sm font-semibold text-slate-700">Category<input name="category" required minLength={2} maxLength={80} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" placeholder="e.g. Software Development" /></label>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Short description<input name="shortDescription" required minLength={10} maxLength={220} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Full description<textarea name="description" required minLength={20} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700">Duration<input name="duration" required minLength={2} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" placeholder="e.g. 8 Weeks" /></label>
                    <label className="text-sm font-semibold text-slate-700">Difficulty<select name="difficulty" defaultValue="Beginner" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
                    <label className="text-sm font-semibold text-slate-700">Start date<input type="date" name="startDate" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700">End date<input type="date" name="endDate" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700">Application deadline<input type="date" name="applicationDeadline" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700">Available seats<input type="number" name="availableSeats" min={1} max={10000} defaultValue={20} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700">Initial status<select name="status" defaultValue="DRAFT" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
                    <label className="text-sm font-semibold text-slate-700">Community URL (optional)<input type="url" name="communityUrl" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" placeholder="https://" /></label>
                    <div className="sm:col-span-2"><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"><Plus className="h-4 w-4" aria-hidden="true" /> Create program</button></div>
                </form>
            </section>

            <div className="mt-9 flex flex-wrap items-end justify-between gap-3">
                <div><h2 className="text-xl font-black text-slate-950">Existing programs</h2><p className="mt-1 text-sm text-slate-500">{programs.length.toLocaleString('en')} database record{programs.length === 1 ? '' : 's'}</p></div>
            </div>

            <div className="mt-5 space-y-5">
                {programs.map((program) => (
                    <section key={program.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><BookOpen className="h-5 w-5" aria-hidden="true" /></span>
                                <div><h3 className="font-black text-slate-950">{program.title}</h3><p className="mt-0.5 text-xs text-slate-500">{program.category} · /programs/{program.slug}</p></div>
                            </div>
                            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${program.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : program.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>{program.status.replaceAll('_', ' ')}</span>
                        </div>
                        <form action={updateProgram} className="grid gap-4 p-5 sm:grid-cols-2">
                            <input type="hidden" name="programId" value={program.id} />
                            <input type="hidden" name="slug" value={program.slug} />
                            <label className="text-sm font-semibold text-slate-700">Title<input name="title" defaultValue={program.title} required minLength={3} maxLength={120} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700">Category<input name="category" defaultValue={program.category} required minLength={2} maxLength={80} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Short description<input name="shortDescription" defaultValue={program.short_description} required minLength={10} maxLength={220} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Full description<textarea name="description" defaultValue={program.description} required minLength={20} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700">Duration<input name="duration" defaultValue={program.duration} required minLength={2} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700">Difficulty<select name="difficulty" defaultValue={program.difficulty} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
                            <label className="text-sm font-semibold text-slate-700">Start date<input type="date" name="startDate" defaultValue={dateValue(program.start_date)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700">End date<input type="date" name="endDate" defaultValue={dateValue(program.end_date)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700">Application deadline<input type="date" name="applicationDeadline" defaultValue={dateValue(program.application_deadline)} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700">Available seats<input type="number" name="availableSeats" defaultValue={program.available_seats} min={1} max={10000} required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <label className="text-sm font-semibold text-slate-700">Status<select name="status" defaultValue={program.status} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
                            <label className="text-sm font-semibold text-slate-700">Community URL<input type="url" name="communityUrl" defaultValue={program.community_url || ''} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:col-span-2">
                                <p className="text-xs text-slate-500">Current participants: {program.current_participants} · Record ID: <span className="font-mono">{program.id.slice(0, 8)}</span></p>
                                <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"><Save className="h-4 w-4" aria-hidden="true" /> Save changes</button>
                            </div>
                        </form>
                    </section>
                ))}
                {!programs.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Archive className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" /><h3 className="mt-3 font-bold text-slate-900">No programs in the database</h3><p className="mt-1 text-sm text-slate-500">Create a program above. Drafts remain private until published.</p></div> : null}
            </div>
        </main>
    );
}
