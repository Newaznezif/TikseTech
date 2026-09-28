export const metadata = {
    title: 'About | TIKSE TECH',
    description: 'Learn about TIKSE TECH and our mission to connect young talent to remote technology opportunities.'
};

export default function AboutPage() {
    return (
        <div className="container-shell py-20">
            <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">About TIKSE TECH</p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Connecting young tech talent, anywhere in the world.</h1>
                <p className="mt-6 text-lg text-slate-600">
                    TIKSE TECH is a global technology platform that connects young people with remote learning programs, internships, mentors, practical projects, and opportunities to grow in technology careers.
                </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
                {[
                    ['Remote-first', 'Programs are designed to work from anywhere in the world.'],
                    ['Practical learning', 'Participants gain experience through guided projects and structured learning paths.'],
                    ['Global community', 'Talent from many regions connects, learns, and grows together.']
                ].map(([title, text]) => (
                    <div key={title} className="card-surface p-8">
                        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                        <p className="mt-3 text-slate-600">{text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
