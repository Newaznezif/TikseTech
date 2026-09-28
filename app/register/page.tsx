import Link from 'next/link';

import { registerUser } from '@/actions/auth';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Register | TIKSE TECH',
    description: 'Create your account to join TIKSE TECH.'
};

export default function RegisterPage() {
    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Start your journey</p>
                <h1 className="mt-4 text-3xl font-black text-slate-900">Create your TIKSE TECH account</h1>
                <form action={registerUser} className="mt-8 grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                        <input name="fullName" id="fullName" required minLength={2} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="Jane Doe" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                        <input name="email" id="email" type="email" required className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="name@example.com" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                        <input name="password" id="password" type="password" required minLength={8} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="Minimum 8 characters" />
                    </div>
                    <div className="md:col-span-2">
                        <Button type="submit" className="w-full" variant="primary">Create account</Button>
                    </div>
                </form>
                <p className="mt-6 text-sm text-slate-600">
                    Already have an account? <Link href="/login" className="font-semibold text-blue-700">Login</Link>
                </p>
            </div>
        </div>
    );
}
