import Link from 'next/link';
import { requestPasswordReset } from '@/actions/auth';

export const metadata = { title: 'Reset password | TIKSE TECH' };

const messages: Record<string, string> = {
  'invalid-email': 'Enter a valid email address.',
  unavailable: 'Password recovery is temporarily unavailable. Please contact platform support.',
  'rate-limit': 'Too many requests. Wait a while before requesting another recovery email.',
  'send-failed': 'We could not send the recovery email. Please try again later.',
  'link-invalid': 'That recovery link is invalid, expired, or has already been used. Request a new one below.',
  'session-expired': 'Your recovery session has expired. Request a new password-reset email.'
};

export default async function ForgotPasswordPage({ searchParams }: { searchParams?: Promise<{ error?: string; sent?: string }> }) {
  const params = searchParams ? await searchParams : {};
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-100 px-4 py-14">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-10">
        <Link href="/" className="text-sm font-black tracking-wide text-blue-800">TIKSE TECH</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Account recovery</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Forgot your password?</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Enter the email address associated with your account. We will send a secure, single-use recovery link.</p>
        {params.sent === '1' ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">If an account exists for that address, a recovery email has been sent. Open the newest email and use its link promptly.</p> : null}
        {params.error && messages[params.error] ? <p role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{messages[params.error]}</p> : null}
        <form action={requestPasswordReset} className="mt-7 space-y-4">
          <div><label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label><input id="recovery-email" name="email" type="email" autoComplete="email" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:bg-white" placeholder="name@example.com" /></div>
          <button type="submit" className="w-full rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-800">Send recovery link</button>
        </form>
        <p className="mt-7 text-sm text-slate-600"><Link href="/login" className="font-semibold text-blue-700 hover:underline">Back to sign in</Link></p>
      </section>
    </main>
  );
}
