import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "My Profile | TIKSE TECH" };

export default async function ProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/profile");

  const initials = session.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return <main className="container-shell py-12">
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Account</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">My Profile</h1>
      <p className="mt-2 text-slate-600">Your identity and account information on TIKSE TECH.</p>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-lg font-black text-blue-800">{initials}</div>
          <div><h2 className="text-lg font-bold text-slate-950">{session.name}</h2><p className="text-sm text-slate-500">{session.role.replaceAll("_", " ")}</p></div>
        </div>
        <dl className="grid gap-5 pt-6 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full name</dt><dd className="mt-1 font-medium text-slate-900">{session.name}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email address</dt><dd className="mt-1 break-all font-medium text-slate-900">{session.email}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account role</dt><dd className="mt-1 font-medium text-slate-900">{session.role.replaceAll("_", " ")}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile reference</dt><dd className="mt-1 break-all font-mono text-sm text-slate-700">{session.profileId}</dd></div>
        </dl>
        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Profile editing will be available when the profile-update workflow is implemented.</p>
      </section>
    </div>
  </main>;
}
