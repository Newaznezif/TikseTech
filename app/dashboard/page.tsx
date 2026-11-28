import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpenCheck, ClipboardList, Compass, Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured, shouldUseLocalStore } from "@/lib/supabase";

export const metadata = { title: "Participant dashboard | TIKSE TECH" };

function statusStyle(status: string) {
    if (["ACTIVE", "COMPLETED", "ACCEPTED"].includes(status)) return "bg-emerald-50 text-emerald-700";
    if (["SUBMITTED", "UNDER_REVIEW", "ENROLLED"].includes(status)) return "bg-blue-50 text-blue-700";
    if (["REJECTED", "DID_NOT_COMPLETE"].includes(status)) return "bg-rose-50 text-rose-700";
    return "bg-slate-100 text-slate-600";
}

export default async function DashboardPage() {
    const session = await getSessionUser();
    if (!session) redirect("/login");

    let applications: any[] = [];
    let enrollments: any[] = [];
    let certificates: any[] = [];
    let submissions: any[] = [];
    let announcements: any[] = [];
    let participantNumber = "";

    if (isSupabaseConfigured() && !shouldUseLocalStore()) {
        const supabase = await createSupabaseServerClient();
        const [a, e, c, s, p, n] = await Promise.all([
            supabase.from("applications").select("id,status,submitted_at,programs(title,slug)").eq("applicant_id", session.profileId).order("submitted_at", { ascending: false }),
            supabase.from("enrollments").select("id,status,joined_at,programs(title,slug)").eq("participant_id", session.profileId).order("joined_at", { ascending: false }),
            supabase.from("certificates").select("id,certificate_title,verification_code,issued_at,status").eq("participant_id", session.profileId).eq("status", "ACTIVE").order("issued_at", { ascending: false }),
            supabase.from("assignment_submissions").select("id,status,score,max_score,submitted_at").eq("applicant_id", session.profileId).order("submitted_at", { ascending: false }),
            supabase.from("profiles").select("participant_number").eq("id", session.profileId).maybeSingle(),
            supabase.from("announcements").select("id,title,message,created_at").order("created_at", { ascending: false }).limit(4)
        ]);
        if (a.error || e.error || c.error || s.error || p.error || n.error) throw new Error("Your dashboard data could not be loaded. Please refresh or contact support.");
        applications = a.data || [];
        enrollments = e.data || [];
        certificates = c.data || [];
        submissions = s.data || [];
        participantNumber = p.data?.participant_number || "";
        announcements = n.data || [];
    }

    const activeEnrollments = enrollments.filter(item => ["ENROLLED", "ACTIVE"].includes(item.status)).length;
    const acceptedApplications = applications.filter(item => item.status === "ACCEPTED").length;
    const stats = [
        { label: "Applications", value: applications.length, detail: "Submitted to programs", icon: ClipboardList },
        { label: "Accepted", value: acceptedApplications, detail: "Approved applications", icon: Sparkles },
        { label: "Active programs", value: activeEnrollments, detail: "Current enrollments", icon: BookOpenCheck },
        { label: "Certificates", value: certificates.length, detail: "Active credentials", icon: Award }
    ];

    return (
        <main className="container-shell py-8 sm:py-10">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0a1628] p-6 text-white shadow-xl sm:p-8 lg:p-10">
                <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Participant workspace</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Welcome back, {session.name}.</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Your applications, learning activity, submissions, and verified credentials—together in one workspace.</p>
                        {participantNumber ? <p className="mt-5 inline-flex rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs font-bold text-cyan-100">Participant ID · {participantNumber}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/programs" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"><Compass className="h-4 w-4" aria-hidden="true" /> Explore programs</Link>
                        <Link href="/dashboard/assignments" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">My assignments</Link>
                    </div>
                </div>
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map(({label,value,detail,icon:Icon})=><article key={label} className="surface-panel p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-600">{label}</p><span className="rounded-xl bg-blue-50 p-2 text-blue-700"><Icon className="h-4 w-4" aria-hidden="true" /></span></div><p className="mt-3 text-3xl font-black tracking-tight text-slate-950 tabular-nums">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></article>)}
            </section>

            <div className="mt-7 grid gap-6 xl:grid-cols-2">
                <section className="surface-panel overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Admissions</p><h2 className="mt-1 text-xl font-black text-slate-950">My applications</h2></div><Link href="/programs" className="text-sm font-semibold text-blue-700 hover:underline">Explore programs →</Link></div>
                    {applications.length ? <div className="divide-y divide-slate-100">{applications.slice(0,5).map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{item.programs?.[0]?.title || "Program application"}</p><p className="mt-1 text-xs text-slate-500">Submitted {new Date(item.submitted_at).toLocaleDateString()}</p></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${statusStyle(item.status)}`}>{item.status.replaceAll("_"," ")}</span></div>)}</div> : <div className="p-8 text-center"><p className="font-semibold text-slate-700">Your next opportunity starts here</p><p className="mt-1 text-sm text-slate-500">You have not applied to a program yet.</p><Link href="/programs" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Browse programs</Link></div>}
                </section>

                <section className="surface-panel overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Learning progress</p><h2 className="mt-1 text-xl font-black text-slate-950">Assignment activity</h2></div><Link href="/dashboard/assignments" className="text-sm font-semibold text-blue-700 hover:underline">Open workspace →</Link></div>
                    {submissions.length ? <div className="divide-y divide-slate-100">{submissions.slice(0,5).map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="text-sm font-bold text-slate-900">Assignment submission</p><p className="mt-1 text-xs text-slate-500">{new Date(item.submitted_at).toLocaleDateString()}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{item.score === null ? "Not scored" : `${item.score} / ${item.max_score}`}</p><span className={`text-[11px] font-bold ${statusStyle(item.status)} rounded-full px-2.5 py-1`}>{item.status.replaceAll("_"," ")}</span></div></div>)}</div> : <div className="p-8 text-center"><p className="font-semibold text-slate-700">No submissions recorded</p><p className="mt-1 text-sm text-slate-500">Published challenges and your submission history appear here.</p><Link href="/dashboard/assignments" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline">View challenges →</Link></div>}
                </section>
            </div>

            <section className="surface-panel mt-6 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Platform updates</p><h2 className="mt-1 text-xl font-black text-slate-950">Latest announcements</h2></div><span className="text-xs font-semibold text-slate-500">Official updates</span></div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">{announcements.length ? announcements.map(item=><article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-slate-900">{item.title}</h3><time className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.message}</p></article>) : <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 md:col-span-2">There are no new platform announcements.</p>}</div>
            </section>

            <section className="surface-panel mt-6 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Credentials</p><h2 className="mt-1 text-xl font-black text-slate-950">My certificates</h2></div><span className="text-xs text-slate-500">{certificates.length} active</span></div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">{certificates.length ? certificates.map(item=><article key={item.id} className="rounded-xl border border-slate-100 p-4"><p className="font-bold text-slate-900">{item.certificate_title}</p><p className="mt-1 text-xs text-slate-500">Issued {new Date(item.issued_at).toLocaleDateString()}</p><div className="mt-3 flex flex-wrap gap-4"><Link href={`/certificates/verify/${item.verification_code}`} className="text-sm font-semibold text-blue-700 underline underline-offset-4">Verify certificate</Link><Link href={`/certificates/download/${item.verification_code}`} className="text-sm font-semibold text-blue-700 underline underline-offset-4">Download PDF</Link></div></article>) : <p className="text-sm text-slate-500 md:col-span-2">Certificates appear here after you complete the required program work and an administrator issues your credential.</p>}</div>
            </section>
        </main>
    );
}
