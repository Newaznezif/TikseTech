import Link from "next/link";
import { redirect } from "next/navigation";
import { changePassword, logoutUser } from "@/actions/auth";
import { getSessionUser } from "@/lib/session";

export const metadata = { title: "Settings | TIKSE TECH" };

const errors: Record<string, string> = {
  "current-password-required": "Enter your current password to continue.",
  "current-password": "The current password is incorrect.",
  "weak-password": "Your new password must contain at least 8 characters.",
  "password-mismatch": "The new passwords do not match.",
  "password-unchanged": "Choose a password different from your current one.",
  "update-failed": "The password could not be changed. Try again or use account recovery."
};

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ error?: string; "password-updated"?: string }> }) {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/settings");
  const params = searchParams ? await searchParams : {};

  return <main className="container-shell py-10 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Account & security</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Settings</h1>
      <p className="mt-2 text-slate-600">Manage your account access and keep your sign-in credentials current.</p>
      {params["password-updated"] === "1" ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Your password was updated successfully.</p> : null}
      {params.error && errors[params.error] ? <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{errors[params.error]}</p> : null}
      <div className="mt-8 space-y-5">
        <section className="surface-panel p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">Account information</h2><p className="mt-2 text-sm text-slate-600">Signed in as <strong>{session.email}</strong>.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Session active</span></div>
          <Link href="/profile" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline">Manage your profile →</Link>
        </section>
        <section className="surface-panel p-6 sm:p-7">
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Authentication</p><h2 className="mt-1 text-xl font-black text-slate-950">Change password</h2><p className="mt-2 text-sm leading-6 text-slate-600">Confirm your current password before choosing a new one. Use at least 8 characters.</p></div>
          <form action={changePassword} className="space-y-4">
            <div><label htmlFor="current-password" className="mb-2 block text-sm font-semibold text-slate-700">Current password</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required className="field-control" /></div>
            <div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field-control" /></div>
            <div><label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required className="field-control" /></div>
            <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto">Update password</button>
          </form>
          <p className="mt-4 text-xs leading-5 text-slate-500">If you cannot sign in, use the <Link href="/forgot-password" className="font-semibold text-blue-700 underline">password recovery page</Link> instead.</p>
        </section>
        <section className="rounded-2xl border border-rose-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Sign out</h2><p className="mt-2 text-sm text-slate-600">End your current TIKSE TECH session on this browser.</p>
          <form action={logoutUser} className="mt-4"><button className="min-h-11 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700" type="submit">Sign out</button></form>
        </section>
      </div>
    </div>
  </main>;
}
