import { verifyCertificateByCode } from '@/lib/store';

export async function generateMetadata({ params }: { params: Promise<{ verificationCode: string }> }) {
    const { verificationCode } = await params;
    return { title: `Certificate ${verificationCode} | TIKSE TECH` };
}

export default async function CertificateVerificationRoute({ params }: { params: Promise<{ verificationCode: string }> }) {
    const { verificationCode } = await params;
    const result = await verifyCertificateByCode(verificationCode);

    if (!result.found) {
        return (
            <div className="container-shell py-20">
                <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Certificate Not Found</p>
                    <h1 className="mt-4 text-3xl font-black text-slate-900">Certificate Not Found</h1>
                    <p className="mt-4 text-slate-600">Please check the verification code and try again.</p>
                </div>
            </div>
        );
    }

    if (result.revoked) {
        return (
            <div className="container-shell py-20">
                <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 shadow-soft">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">Certificate Revoked</p>
                    <h1 className="mt-4 text-3xl font-black text-red-900">Certificate Revoked</h1>
                    <p className="mt-4 text-red-800">This certificate is no longer valid.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-shell py-20">
            <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Certificate Verified</p>
                <h1 className="mt-4 text-3xl font-black text-emerald-900">✓ Certificate Verified</h1>
                <div className="mt-6 space-y-2 text-emerald-900">
                    <p><strong>Participant:</strong> Sample Participant</p>
                    <p><strong>Program:</strong> Cybersecurity Internship</p>
                    <p><strong>Category:</strong> Cybersecurity</p>
                    <p><strong>Completed:</strong> October 2026</p>
                    <p><strong>Issued:</strong> October 2026</p>
                    <p><strong>Certificate ID:</strong> TT-CERT-XXXX</p>
                    <p><strong>Status:</strong> ACTIVE</p>
                </div>
            </div>
        </div>
    );
}
