import { redirect } from 'next/navigation';
import { markCompletedAction } from '@/actions/certificates';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const metadata={title:'Certificate issuance | TIKSE TECH'};

export default async function AdminCertificatesPage(){
 const session=await getSessionUser(); if(!session) redirect('/login');
 if(!hasRequiredRole(session,['ADMIN','SUPER_ADMIN'])) redirect('/dashboard');
 const admin=getSupabaseAdminClient(); if(!admin) throw new Error('Supabase server credentials are not configured.');
 const [enrollmentsResult,acceptedResult,certificatesResult]=await Promise.all([
  admin.from('enrollments').select('*').order('joined_at',{ascending:false}),
  admin.from('assignment_submissions').select('applicant_id,program_id,score').eq('status','ACCEPTED').gte('score',70),
  admin.from('certificates').select('id,participant_id,program_id,certificate_number,verification_code,status,issued_at')
 ]);
 if(enrollmentsResult.error||acceptedResult.error||certificatesResult.error) throw new Error('Certificate eligibility data could not be loaded.');
 const enrollments=enrollmentsResult.data||[];
 const participantIds=[...new Set(enrollments.map(e=>e.participant_id))], programIds=[...new Set(enrollments.map(e=>e.program_id))];
 const [profilesResult,programsResult]=await Promise.all([
  participantIds.length?admin.from('profiles').select('id,full_name,email').in('id',participantIds):Promise.resolve({data:[],error:null}),
  programIds.length?admin.from('programs').select('id,title,category').in('id',programIds):Promise.resolve({data:[],error:null})
 ]);
 const profiles=new Map((profilesResult.data||[]).map(p=>[p.id,p])), programs=new Map((programsResult.data||[]).map(p=>[p.id,p]));
 const accepted=new Set((acceptedResult.data||[]).map(a=>a.applicant_id+'::'+a.program_id));
 const certs=new Map((certificatesResult.data||[]).map(c=>[c.participant_id+'::'+c.program_id,c]));
 const rows=enrollments.map(e=>({...e,profile:profiles.get(e.participant_id),program:programs.get(e.program_id),eligible:accepted.has(e.participant_id+'::'+e.program_id),certificate:certs.get(e.participant_id+'::'+e.program_id)}));
 return <main className="container-shell py-12"><div className="mb-9"><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Credentials</p><h1 className="mt-2 text-4xl font-black text-slate-950">Certificate issuance</h1><p className="mt-2 text-slate-600">Issue a verifiable certificate after a participant has an accepted assignment scored 70/100 or higher.</p></div>
 <div className="space-y-4">{rows.length?rows.map(row=><article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div><h2 className="font-bold text-slate-950">{row.profile?.full_name||'Participant'}</h2><p className="mt-1 text-sm text-slate-600">{row.program?.title||'Program'} · {row.profile?.email||''}</p><p className="mt-1 text-xs text-slate-500">Enrollment: {row.status} · {row.eligible?'Passing assignment approved':'No passing approved assignment yet'}</p></div><div>{row.certificate?<div className="text-right"><p className="text-sm font-bold text-emerald-700">{row.certificate.status}</p><p className="text-xs text-slate-500">{row.certificate.certificate_number}</p><a className="text-sm font-semibold text-blue-700 underline" href={'/certificates/verify/'+row.certificate.verification_code}>Verify</a><span className="mx-2 text-slate-300">·</span><a className="text-sm font-semibold text-blue-700 underline" href={'/certificates/download/'+row.certificate.verification_code}>Download PDF</a></div>:row.eligible?<form action={markCompletedAction}><input type="hidden" name="programId" value={row.program_id}/><input type="hidden" name="participantId" value={row.participant_id}/><button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Issue certificate</button></form>:<span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Not eligible</span>}</div></article>):<p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No program enrollments found.</p>}</div></main>;
}
