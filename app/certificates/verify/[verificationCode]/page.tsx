import Link from 'next/link';
import { verifyCertificateByCode } from '@/lib/store';

export async function generateMetadata({ params }: { params: Promise<{ verificationCode: string }> }) {
    const { verificationCode } = await params;
    return { title: `Certificate ${verificationCode} | TIKSE TECH` };
}

export default async function CertificateVerificationRoute({ params }: { params: Promise<{ verificationCode: string }> }) {
    const { verificationCode } = await params;
    const result = await verifyCertificateByCode(verificationCode);
    if (!result.found) return <div className="container-shell py-20"><div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Certificate not found</p><h1 className="mt-4 text-3xl font-black text-slate-900">Certificate not found</h1><p className="mt-4 text-slate-600">Check the verification code and try again.</p></div></div>;
    if (!result.certificate) return <div className="container-shell py-20"><div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-soft"><h1 className="text-3xl font-black text-slate-900">Certificate details unavailable</h1></div></div>;
    if (result.revoked) return <div className="container-shell py-20"><div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 shadow-soft"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">Certificate revoked</p><h1 className="mt-4 text-3xl font-black text-red-900">This certificate is no longer valid.</h1><p className="mt-4 text-red-800">Contact TIKSE TECH if you believe this status is incorrect.</p></div></div>;
    const certificate=result.certificate;
    return <div className="container-shell py-20"><div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 shadow-soft"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Certificate verified</p><h1 className="mt-3 text-3xl font-black text-slate-950">Authentic credential</h1></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">ACTIVE</span></div>
    <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-slate-500">Participant</p><p className="mt-1 font-semibold text-slate-900">{result.participantName}</p></div><div><p className="text-xs font-semibold uppercase text-slate-500">Program</p><p className="mt-1 font-semibold text-slate-900">{result.programTitle}</p></div><div><p className="text-xs font-semibold uppercase text-slate-500">Category</p><p className="mt-1 font-semibold text-slate-900">{result.programCategory}</p></div><div><p className="text-xs font-semibold uppercase text-slate-500">Issued</p><p className="mt-1 font-semibold text-slate-900">{new Date(certificate.issueDate).toLocaleDateString()}</p></div><div><p className="text-xs font-semibold uppercase text-slate-500">Certificate ID</p><p className="mt-1 font-semibold text-slate-900">{certificate.certificateNumber}</p></div><div><p className="text-xs font-semibold uppercase text-slate-500">Verification code</p><p className="mt-1 font-semibold text-slate-900">{certificate.verificationCode}</p></div></div>
    <Link href={'/certificates/download/'+verificationCode} className="mt-8 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Download certificate PDF</Link></div></div>;
}
