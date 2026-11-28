import { publishAnnouncement } from '@/actions/announcements';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata = { title: 'Activity & announcements | TIKSE TECH' };

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default async function AdminActivityPage({ searchParams }: { searchParams?: Promise<{ published?: string }> }) {
    const params = searchParams ? await searchParams : {};
    const supabase = await createSupabaseServerClient();
    const [announcementsResult, auditResult] = await Promise.all([
        supabase.from('announcements').select('id,title,message,created_at').order('created_at', { ascending: false }).limit(12),
        supabase.from('audit_logs').select('id,action,entity,timestamp').order('timestamp', { ascending: false }).limit(30)
    ]);

    const announcements = announcementsResult.data || [];
    const auditEvents = auditResult.data || [];

    return (
        <main className="container-shell py-10 sm:py-12">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Platform operations</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Activity & announcements</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Publish verified platform updates for signed-in participants and review recent administrative activity.</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">Live database records</span>
            </div>

            {params.published === '1' ? <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Announcement published and available in participant dashboards.</p> : null}

            <div className="grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                <section className="surface-panel p-6 sm:p-7">
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Communication</p>
                        <h2 className="mt-2 text-xl font-black text-slate-950">Publish an announcement</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Announcements appear to authenticated participants. Keep updates clear and actionable.</p>
                    </div>
                    <form action={publishAnnouncement} className="space-y-4">
                        <div>
                            <label htmlFor="announcement-title" className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
                            <input id="announcement-title" name="title" required minLength={4} maxLength={120} className="field-control" placeholder="e.g. Application review update" />
                        </div>
                        <div>
                            <label htmlFor="announcement-message" className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                            <textarea id="announcement-message" name="message" required minLength={10} maxLength={3000} rows={7} className="field-control resize-y" placeholder="Write the update participants need to know..." />
                            <p className="mt-2 text-xs text-slate-500">10–3,000 characters. Do not include passwords or private participant information.</p>
                        </div>
                        <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-offset-4">Publish announcement</button>
                    </form>
                </section>

                <div className="space-y-6">
                    <section className="surface-panel p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Communication feed</p><h2 className="mt-1 text-xl font-black text-slate-950">Published announcements</h2></div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{announcements.length}</span>
                        </div>
                        {announcementsResult.error ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Announcements could not be loaded. Refresh this page or check database access.</p> : announcements.length ? (
                            <div className="space-y-3">
                                {announcements.map(item => (
                                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{item.title}</h3><time className="text-xs text-slate-500">{formatDate(item.created_at)}</time></div>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.message}</p>
                                    </article>
                                ))}
                            </div>
                        ) : <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center"><p className="font-semibold text-slate-700">No announcements yet</p><p className="mt-1 text-sm text-slate-500">Your first published update will appear here.</p></div>}
                    </section>

                    <section className="surface-panel p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Governance</p><h2 className="mt-1 text-xl font-black text-slate-950">Recent admin activity</h2></div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{auditEvents.length}</span>
                        </div>
                        {auditResult.error ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">Audit activity could not be loaded. Check administrator database permissions.</p> : auditEvents.length ? (
                            <ol className="divide-y divide-slate-100">
                                {auditEvents.map(event => (
                                    <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                        <div><p className="text-sm font-bold text-slate-800">{event.action.replaceAll('_', ' ')}</p><p className="mt-1 text-xs text-slate-500">{event.entity}</p></div>
                                        <time className="text-xs tabular-nums text-slate-500">{formatDate(event.timestamp)}</time>
                                    </li>
                                ))}
                            </ol>
                        ) : <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center"><p className="font-semibold text-slate-700">No audit events recorded</p><p className="mt-1 text-sm text-slate-500">Administrative actions will appear here when recorded by the platform.</p></div>}
                    </section>
                </div>
            </div>
        </main>
    );
}
