import Link from "next/link";
import { saveParticipantAdminAction } from "@/actions/participants";
import { notFound, redirect } from "next/navigation";
import { getSessionUser, hasRequiredRole } from "@/lib/session";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const metadata = { title: "Participant record | TIKSE TECH" };

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function Status({ value }: { value: string }) {
  const positive = ["ACTIVE", "COMPLETED", "ACCEPTED", "ENROLLED"].includes(value);
  const waiting = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "WAITLISTED", "PENDING", "NEEDS_REVISION"].includes(value);
  const style = positive ? "bg-emerald-50 text-emerald-700" : waiting ? "bg-amber-50 text-amber-700" : ["REJECTED", "REVOKED", "DID_NOT_COMPLETE"].includes(value) ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{value.replaceAll("_", " ")}</span>;
}

export default async function ParticipantRecordPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ updated?: string }> }) {
  const query = searchParams ? await searchParams : {};
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!hasRequiredRole(session, ["ADMIN", "SUPER_ADMIN"])) redirect("/dashboard");
  const { id } = await params;
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase server credentials are not configured.");

  const [profileResult, applicationsResult, enrollmentsResult, submissionsResult, certificatesResult, completionsResult] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, country, timezone, short_bio, education, experience, skills, participant_number, account_status, github, linkedin, portfolio, website, created_at").eq("id", id).eq("role", "PARTICIPANT").maybeSingle(),
    admin.from("applications").select("id, program_id, status, submitted_at, motivation").eq("applicant_id", id).order("submitted_at", { ascending: false }),
    admin.from("enrollments").select("id, program_id, status, joined_at, completed_at").eq("participant_id", id).order("joined_at", { ascending: false }),
    admin.from("assignment_submissions").select("id, challenge_id, program_id, status, score, max_score, feedback, submitted_at, original_file_name").eq("applicant_id", id).order("submitted_at", { ascending: false }),
    admin.from("certificates").select("id, program_id, certificate_number, certificate_title, status, issued_at").eq("participant_id", id).order("issued_at", { ascending: false }),
    admin.from("completion_records").select("id, program_id, status, completed_at, notes").eq("participant_id", id).order("completed_at", { ascending: false })
  ]);

  if (!profileResult.data) notFound();
  const firstError = [applicationsResult, enrollmentsResult, submissionsResult, certificatesResult, completionsResult].find((result) => result.error);
  if (firstError?.error) throw new Error("Participant record could not be loaded: " + firstError.error.message);

  const applications = applicationsResult.data || [];
  const enrollments = enrollmentsResult.data || [];
  const submissions = submissionsResult.data || [];
  const certificates = certificatesResult.data || [];
  const completions = completionsResult.data || [];
  const programIds = [...new Set([...applications, ...enrollments, ...submissions, ...certificates, ...completions].map((item) => item.program_id))];
  const challengeIds = [...new Set(submissions.map((item) => item.challenge_id))];
  const [programsResult, challengesResult] = await Promise.all([
    programIds.length ? admin.from("programs").select("id, title").in("id", programIds) : Promise.resolve({ data: [], error: null }),
    challengeIds.length ? admin.from("challenge_documents").select("id, title").in("id", challengeIds) : Promise.resolve({ data: [], error: null })
  ]);
  if (programsResult.error || challengesResult.error) throw new Error("Program or challenge details could not be loaded.");
  const programNames = new Map((programsResult.data || []).map((item) => [item.id, item.title]));
  const challengeNames = new Map((challengesResult.data || []).map((item) => [item.id, item.title]));
  const person = profileResult.data;

  return (
    <main className="container-shell py-10">
      <Link href="/admin/participants" className="text-sm font-semibold text-blue-700 hover:text-blue-900">← Back to participants</Link>
      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Participant record</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{person.full_name}</h1>
            <p className="mt-1 text-slate-600">{person.email}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-700">ID: {person.participant_number || "Not assigned"} · Account: {person.account_status || "ACTIVE"}</p>
            <p className="mt-2 text-sm text-slate-500">{person.country || "Country not provided"} · Joined {formatDate(person.created_at)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Manager view</p>
            <p className="mt-1">Profile ID: <span className="font-mono text-xs">{person.id}</span></p>
          </div>
        </div>
        {person.short_bio ? <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-700">{person.short_bio}</p> : null}
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs uppercase tracking-wide text-slate-400">Applications</p><p className="mt-1 text-2xl font-bold">{applications.length}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-400">Enrollments</p><p className="mt-1 text-2xl font-bold">{enrollments.length}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-400">Assignments</p><p className="mt-1 text-2xl font-bold">{submissions.length}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-400">Certificates</p><p className="mt-1 text-2xl font-bold">{certificates.filter((item) => item.status === "ACTIVE").length}</p></div>
        </div>
      </section>

      {query.updated === "1" ? <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Participant account and ID updated.</p> : null}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Account administration</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Manage participant profile and ID</h2>
          <p className="mt-1 text-sm text-slate-500">Update the participant record, official participant number, skills, and account access status.</p>
        </div>
        <form action={saveParticipantAdminAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="participantId" value={person.id}/>
          <label className="text-sm font-semibold text-slate-700">Full name<input name="fullName" defaultValue={person.full_name} required minLength={2} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-semibold text-slate-700">Official participant ID<input name="participantNumber" defaultValue={person.participant_number || ""} required pattern="TT-P-[A-Za-z0-9-]{4,32}" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono font-normal"/></label>
          <label className="text-sm font-semibold text-slate-700">Country<input name="country" defaultValue={person.country || ""} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-semibold text-slate-700">Timezone<input name="timezone" defaultValue={person.timezone || ""} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"/></label>
          <label className="text-sm font-semibold text-slate-700">Education level
            <select name="education" defaultValue={person.education || ""} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option value="">Not provided</option>
              {["High School","TVET / Technical Certificate","Certificate","Diploma","Bachelor’s Degree","Master’s Degree","Doctorate (PhD)","Other / Self-taught"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Years of experience
            <select name="experience" defaultValue={person.experience || ""} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option value="">Not provided</option>
              {["No formal experience yet","Less than 1 year","1–2 years","3–5 years","6–10 years","More than 10 years"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Account access
            <select name="accountStatus" defaultValue={person.account_status || "ACTIVE"} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
              <option value="ACTIVE">Active — can sign in</option>
              <option value="SUSPENDED">Suspended — sign-in blocked</option>
            </select>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-semibold text-slate-700">Skills</legend>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              {["Programming","Web Development","Mobile Development","Cybersecurity","Networking","Artificial Intelligence","Data Analysis","Cloud Computing","DevOps","UI/UX Design","Graphic Design","Project Management","Research","Communication","Digital Marketing"].map(skill=><label key={skill} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="skills" value={skill} defaultChecked={Array.isArray(person.skills) && person.skills.includes(skill)} className="h-4 w-4"/> {skill}</label>)}
            </div>
          </fieldset>
          <div className="sm:col-span-2"><button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Save participant changes</button></div>
        </form>
      </section>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Applications</h2>
          <div className="mt-4 space-y-3">
            {applications.map((item) => <article key={item.id} className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{programNames.get(item.program_id) || "Program"}</p><Status value={item.status} /></div><p className="mt-1 text-xs text-slate-500">Submitted {formatDate(item.submitted_at)}</p></article>)}
            {!applications.length ? <p className="text-sm text-slate-500">No applications recorded.</p> : null}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Training and completion</h2>
          <div className="mt-4 space-y-3">
            {enrollments.map((item) => <article key={item.id} className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{programNames.get(item.program_id) || "Program"}</p><Status value={item.status} /></div><p className="mt-1 text-xs text-slate-500">Joined {formatDate(item.joined_at)} · Completed {formatDate(item.completed_at)}</p></article>)}
            {completions.map((item) => <article key={item.id} className="rounded-xl border border-dashed border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{programNames.get(item.program_id) || "Program"} · Completion record</p><Status value={item.status} /></div><p className="mt-1 text-xs text-slate-500">{formatDate(item.completed_at)}{item.notes ? " · " + item.notes : ""}</p></article>)}
            {!enrollments.length && !completions.length ? <p className="text-sm text-slate-500">No training records yet.</p> : null}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Assignments</h2>
          <div className="mt-4 space-y-3">
            {submissions.map((item) => <article key={item.id} className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{challengeNames.get(item.challenge_id) || item.original_file_name}</p><Status value={item.status} /></div><p className="mt-1 text-xs text-slate-500">{programNames.get(item.program_id) || "Program"} · Submitted {formatDate(item.submitted_at)} · Score {item.score ?? "—"}/{item.max_score}</p>{item.feedback ? <p className="mt-2 text-sm text-slate-700">{item.feedback}</p> : null}</article>)}
            {!submissions.length ? <p className="text-sm text-slate-500">No assignments submitted.</p> : null}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Certificates</h2>
          <div className="mt-4 space-y-3">
            {certificates.map((item) => <article key={item.id} className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{item.certificate_title}</p><Status value={item.status} /></div><p className="mt-1 text-xs text-slate-500">{programNames.get(item.program_id) || "Program"} · {item.certificate_number} · Issued {formatDate(item.issued_at)}</p></article>)}
            {!certificates.length ? <p className="text-sm text-slate-500">No certificates issued.</p> : null}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-950">Profile details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-slate-400">Timezone</dt><dd className="mt-1 font-medium">{person.timezone || "—"}</dd></div>
          <div><dt className="text-slate-400">Education</dt><dd className="mt-1 font-medium">{person.education || "—"}</dd></div>
          <div><dt className="text-slate-400">Experience</dt><dd className="mt-1 font-medium">{person.experience || "—"}</dd></div>
          <div><dt className="text-slate-400">GitHub</dt><dd className="mt-1 break-all font-medium">{person.github || "—"}</dd></div>
          <div><dt className="text-slate-400">LinkedIn</dt><dd className="mt-1 break-all font-medium">{person.linkedin || "—"}</dd></div>
          <div><dt className="text-slate-400">Portfolio</dt><dd className="mt-1 break-all font-medium">{person.portfolio || person.website || "—"}</dd></div>
        </dl>
      </section>
    </main>
  );
}
