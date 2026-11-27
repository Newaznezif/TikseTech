import { redirect } from "next/navigation";
import { getSessionUser, hasRequiredRole } from "@/lib/session";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { ParticipantsTable } from "@/components/admin/participants-table";

export const metadata = { title: "Participant monitoring | TIKSE TECH" };

export default async function AdminParticipantsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!hasRequiredRole(session, ["ADMIN", "SUPER_ADMIN"])) redirect("/dashboard");

  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Supabase server credentials are not configured.");

  const [profilesResult, applicationsResult, enrollmentsResult, submissionsResult, certificatesResult, completionsResult, programsResult] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, country, role, participant_number, account_status, created_at").eq("role", "PARTICIPANT").order("created_at", { ascending: false }),
    admin.from("applications").select("applicant_id, program_id, status, submitted_at"),
    admin.from("enrollments").select("participant_id, program_id, status, joined_at"),
    admin.from("assignment_submissions").select("applicant_id, status"),
    admin.from("certificates").select("participant_id, status"),
    admin.from("completion_records").select("participant_id, status"),
    admin.from("programs").select("id, title")
  ]);

  const firstError = [profilesResult, applicationsResult, enrollmentsResult, submissionsResult, certificatesResult, completionsResult, programsResult].find((result) => result.error);
  if (firstError?.error) throw new Error("Participant records could not be loaded: " + firstError.error.message);

  const profiles = profilesResult.data || [];
  const applications = applicationsResult.data || [];
  const enrollments = enrollmentsResult.data || [];
  const submissions = submissionsResult.data || [];
  const certificates = certificatesResult.data || [];
  const completions = completionsResult.data || [];
  const programNames = new Map((programsResult.data || []).map((program) => [program.id, program.title]));

  const participants = profiles.map((profile) => {
    const personApplications = applications.filter((item) => item.applicant_id === profile.id);
    const personEnrollments = enrollments.filter((item) => item.participant_id === profile.id);
    const personSubmissions = submissions.filter((item) => item.applicant_id === profile.id);
    const personCertificates = certificates.filter((item) => item.participant_id === profile.id && item.status === "ACTIVE");
    const personCompletions = completions.filter((item) => item.participant_id === profile.id);
    const enrollmentStatuses = personEnrollments.map((item) => item.status);
    const completionStatus = personCompletions.some((item) => item.status === "COMPLETED") ? "COMPLETED" : "";
    const overallStatus = enrollmentStatuses.includes("ACTIVE") ? "ACTIVE"
      : enrollmentStatuses.includes("COMPLETED") || completionStatus === "COMPLETED" ? "COMPLETED"
      : enrollmentStatuses.includes("ENROLLED") ? "ENROLLED"
      : personApplications.some((item) => ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "WAITLISTED"].includes(item.status)) ? "APPLICATION_PENDING"
      : personApplications.some((item) => item.status === "ACCEPTED") ? "ACCEPTED"
      : "REGISTERED";

    return {
      id: profile.id,
      name: profile.full_name || "",
      email: profile.email || "",
      country: profile.country || "",
      participantNumber: profile.participant_number || "",
      accountStatus: profile.account_status || "ACTIVE",
      joinedAt: profile.created_at || "",
      programs: [...new Set([...personApplications, ...personEnrollments].map((item) => programNames.get(item.program_id)).filter((name): name is string => Boolean(name)))],
      applicationStatuses: personApplications.map((item) => item.status),
      enrollmentStatuses,
      assignmentsTotal: personSubmissions.length,
      assignmentsAccepted: personSubmissions.filter((item) => item.status === "ACCEPTED").length,
      certificates: personCertificates.length,
      completionStatus,
      overallStatus
    };
  });

  const enrolled = participants.filter((person) => person.enrollmentStatuses.length > 0).length;
  const active = participants.filter((person) => person.enrollmentStatuses.includes("ACTIVE")).length;
  const completed = participants.filter((person) => person.enrollmentStatuses.includes("COMPLETED") || person.completionStatus === "COMPLETED").length;
  const pending = participants.filter((person) => person.overallStatus === "APPLICATION_PENDING").length;
  const registered = participants.filter((person) => person.overallStatus === "REGISTERED").length;

  const metrics = [
    { label: "Total participants", value: participants.length, detail: "Participant accounts" },
    { label: "Enrolled", value: enrolled, detail: "At least one enrollment" },
    { label: "Active trainees", value: active, detail: "Currently active" },
    { label: "Completed", value: completed, detail: "Completed training" },
    { label: "Pending applications", value: pending, detail: "Awaiting admission decision" },
    { label: "Registered only", value: registered, detail: "No application or enrollment" }
  ];

  return (
    <main className="container-shell py-12">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">TIKSE TECH · Manager workspace</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Participant overview</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Monitor every trainee’s application, enrollment, assignment progress, and certificate status from one place.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Signed in as <strong className="text-slate-900">{session.name}</strong>
          <span className="mx-2 text-slate-300">·</span>{session.role}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-400">{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">All participants</h2>
          <p className="mt-1 text-sm text-slate-500">Search by name, email, country, or program. Filter by training status.</p>
        </div>
        <a href="/admin" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to admin overview</a>
      </div>
      <ParticipantsTable participants={participants} />
    </main>
  );
}
