import Link from "next/link";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Create your account | TIKSE TECH",
    description: "Join TIKSE TECH to apply for remote technology programs and track your learning journey."
};

const errors: Record<string, string> = {
    "invalid-details": "Check your name, email address, and password, then try again.",
    "email-rate-limit": "Email verification is temporarily rate-limited. Wait before trying again.",
    "registration-failed": "We could not create your account. Check the details and try again.",
    "profile-setup": "Your sign-in account was created, but profile setup did not finish. Contact support before registering again.",
    "server-configuration": "Registration is temporarily unavailable because the platform is missing a required server configuration."
};

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
    const params = searchParams ? await searchParams : {};
    return (
        <main className="container-shell py-10 sm:py-16">
            <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
                <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0a1628] p-10 text-white lg:flex xl:p-12">
                    <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
                    <div className="relative"><p className="text-sm font-black tracking-wide">TIKSE TECH</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">Technology without borders</p></div>
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Your next step</p>
                        <h1 className="mt-5 text-4xl font-black leading-tight xl:text-5xl">Turn your curiosity into capability.</h1>
                        <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">Create your participant account to explore programs, submit applications, work through challenges, and keep your achievements together.</p>
                        <div className="mt-8 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-200">{["Remote programs","Practical challenges","Mentor guidance","Verified credentials"].map(item=><div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">{item}</div>)}</div>
                    </div>
                    <p className="relative text-xs text-slate-500">Build skills. Gain experience. Connect globally.</p>
                </section>
                <section className="p-6 sm:p-10 xl:p-14">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Join the community</p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Create your account</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Set up your participant profile to apply for programs and manage your progress.</p>
                    {params.error && errors[params.error] ? <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{errors[params.error]}</p> : null}
                    <form action={registerUser} className="mt-7 space-y-5">
                        <div><label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label><input name="fullName" id="fullName" autoComplete="name" required minLength={2} maxLength={160} className="field-control" placeholder="Your full name" /></div>
                        <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label><input name="email" id="email" type="email" autoComplete="email" required className="field-control" placeholder="name@example.com" /></div>
                        <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label><input name="password" id="password" type="password" autoComplete="new-password" required minLength={8} className="field-control" placeholder="At least 8 characters" /><p className="mt-2 text-xs text-slate-500">Use a unique password that you do not use on another website.</p></div>
                        <Button type="submit" className="w-full" variant="primary" size="lg">Create participant account</Button>
                    </form>
                    <p className="mt-7 text-sm text-slate-600">Already have an account? <Link href="/login" className="font-bold text-blue-700 hover:underline">Sign in</Link></p>
                </section>
            </div>
        </main>
    );
}
