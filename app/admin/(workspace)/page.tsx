import Link from "next/link";
import { createProgram } from "@/actions/programs";
import { getSessionUser, hasRequiredRole } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const metadata = { title: "Operations overview | TIKSE TECH" };

const metrics = [
    { key: "totalUsers", label: "Participant accounts", note: "Registered profiles" },
    { key: "totalApplicants", label: "Applications", note: "All submitted applications" },
    { key: "activePrograms", label: "Open programs", note: "Accepting or running" },
    { key: "openApplications", label: "Awaiting review", note: "Requires an admission decision" },
    { key: "acceptedParticipants", label: "Accepted", note: "Approved applications" },
    { key: "activeParticipants", label: "Active enrollments", note: "Participants in training" },
    { key: "certificatesIssued", label: "Certificates", note: "Active and revoked records" }
] as const;

function statusClass(status: string) {
    if (["OPEN", "IN_PROGRESS", "ACCEPTED", "ACTIVE"].includes(status)) return "bg-emerald-50 text-emerald-700";
    if (["DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(status)) return "bg-amber-50 text-amber-700";
    if (["CLOSED", "ARCHIVED", "REJECTED"].includes(status)) return "bg-slate-100 text-slate-600";
    return "bg-blue-50 text-blue-700";
}

export default async function AdminDashboardPage() {
    const session = await getSessionUser();
    if (!session) redirect("/admin/login");
    if (!hasRequiredRole(session, ["ADMIN", "SUPER_ADMIN"])) redirect("/dashboard");

    const supabase = await createSupabaseServerClient();
    const [profiles, applications, programsCount, openApplications, accepted, enrollments, certificates, programs, recentApplications] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "PARTICIPANT"),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("programs").select("id", { count: "exact", head: true }).in("status", ["OPEN", "IN_PROGRESS"]),
        supabase.from("applications").select("id", { count: "exact", head: true }).in("status", ["SUBMITTED", "UNDER_REVIEW"]),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "ACCEPTED"),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).in("status", ["ENROLLED", "ACTIVE"]),
        supabase.from("certificates").select("id", { count: "exact", head: true }).in("status", ["ACTIVE", "REVOKED"]),
        supabase.from("programs").select("id,title,status,category,created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("applications").select("id,full_name,email,status,submitted_at,programs(title)").order("submitted_at", { ascending: false }).limit(6)
    ]);

    const results = [profiles, applications, programsCount, openApplications, accepted, enrollments, certificates, programs, recentApplications];
    const queryError = results.find((result) => result.error)?.error;
    const stats = {
        totalUsers: profiles.count ?? 0,
        totalApplicants: applications.count ?? 0,
        activePrograms: programsCount.count ?? 0,
        openApplications: openApplications.count ?? 0,
        acceptedParticipants: accepted.count ?? 0,
        activeParticipants: enrollments.count ?? 0,
        certificatesIssued: certificates.count ?? 0
    };

    return (
        <main className="container-shell py-8 sm:py-10">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0a1628] p-6 text-white shadow-xl sm:p-8 lg:p-10">
                <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">TIKSE TECH · Operations</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Good to see you, {session.name || "Administrator"}.</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">A live overview of program delivery, admissions, participant progress, and credential operations.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/admin/applications" className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">Review applications</Link>
                        <Link href="/admin/activity" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Activity & notices</Link>
                    </div>
                </div>
                <div className="relative mt-7 flex flex-wrap gap-2 text-xs text-slate-300">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{session.role.replaceAll("_", " ")}</span>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-emerald-200">Authenticated workspace</span>
                </div>
            </section>

            {queryError ? <div role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Some live dashboard data could not be loaded. Check administrator database permissions and refresh the page. {queryError.message}</div> : null}

            <section className="mt-7">
                <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Platform health</p><h2 className="mt-1 text-xl font-black text-slate-950">Key operating metrics</h2></div><span className="text-xs text-slate-500">Live database counts</span></div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric, index) => (
                        <article key={metric.key} className="surface-panel p-5">
                            <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-600">{metric.label}</p><span className={`h-2 w-2 rounded-full ${index === 3 ? "bg-amber-500" : "bg-blue-600"}`} /></div>
                            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 tabular-nums">{stats[metric.key]}</p>
                            <p className="mt-1 text-xs text-slate-500">{metric.note}</p>
                        </article>
                    ))}
                </div>
            </section>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="surface-panel overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Admissions</p><h2 className="mt-1 text-xl font-black text-slate-950">Recent applications</h2></div><Link href="/admin/applications" className="text-sm font-semibold text-blue-700 hover:underline">View all →</Link></div>
                    {recentApplications.data?.length ? <div className="divide-y divide-slate-100">{recentApplications.data.map(application=><div key={application.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{application.full_name}</p><p className="mt-1 truncate text-xs text-slate-500">{application.programs?.[0]?.title || "Program"} · {application.email}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(application.submitted_at).toLocaleDateString()}</p></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${statusClass(application.status)}`}>{application.status.replaceAll("_", " ")}</span></div>)}</div> : <div className="p-8 text-center"><p className="font-semibold text-slate-700">No applications yet</p><p className="mt-1 text-sm text-slate-500">New submissions will appear here.</p></div>}
                </section>

                <section className="surface-panel overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Program delivery</p><h2 className="mt-1 text-xl font-black text-slate-950">Recent programs</h2></div><Link href="/admin" className="text-xs font-semibold text-slate-500">Manage programs</Link></div>
                    <div className="divide-y divide-slate-100">{programs.data?.length ? programs.data.map(program=><div key={program.id} className="flex items-center justify-between gap-3 p-5"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{program.title}</p><p className="mt-1 text-xs text-slate-500">{program.category}</p></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${statusClass(program.status)}`}>{program.status.replaceAll("_", " ")}</span></div>) : <p className="p-8 text-center text-sm text-slate-500">No programs created yet.</p>}</div>
                </section>
            </div>

            <section className="surface-panel mt-8 p-6 sm:p-8">
                <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Program management</p><h2 className="mt-1 text-2xl font-black text-slate-950">Create a program</h2><p className="mt-2 text-sm text-slate-600">Create a draft or publish an open program for participant applications.</p></div>
                <form action={createProgram} className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2"><label htmlFor="program-title" className="mb-2 block text-sm font-semibold text-slate-700">Program title</label><input id="program-title" name="title" required maxLength={160} className="field-control" placeholder="AI Fundamentals Program" /></div>
                    <div><label htmlFor="program-category" className="mb-2 block text-sm font-semibold text-slate-700">Category</label><input id="program-category" name="category" required className="field-control" placeholder="Artificial Intelligence" /></div>
                    <div><label htmlFor="program-duration" className="mb-2 block text-sm font-semibold text-slate-700">Duration</label><input id="program-duration" name="duration" required className="field-control" placeholder="8 Weeks" /></div>
                    <div><label htmlFor="program-start" className="mb-2 block text-sm font-semibold text-slate-700">Start date</label><input id="program-start" name="startDate" type="date" required className="field-control" /></div>
                    <div><label htmlFor="program-end" className="mb-2 block text-sm font-semibold text-slate-700">End date</label><input id="program-end" name="endDate" type="date" required className="field-control" /></div>
                    <div><label htmlFor="program-deadline" className="mb-2 block text-sm font-semibold text-slate-700">Application deadline</label><input id="program-deadline" name="applicationDeadline" type="date" required className="field-control" /></div>
                    <div><label htmlFor="program-seats" className="mb-2 block text-sm font-semibold text-slate-700">Available seats</label><input id="program-seats" name="availableSeats" type="number" min="1" max="10000" defaultValue={20} required className="field-control" /></div>
                    <div><label htmlFor="program-status" className="mb-2 block text-sm font-semibold text-slate-700">Initial status</label><select id="program-status" name="status" className="field-control"><option value="DRAFT">Draft</option><option value="OPEN">Open for applications</option><option value="CLOSED">Closed</option></select></div>
                    <div><label htmlFor="community-url" className="mb-2 block text-sm font-semibold text-slate-700">Community URL <span className="font-normal text-slate-400">(optional)</span></label><input id="community-url" name="communityUrl" type="url" className="field-control" placeholder="https://community.example.com/program" /></div>
                    <div className="md:col-span-2"><label htmlFor="short-description" className="mb-2 block text-sm font-semibold text-slate-700">Short description</label><textarea id="short-description" name="shortDescription" required rows={2} className="field-control resize-y" placeholder="A concise overview shown on program cards." /></div>
                    <div className="md:col-span-2"><label htmlFor="program-description" className="mb-2 block text-sm font-semibold text-slate-700">Full description</label><textarea id="program-description" name="description" required rows={5} className="field-control resize-y" placeholder="Explain the program, learning experience, and expected outcomes." /></div>
                    <div className="md:col-span-2"><button type="submit" className="min-h-11 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Create program</button></div>
                </form>
            </section>
        </main>
    );
}
