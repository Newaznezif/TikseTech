import { redirect } from 'next/navigation';
import { markCompletedAction, saveCertificateTemplateAction } from '@/actions/certificates';
import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const metadata = { title: 'Certificate studio | TIKSE TECH' };

type Template = {
  id: string; program_id: string; template_name: string; certificate_title: string; subtitle: string;
  issuer_name: string; signer_name: string; signer_title: string; signature_text: string;
  primary_color: string; accent_color: string; show_on_homepage: boolean;
};

export default async function AdminCertificatesPage({ searchParams }: { searchParams?: Promise<{ template?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const session = await getSessionUser();
  if (!session) redirect('/admin/login');
  if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) redirect('/dashboard');
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error('Supabase server credentials are not configured.');

  const [programsResult, templatesResult, enrollmentsResult, acceptedResult, certificatesResult] = await Promise.all([
    admin.from('programs').select('id,title,category,duration').order('created_at', { ascending: false }),
    admin.from('certificate_templates').select('*'),
    admin.from('enrollments').select('*').order('joined_at', { ascending: false }),
    admin.from('assignment_submissions').select('applicant_id,program_id,score').eq('status', 'ACCEPTED').gte('score', 70),
    admin.from('certificates').select('id,participant_id,program_id,certificate_number,verification_code,status,issued_at')
  ]);
  if (programsResult.error || enrollmentsResult.error || acceptedResult.error || certificatesResult.error) {
    throw new Error('Certificate management data could not be loaded.');
  }
  const templateSchemaMissing = templatesResult.error?.code === '42P01';
  if (templatesResult.error && !templateSchemaMissing) throw new Error('Certificate designs could not be loaded: ' + templatesResult.error.message);

  const programs = programsResult.data || [];
  const templates = new Map(((templatesResult.data || []) as Template[]).map(t => [t.program_id, t]));
  const enrollments = enrollmentsResult.data || [];
  const participantIds = [...new Set(enrollments.map(e => e.participant_id))];
  const programIds = [...new Set(enrollments.map(e => e.program_id))];
  const [profilesResult, enrolledProgramsResult] = await Promise.all([
    participantIds.length ? admin.from('profiles').select('id,full_name,email').in('id', participantIds) : Promise.resolve({ data: [], error: null }),
    programIds.length ? admin.from('programs').select('id,title,category').in('id', programIds) : Promise.resolve({ data: [], error: null })
  ]);
  if (profilesResult.error || enrolledProgramsResult.error) throw new Error('Participant certificate records could not be loaded.');
  const profiles = new Map((profilesResult.data || []).map(p => [p.id, p]));
  const enrolledPrograms = new Map((enrolledProgramsResult.data || []).map(p => [p.id, p]));
  const accepted = new Set((acceptedResult.data || []).map(a => a.applicant_id + '::' + a.program_id));
  const certs = new Map((certificatesResult.data || []).map(c => [c.participant_id + '::' + c.program_id, c]));
  const rows = enrollments.map(e => ({
    ...e, profile: profiles.get(e.participant_id), program: enrolledPrograms.get(e.program_id),
    eligible: accepted.has(e.participant_id + '::' + e.program_id),
    certificate: certs.get(e.participant_id + '::' + e.program_id)
  }));

  return (
    <main className="container-shell py-12">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Credential operations</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Certificate studio</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Design a distinct certificate for each course, configure its authorized signatory, preview the layout, and publish the design on the public homepage.</p>
      </div>

      {params.template === 'saved' ? <p role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Certificate design saved successfully.</p> : null}
      {templateSchemaMissing ? <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Database migration required.</strong> Apply <code>supabase/migrations/010_course_certificate_templates.sql</code> in your Supabase SQL editor to activate template storage.</div> : null}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Design system</p><h2 className="mt-1 text-2xl font-black text-slate-950">Course certificate designs</h2></div><span className="text-sm text-slate-500">{programs.length} courses</span></div>
        <div className="grid gap-6 xl:grid-cols-2">
          {programs.map(program => {
            const t = templates.get(program.id);
            const primary = t?.primary_color || '#123b68';
            const accent = t?.accent_color || '#c49a45';
            return (
              <article key={program.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{program.category}</p><h3 className="mt-1 text-lg font-bold text-slate-950">{program.title}</h3></div>
                <div className="bg-slate-100 p-4 sm:p-6">
                  <div className="relative mx-auto aspect-[1.414/1] w-full max-w-[560px] overflow-hidden bg-[#fffdf7] p-3 shadow-md sm:p-5" style={{ border: '8px double ' + accent }}>
                    <div className="flex h-full flex-col items-center justify-between border p-3 text-center sm:p-5" style={{ borderColor: accent }}>
                      <div><p className="text-[8px] font-black uppercase tracking-[0.25em] sm:text-[10px]" style={{ color: primary }}>{t?.issuer_name || 'TIKSE TECH'}</p><div className="mx-auto my-2 h-[2px] w-16" style={{ backgroundColor: accent }}/><p className="text-[11px] font-black uppercase tracking-widest sm:text-base" style={{ color: primary }}>{t?.certificate_title || 'Certificate of Completion'}</p></div>
                      <div><p className="text-[7px] text-slate-500 sm:text-[10px]">{t?.subtitle || 'This certificate is proudly presented to'}</p><p className="mt-1 text-sm font-serif italic text-slate-800 sm:text-xl">Participant Name</p><div className="mx-auto my-2 h-px w-2/3" style={{ backgroundColor: accent }}/><p className="text-[7px] text-slate-500 sm:text-[10px]">For successfully completing</p><p className="mt-1 max-w-xs text-[9px] font-bold sm:text-sm" style={{ color: primary }}>{program.title}</p></div>
                      <div className="flex w-full items-end justify-between gap-2"><div className="text-left"><p className="font-serif text-[10px] italic sm:text-base" style={{ color: primary }}>{t?.signature_text || 'Authorized Signature'}</p><div className="my-1 w-20 border-t border-slate-400 sm:w-28"/><p className="text-[6px] font-bold sm:text-[9px]">{t?.signer_name || 'Signatory name'}</p><p className="text-[6px] text-slate-500 sm:text-[8px]">{t?.signer_title || 'Authorized Signatory'}</p></div><div className="text-right text-[6px] text-slate-500 sm:text-[8px]">CERTIFICATE ID<br/>TT-XXXX-XXXX<br/>QR VERIFICATION</div></div>
                    </div>
                  </div>
                </div>
                <form action={saveCertificateTemplateAction} className="grid gap-4 p-5 sm:grid-cols-2">
                  <input type="hidden" name="programId" value={program.id}/>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Design name<input name="templateName" defaultValue={t?.template_name || 'TIKSE TECH Classic'} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"/></label>
                  <label className="text-xs font-semibold text-slate-600">Certificate title<input name="certificateTitle" defaultValue={t?.certificate_title || 'Certificate of Completion'} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"/></label>
                  <label className="text-xs font-semibold text-slate-600">Issuer name<input name="issuerName" defaultValue={t?.issuer_name || 'TIKSE TECH'} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Presentation line<input name="subtitle" defaultValue={t?.subtitle || 'This certificate is proudly presented to'} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"/></label>
                  <label className="text-xs font-semibold text-slate-600">Authorized signatory<input name="signerName" defaultValue={t?.signer_name || ''} required placeholder="Full legal name" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"/></label>
                  <label className="text-xs font-semibold text-slate-600">Signatory title<input name="signerTitle" defaultValue={t?.signer_title || 'Authorized Signatory'} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"/></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Signature text<input name="signatureText" defaultValue={t?.signature_text || ''} required placeholder="Type the authorized signatory's signature name" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900"/></label>
                  <label className="flex items-center gap-3 text-xs font-semibold text-slate-600">Primary color<input type="color" name="primaryColor" defaultValue={primary} className="h-10 w-14 cursor-pointer rounded border border-slate-300"/></label>
                  <label className="flex items-center gap-3 text-xs font-semibold text-slate-600">Accent color<input type="color" name="accentColor" defaultValue={accent} className="h-10 w-14 cursor-pointer rounded border border-slate-300"/></label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" name="showOnHomepage" defaultChecked={t?.show_on_homepage ?? true} className="h-4 w-4"/> Show this course certificate design on the public homepage</label>
                  <div className="sm:col-span-2"><button disabled={templateSchemaMissing} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Save course certificate design</button></div>
                </form>
              </article>
            );
          })}
          {!programs.length ? <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Create a course before designing its certificate.</p> : null}
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Issuance queue</p><h2 className="mt-1 text-2xl font-black text-slate-950">Issue certificates to participants</h2><p className="mt-2 text-sm text-slate-600">Participants must be enrolled and have at least one accepted assignment scored 70/100 or higher.</p></div>
        <div className="space-y-4">{rows.length ? rows.map(row => <article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div><h3 className="font-bold text-slate-950">{row.profile?.full_name || 'Participant'}</h3><p className="mt-1 text-sm text-slate-600">{row.program?.title || 'Program'} · {row.profile?.email || ''}</p><p className="mt-1 text-xs text-slate-500">Enrollment: {row.status} · {row.eligible ? 'Passing assignment approved' : 'No passing approved assignment yet'}</p></div><div>{row.certificate ? <div className="text-right"><p className="text-sm font-bold text-emerald-700">{row.certificate.status}</p><p className="text-xs text-slate-500">{row.certificate.certificate_number}</p><a className="text-sm font-semibold text-blue-700 underline" href={'/certificates/verify/' + row.certificate.verification_code}>Verify</a><span className="mx-2 text-slate-300">·</span><a className="text-sm font-semibold text-blue-700 underline" href={'/certificates/download/' + row.certificate.verification_code}>Download PDF</a></div> : row.eligible ? <form action={markCompletedAction}><input type="hidden" name="programId" value={row.program_id}/><input type="hidden" name="participantId" value={row.participant_id}/><button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Issue certificate</button></form> : <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Not eligible</span>}</div></article>) : <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No program enrollments found.</p>}</div>
      </section>
    </main>
  );
}
