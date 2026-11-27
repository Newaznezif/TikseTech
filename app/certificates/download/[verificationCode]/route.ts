import { getSupabaseAdminClient } from '@/lib/supabase';
import { generateCertificatePdf } from '@/lib/certificate';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ verificationCode: string }> }) {
    const { verificationCode } = await params;
    const admin = getSupabaseAdminClient();
    if (!admin) return new Response('Certificate service is unavailable.', { status: 503 });
    const { data: certificate, error } = await admin.from('certificates').select('*').eq('verification_code', verificationCode).maybeSingle();
    if (error || !certificate) return new Response('Certificate not found.', { status: 404 });
    if (certificate.status !== 'ACTIVE') return new Response('This certificate has been revoked.', { status: 410 });
    const [participantResult, programResult] = await Promise.all([
        admin.from('profiles').select('full_name').eq('id', certificate.participant_id).single(),
        admin.from('programs').select('title,category,duration').eq('id', certificate.program_id).single()
    ]);
    if (participantResult.error || programResult.error) return new Response('Certificate details could not be loaded.', { status: 500 });
    const pdf = await generateCertificatePdf({ participantName: participantResult.data.full_name,
        programName: programResult.data.title, category: programResult.data.category, duration: programResult.data.duration,
        completedAt: certificate.completed_at, verificationCode: certificate.verification_code,
        certificateNumber: certificate.certificate_number });
    return new Response(new Uint8Array(pdf.buffer), { status: 200, headers: {
        'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + pdf.fileName + '"',
        'Cache-Control': 'private, no-store, max-age=0'
    }});
}
