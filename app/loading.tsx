export default function Loading() {
    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                <p className="mt-4 text-slate-700">Loading TIKSE TECH content...</p>
            </div>
        </div>
    );
}
