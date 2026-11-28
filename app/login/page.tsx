import Image from 'next/image';
import Link from 'next/link';
import { loginUser } from '@/actions/auth';

export const metadata = { title: 'Participant Login | TIKSE TECH', description: 'Sign in to your TIKSE TECH participant account.' };

const loginMessages: Record<string, string> = {
    'verify-email': 'Your email address is not verified yet. Open the verification email sent by TIKSE TECH and complete verification on the TIKSE TECH website, then sign in again.',
    'verification-failed': 'The verification link could not be completed or has expired. Request a new verification email and try again.',
    'invalid-credentials': 'The email or password is incorrect. Check your details and try again.',
    'profile-not-ready': 'Your account exists, but its participant profile is not ready. Contact platform support.',
    'server-configuration': 'Sign-in is temporarily unavailable because the platform authentication service is not configured correctly.',
    'account-suspended': 'This participant account is currently suspended. Contact TIKSE TECH support if you believe this is an error.',
};

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ registered?: string; error?: string; "password-updated"?: string }> }) {
    const params = searchParams ? await searchParams : {};
    const message = params.error ? loginMessages[params.error] : undefined;
    return (
      <main className="min-h-[calc(100vh-5rem)] bg-slate-100 px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-10 text-white lg:flex xl:p-12">
            <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"/>
            <Link href="/" className="relative flex items-center gap-3"><Image src="/logo.png" alt="TIKSE TECH" width={46} height={46} className="h-11 w-11 rounded-xl bg-white p-1 object-contain"/><span className="text-lg font-black">TIKSE TECH</span></Link>
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">Participant workspace</p>
              <h1 className="mt-5 text-4xl font-black leading-tight xl:text-5xl">Your next chapter in technology starts here.</h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">Access your applications, learning programs, assignments, progress, and certificates from one place.</p>
              <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-slate-200"><span className="rounded-full border border-white/15 px-3 py-2">Learn</span><span className="rounded-full border border-white/15 px-3 py-2">Build</span><span className="rounded-full border border-white/15 px-3 py-2">Connect</span><span className="rounded-full border border-white/15 px-3 py-2">Grow</span></div>
            </div>
            <p className="relative text-xs text-slate-400">Build skills. Gain experience. Connect globally.</p>
          </section>
          <section className="flex items-center justify-center p-7 sm:p-10 xl:p-14">
            <div className="w-full max-w-md">
              <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden"><Image src="/logo.png" alt="TIKSE TECH" width={40} height={40} className="h-10 w-10 rounded-lg object-contain"/><span className="font-black text-slate-900">TIKSE TECH</span></Link>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Welcome back</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Sign in to your account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Continue your learning and track your opportunities.</p>
              {params["password-updated"] === '1' ? <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Your password has been updated. Sign in with your new password.</p> : null}
              {params.registered === '1' ? <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Your account has been created. Check your email for the verification link, then sign in.</p> : null}
              {message ? <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{message}</p> : null}
              <form action={loginUser} className="mt-8 space-y-5">
                <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label><input name="email" id="email" type="email" autoComplete="email" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10" placeholder="name@example.com"/></div>
                <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label><input name="password" id="password" type="password" autoComplete="current-password" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10" placeholder="Enter your password"/></div>
                <div className="-mt-2 text-right"><Link href="/forgot-password" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Forgot password?</Link></div>
                <button type="submit" className="w-full rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800">Sign in <span aria-hidden="true">→</span></button>
              </form>
              <p className="mt-7 text-sm text-slate-600">New to TIKSE TECH? <Link href="/register" className="font-bold text-blue-700 hover:text-blue-900">Create a participant account</Link></p>
              <div className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">Administrator? <Link href="/admin/login" className="font-semibold text-slate-800 underline underline-offset-4">Use the manager sign-in portal</Link></div>
            </div>
          </section>
        </div>
      </main>
    );
}
