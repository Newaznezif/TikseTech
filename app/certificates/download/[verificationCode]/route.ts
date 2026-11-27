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
    const [participantResult, programResult, templateResult] = await Promise.all([
        admin.from('profiles').select('full_name').eq('id', certificate.participant_id).single(),
        admin.from('programs').select('title,category,duration').eq('id', certificate.program_id).single(),
        admin.from('certificate_templates').select('certificate_title,subtitle,issuer_name,signer_name,signer_title,signature_text,primary_color,accent_color,signature_image_path,stamp_image_path').eq('program_id', certificate.program_id).maybeSingle()
    ]);
    if (participantResult.error || programResult.error) return new Response('Certificate details could not be loaded.', { status: 500 });
    if (templateResult.error && templateResult.error.code !== '42P01') return new Response('Certificate design could not be loaded.', { status: 500 });
    const template = templateResult.data;
    const loadAsset = async (assetPath?: string | null) => {
        if (!assetPath) return null;
        const { data, error } = await admin.storage.from('certificate-assets').download(assetPath);
        if (error || !data) throw new Error('A stored certificate signature or stamp could not be loaded.');
        return Buffer.from(await data.arrayBuffer());
    };
    let signatureImage: Buffer | null = null;
    let stampImage: Buffer | null = null;
    try {
        [signatureImage, stampImage] = await Promise.all([
            loadAsset(template?.signature_image_path),
            loadAsset(template?.stamp_image_path)
        ]);
    } catch {
        return new Response('Certificate signature assets could not be loaded.', { status: 500 });
    }
    const pdf = await generateCertificatePdf({ participantName: participantResult.data.full_name,
        programName: programResult.data.title, category: programResult.data.category, duration: programResult.data.duration,
        completedAt: certificate.completed_at, verificationCode: certificate.verification_code,
        certificateNumber: certificate.certificate_number, design: template || null, signatureImage, stampImage });
    return new Response(new Uint8Array(pdf.buffer), { status: 200, headers: {
        'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + pdf.fileName + '"',
        'Cache-Control': 'private, no-store, max-age=0'
    }});
}
