import Link from 'next/link';

import { loginUser } from '@/actions/auth';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Login | TIKSE TECH',
    description: 'Login to your TIKSE TECH account.'
};

export default function LoginPage() {
    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Welcome back</p>
                <h1 className="mt-4 text-3xl font-black text-slate-900">Login to TIKSE TECH</h1>
                <form action={loginUser} className="mt-8 space-y-5">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                        <input name="email" id="email" type="email" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="name@example.com" />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                        <input name="password" id="password" type="password" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="••••••••" />
                    </div>
                    <Button type="submit" className="w-full" variant="primary">Login</Button>
                </form>
                <p className="mt-6 text-sm text-slate-600">
                    Don&apos;t have an account? <Link href="/register" className="font-semibold text-blue-700">Create one</Link>
                </p>
            </div>
        </div>
    );
}
