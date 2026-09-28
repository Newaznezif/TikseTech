export const metadata = {
    title: 'Opportunities | TIKSE TECH',
    description: 'Discover global learning opportunities, internships, and practical technology experiences.'
};

export default function OpportunitiesPage() {
    return (
        <div className="container-shell py-20">
            <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Opportunities</p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Remote, practical, and global</h1>
                <p className="mt-6 text-lg text-slate-600">TIKSE TECH helps young technology talent connect with remote programs, internships, mentor guidance, and hands-on practice that build confidence and capability.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
                {['Internships', 'Project-based learning', 'Mentorship and community'].map((item) => (
                    <div key={item} className="card-surface p-8">
                        <h2 className="text-xl font-bold text-slate-900">{item}</h2>
                        <p className="mt-3 text-slate-600">Opportunities are designed to help participants build skills while contributing to meaningful technological work.</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
