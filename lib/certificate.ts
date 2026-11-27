import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

import { appUrl } from '@/lib/env';

export type CertificateDesign = {
    certificate_title?: string;
    subtitle?: string;
    issuer_name?: string;
    signer_name?: string;
    signer_title?: string;
    signature_text?: string;
    primary_color?: string;
    accent_color?: string;
};

function safeColor(value: string | undefined, fallback: string) {
    return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export async function generateCertificatePdf({
    participantName,
    programName,
    category,
    duration,
    completedAt,
    verificationCode,
    certificateNumber,
    design,
    signatureImage,
    stampImage
}: {
    participantName: string;
    programName: string;
    category: string;
    duration: string;
    completedAt: string;
    verificationCode: string;
    certificateNumber: string;
    design?: CertificateDesign | null;
}) {
    const safeName = participantName.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    const fileName = `${safeName}-${verificationCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
    const primary = safeColor(design?.primary_color, '#123b68');
    const accent = safeColor(design?.accent_color, '#c49a45');
    const issuer = design?.issuer_name || 'TIKSE TECH';
    const title = design?.certificate_title || 'CERTIFICATE OF COMPLETION';
    const subtitle = design?.subtitle || 'This certificate is proudly presented to';
    const signer = design?.signer_name || 'TIKSE TECH';
    const signerTitle = design?.signer_title || 'Authorized Signatory';
    const signatureText = design?.signature_text || signer;
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        doc.on('end', resolve);
        doc.on('error', reject);

        // Formal double-frame certificate layout, with course-specific brand colors.
        doc.rect(22, 22, 798, 551).lineWidth(5).strokeColor(accent).stroke();
        doc.rect(34, 34, 774, 527).lineWidth(1).strokeColor(primary).stroke();
        doc.fillColor(primary).font('Helvetica-Bold').fontSize(19).text(issuer.toUpperCase(), 70, 62, { width: 700, align: 'center', characterSpacing: 3 });
        doc.moveTo(330, 98).lineTo(510, 98).lineWidth(2).strokeColor(accent).stroke();
        doc.fillColor(primary).font('Times-Bold').fontSize(29).text(title.toUpperCase(), 70, 122, { width: 700, align: 'center' });
        doc.fillColor('#475569').font('Helvetica').fontSize(13).text(subtitle, 80, 190, { width: 680, align: 'center' });
        doc.fillColor('#111827').font('Times-Italic').fontSize(34).text(participantName, 80, 225, { width: 680, align: 'center' });
        doc.moveTo(190, 274).lineTo(650, 274).lineWidth(1).strokeColor(accent).stroke();
        doc.fillColor('#475569').font('Helvetica').fontSize(13).text('For successfully completing the course', 80, 296, { width: 680, align: 'center' });
        doc.fillColor(primary).font('Helvetica-Bold').fontSize(21).text(programName, 100, 323, { width: 640, align: 'center' });
        doc.fillColor('#475569').font('Helvetica').fontSize(10).text(`CATEGORY: ${category.toUpperCase()}     •     DURATION: ${duration}`, 80, 365, { width: 680, align: 'center' });
        doc.fillColor('#475569').fontSize(10).text(`COMPLETED: ${new Date(completedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}`, 80, 385, { width: 680, align: 'center' });
        doc.fillColor(primary).font('Times-Italic').fontSize(22).text(signatureText, 88, 440, { width: 210, align: 'center' });
        if (signatureImage) {
            try { doc.image(signatureImage, 112, 424, { fit: [160, 42], align: 'center', valign: 'center' }); }
            catch { doc.fillColor(primary).font('Times-Italic').fontSize(22).text(signatureText, 88, 440, { width: 210, align: 'center' }); }
        } else {
            doc.fillColor(primary).font('Times-Italic').fontSize(22).text(signatureText, 88, 440, { width: 210, align: 'center' });
        }
        if (stampImage) {
            try { doc.image(stampImage, 535, 420, { fit: [92, 92], align: 'center', valign: 'center' }); } catch { /* retain the certificate without a malformed stamp */ }
        }
        doc.moveTo(100, 472).lineTo(286, 472).lineWidth(1).strokeColor('#64748b').stroke();
        doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(10).text(signer, 88, 480, { width: 210, align: 'center' });
        doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(signerTitle, 88, 495, { width: 210, align: 'center' });

        const qrValue = `${appUrl}/certificates/verify/${verificationCode}`;
        QRCode.toBuffer(qrValue, { width: 128, margin: 1, errorCorrectionLevel: 'M' })
            .then((qrBuffer) => {
                doc.image(qrBuffer, 660, 424, { fit: [90, 90] });
                doc.fillColor('#475569').font('Helvetica').fontSize(8).text('SCAN TO VERIFY', 650, 519, { width: 110, align: 'center' });
                doc.fillColor('#64748b').fontSize(8).text(`Certificate ID: ${certificateNumber}`, 340, 478, { width: 300, align: 'center' });
                doc.text(`Verification code: ${verificationCode}`, 340, 492, { width: 300, align: 'center' });
                doc.text(`${appUrl}/certificates/verify/${verificationCode}`, 340, 506, { width: 300, align: 'center' });
                doc.end();
            })
            .catch(reject);
    });

    return { buffer: Buffer.concat(chunks), fileName, path: `/certificates/${fileName}`, certificateNumber, verificationCode };
}
