import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

import { appUrl } from '@/lib/env';
import { generateCertificateNumber } from '@/lib/utils';

export async function generateCertificatePdf({
    participantName,
    programName,
    category,
    duration,
    completedAt,
    verificationCode
}: {
    participantName: string;
    programName: string;
    category: string;
    duration: string;
    completedAt: string;
    verificationCode: string;
}) {
    const certificateNumber = generateCertificateNumber();
    const safeName = participantName.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    const fileName = `${safeName}-${verificationCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
        doc.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        doc.on('end', resolve);
        doc.on('error', reject);

        doc.fillColor('#0f172a').fontSize(28).text('TIKSE TECH', 80, 60);
        doc.fillColor('#2563eb').fontSize(26).text('CERTIFICATE OF COMPLETION', 80, 100);
        doc.fillColor('#475569').fontSize(12).text('This certificate is proudly presented to', 80, 160);
        doc.fillColor('#0f172a').fontSize(24).text(participantName, 80, 190, { width: 650 });
        doc.fillColor('#475569').fontSize(12).text('For successfully completing', 80, 245);
        doc.fillColor('#0f172a').fontSize(20).text(programName, 80, 275, { width: 650 });
        doc.fillColor('#475569').fontSize(12).text(`Category: ${category}`, 80, 325);
        doc.fillColor('#475569').fontSize(12).text(`Duration: ${duration}`, 80, 350);
        doc.fillColor('#475569').fontSize(12).text(`Completed: ${new Date(completedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}`, 80, 375);
        doc.fillColor('#475569').fontSize(12).text(`Certificate ID: ${certificateNumber}`, 80, 410);
        doc.fillColor('#475569').fontSize(12).text(`Verification Code: ${verificationCode}`, 80, 435);
        doc.fillColor('#475569').fontSize(12).text(`Verification URL: ${appUrl}/certificates/verify/${verificationCode}`, 80, 460);

        const qrValue = `${appUrl}/certificates/verify/${verificationCode}`;
        QRCode.toBuffer(qrValue, { width: 160, margin: 1 })
            .then((qrBuffer) => {
                doc.image(qrBuffer, 560, 160, { fit: [140, 140] });
                doc.fillColor('#1f2937').fontSize(11).text('Authorized TIKSE TECH signatory', 510, 330, { width: 180 });
                doc.moveTo(500, 360).lineTo(680, 360).strokeColor('#94a3b8').stroke();
                doc.fontSize(10).fillColor('#64748b').text('Certificate verified by TIKSE TECH', 500, 380);
                doc.end();
            })
            .catch(reject);
    });

    return {
        buffer: Buffer.concat(chunks),
        fileName,
        path: `/certificates/${fileName}`,
        certificateNumber,
        verificationCode
    };
}
