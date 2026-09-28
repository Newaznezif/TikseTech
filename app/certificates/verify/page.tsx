export const metadata = {
    title: 'Verify a Certificate | TIKSE TECH',
    description: 'Verify an active TIKSE TECH certificate using its verification code.'
};

export default function VerifyCertificatePage() {
    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Certificate verification</p>
                <h1 className="mt-4 text-3xl font-black text-slate-900">Verify a TIKSE TECH Certificate</h1>
                <p className="mt-4 text-slate-600">Enter the verification code shown on the certificate to confirm its authenticity.</p>
                <form className="mt-8 space-y-4">
                    <div>
                        <label htmlFor="verificationCode" className="mb-2 block text-sm font-medium text-slate-700">Verification Code</label>
                        <input id="verificationCode" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="TT-2026-8F4K9X2M7Q" />
                    </div>
                    <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700" type="submit">Verify Certificate</button>
                </form>
            </div>
        </div>
    );
}
