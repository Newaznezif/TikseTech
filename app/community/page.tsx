export const metadata = {
    title: 'Community | TIKSE TECH',
    description: 'Join the TIKSE TECH community of young tech talent from around the world.'
};

export default function CommunityPage() {
    return (
        <div className="container-shell py-20">
            <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Community</p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Connect with a global network</h1>
                <p className="mt-6 text-lg text-slate-600">TIKSE TECH brings together ambitious learners, mentors, and collaborators from multiple countries and backgrounds.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
                {['Peer learning', 'Mentor engagement', 'Inclusive access'].map((item) => (
                    <div key={item} className="card-surface p-8">
                        <h2 className="text-xl font-bold text-slate-900">{item}</h2>
                        <p className="mt-3 text-slate-600">A supportive environment for technology learning, collaboration, and confidence building across geographies.</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
