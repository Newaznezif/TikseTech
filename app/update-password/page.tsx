import Link from 'next/link';
import { redirect } from 'next/navigation';
import { updateRecoveredPassword } from '@/actions/auth';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata = { title: 'Choose a new password | TIKSE TECH' };

const errors: Record<string, string> = {
  'weak-password': 'Use a password with at least 8 characters.',
  'password-mismatch': 'The passwords do not match. Enter them again.',
  unavailable: 'Password updates are temporarily unavailable.',
  'update-failed': 'The password could not be updated. Request a fresh recovery link and try again.'
};

export default async function UpdatePasswordPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/forgot-password?error=session-expired');

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-100 px-4 py-14">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-10">
        <Link href="/" className="text-sm font-black tracking-wide text-blue-800">TIKSE TECH</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Secure account recovery</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Set a new password for your TIKSE TECH account. Use at least 8 characters.</p>
        {params.error && errors[params.error] ? <p role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{errors[params.error]}</p> : null}
        <form action={updateRecoveredPassword} className="mt-7 space-y-4">
          <div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">New password</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white" /></div>
          <div><label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white" /></div>
          <button type="submit" className="w-full rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-800">Update password</button>
        </form>
      </section>
    </main>
  );
}
