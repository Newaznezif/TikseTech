import Link from 'next/link';

export function SiteFooter() {
    return (
        <footer className="border-t border-slate-200 bg-slate-900 text-slate-200">
            <div className="container-shell grid gap-10 py-12 lg:grid-cols-4">
                <div>
                    <p className="text-xl font-black tracking-tight text-white">TIKSE TECH</p>
                    <p className="mt-4 text-sm text-slate-300">Technology. Talent. Opportunity. Without Borders.</p>
                </div>
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Platform</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        <li><Link href="/programs">Programs</Link></li>
                        <li><Link href="/about">About</Link></li>
                        <li><Link href="/community">Community</Link></li>
                    </ul>
                </div>
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Support</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        <li><Link href="/contact">Contact</Link></li>
                        <li><Link href="/certificates/verify">Certificate Verification</Link></li>
                        <li><Link href="/login">Login</Link></li>
                    </ul>
                </div>
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Global</p>
                    <p className="mt-4 text-sm text-slate-300">Remote learning, international mentorship, and a global technology community built for talent everywhere.</p>
                </div>
            </div>
            <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-400">
                © 2026 TIKSE TECH. Built for global remote learning.
            </div>
        </footer>
    );
}
