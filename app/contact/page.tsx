export const metadata = {
    title: 'Contact | TIKSE TECH',
    description: 'Contact TIKSE TECH for programs, partnerships, or general inquiries.'
};

export default function ContactPage() {
    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Contact</p>
                <h1 className="mt-4 text-4xl font-black text-slate-900">Get in touch</h1>
                <div className="mt-8 space-y-4 text-slate-700">
                    <p>Email: hello@tiksetech.dev</p>
                    <p>Location: Remote — Worldwide</p>
                    <p>General questions, partnerships, and support messages are welcome.</p>
                </div>
            </div>
        </div>
    );
}
