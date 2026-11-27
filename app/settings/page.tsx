import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutUser } from "@/actions/auth";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Settings | TIKSE TECH" };

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/settings");

  return <main className="container-shell py-12">
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Account</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">Settings</h1>
      <p className="mt-2 text-slate-600">Manage your account access and review your security information.</p>
      <div className="mt-8 space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Account information</h2>
          <p className="mt-2 text-sm text-slate-600">Signed in as <strong>{session.email}</strong>.</p>
          <Link href="/profile" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline">View profile →</Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Security</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your sign-in is managed by the platform authentication service. Never share your password or verification links. Password changes and multi-factor authentication controls are not yet available in this settings page.</p>
        </section>
        <section className="rounded-2xl border border-rose-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Sign out</h2>
          <p className="mt-2 text-sm text-slate-600">End your current TIKSE TECH session on this browser.</p>
          <form action={logoutUser} className="mt-4"><button className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700" type="submit">Sign out</button></form>
        </section>
      </div>
    </div>
  </main>;
}
