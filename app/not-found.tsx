import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">404</p>
                <h1 className="mt-4 text-4xl font-black text-slate-900">Page not found</h1>
                <p className="mt-4 text-slate-600">The page you are looking for does not exist or has moved.</p>
                <Link href="/" className="mt-8 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">
                    Back to home
                </Link>
            </div>
        </div>
    );
}
