import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginUser, logoutUser } from "@/actions/auth";
import { getSessionUser, hasRequiredRole } from "@/lib/session";

export const metadata = {
  title: "Manager Sign In | TIKSE TECH",
  description: "Secure administrator access to the TIKSE TECH operations workspace."
};

const errors: Record<string, string> = {
  "invalid-credentials": "The email address or password is incorrect.",
  "rate-limit": "Too many authentication requests. Wait before trying again; repeated attempts can extend the temporary limit.",
  "verify-email": "Verify your email address before signing in.",
  "profile-not-ready": "Your account profile could not be loaded. Contact the platform owner.",
  "server-configuration": "Administrator sign-in is temporarily unavailable. Contact technical support.",
  "not-admin": "This account is registered as a participant. Manager access is restricted to approved ADMIN and SUPER_ADMIN accounts."
};

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const session = await getSessionUser();
  if (hasRequiredRole(session, ["ADMIN", "SUPER_ADMIN"])) redirect("/admin");

  return (
    <main className="min-h-[calc(100vh-2rem)] bg-[#07111f] text-white">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1440px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 px-12 py-14 lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
          <Link href="/" className="relative flex items-center gap-3">
            <Image src="/logo.png" alt="TIKSE TECH" width={48} height={48} className="h-12 w-12 rounded-xl bg-white p-1 object-contain" />
            <div><p className="text-lg font-black tracking-tight">TIKSE TECH</p><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Operations portal</p></div>
          </Link>
          <div className="relative max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Restricted access · Manager workspace</p>
            <h1 className="mt-6 text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">Lead the work.<br/><span className="text-cyan-300">Protect the standard.</span></h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-slate-300">A dedicated control center for platform administrators to manage programs, review applications, monitor participants, and issue credentials.</p>
            <div className="mt-12 grid grid-cols-2 gap-3">
              {["Program operations","Applicant decisions","Participant oversight","Credential issuance"].map((item)=><div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200"><span className="mr-2 text-cyan-300">/</span>{item}</div>)}
            </div>
          </div>
          <p className="relative text-xs text-slate-500">TIKSE TECH · Authorized personnel only · All access is role-verified</p>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
              <Image src="/logo.png" alt="TIKSE TECH" width={42} height={42} className="h-10 w-10 rounded-lg bg-white p-1 object-contain"/>
              <div><p className="font-black">TIKSE TECH</p><p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">Manager access</p></div>
            </Link>
            <div className="mb-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300"/> Secure administrator sign-in</div>
              <h2 className="text-3xl font-black tracking-tight">Manager sign in</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Use your approved administrator account. Participant accounts cannot access this portal.</p>
            </div>

            {params.error && errors[params.error] ? <div role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">{errors[params.error]}</div> : null}

            {session ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
                <p className="font-semibold text-amber-100">A participant account is already signed in.</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{session.email} does not have manager permissions. Sign out before using a different administrator account.</p>
                <form action={logoutUser} className="mt-5"><button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-100">Sign out and switch account</button></form>
                <Link href="/dashboard" className="mt-4 block text-center text-sm font-semibold text-cyan-200 hover:text-white">Return to participant dashboard</Link>
              </div>
            ) : (
              <form action={loginUser} className="space-y-5">
                <input type="hidden" name="portal" value="admin"/>
                <div><label htmlFor="admin-email" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-300">Administrator email</label><input id="admin-email" name="email" type="email" autoComplete="username" required placeholder="Enter your approved administrator email" className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/10"/></div>
                <div><label htmlFor="admin-password" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-300">Password</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/10"/></div>
                <div className="-mt-2 text-right"><Link href="/forgot-password" className="text-sm font-semibold text-cyan-200 hover:text-white">Forgot password?</Link></div>
                <button type="submit" className="w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Access manager workspace <span aria-hidden="true">→</span></button>
              </form>
            )}

            <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs leading-6 text-slate-500">
              <p>Not an administrator? <Link href="/login" className="font-semibold text-cyan-200 hover:text-white">Participant sign in</Link></p>
              <p className="mt-2">Access attempts are subject to platform authorization checks.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
