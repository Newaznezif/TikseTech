import { appUrl } from '@/lib/env';

type StatusEmailInput = { to: string; name: string; subject: string; programTitle: string; status: string; feedback?: string; kind?: 'application' | 'assignment'; score?: number | null };

function escapeHtml(value: string) {
    return value.replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character] || character));
}

/** Optional Resend integration. In-app status remains the source of truth. */
export async function sendStatusEmail(input: StatusEmailInput): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from || !appUrl) return false;

    const name = escapeHtml(input.name || 'Participant');
    const program = escapeHtml(input.programTitle || 'your program');
    const status = escapeHtml(input.status.replaceAll('_', ' ').toLowerCase());
    const itemLabel = input.kind === 'assignment' ? 'assignment' : 'application';
    const score = input.score === null || input.score === undefined ? '' : '<p><strong>Score:</strong> ' + String(input.score) + ' / 100</p>';
    const feedback = input.feedback ? '<p><strong>Reviewer feedback</strong><br>' + escapeHtml(input.feedback).replace(/\n/g, '<br>') + '</p>' : '';
    const html = '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:600px;margin:auto">' +
        '<h2>TIKSE TECH program update</h2><p>Hello ' + name + ',</p><p>Your ' + itemLabel + ' for <strong>' + program + '</strong> is now <strong>' + status + '</strong>.</p>' +
        score + feedback + '<p>Sign in to your TIKSE TECH dashboard to view the latest details.</p><p>— TIKSE TECH</p></div>';

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to: [input.to], subject: input.subject, html })
        });
        return response.ok;
    } catch {
        return false;
    }
}


type CertificateEmailInput = {
    to: string;
    name: string;
    programTitle: string;
    certificateNumber: string;
    verificationCode: string;
};

/** Sends a credential notification when Resend is configured; issuance itself does not depend on email delivery. */
export async function sendCertificateEmail(input: CertificateEmailInput): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from || !appUrl) return false;

    const name = escapeHtml(input.name || 'Participant');
    const program = escapeHtml(input.programTitle || 'your program');
    const number = escapeHtml(input.certificateNumber);
    const verifyUrl = appUrl + '/certificates/verify/' + encodeURIComponent(input.verificationCode);
    const downloadUrl = appUrl + '/certificates/download/' + encodeURIComponent(input.verificationCode);
    const html = '<div style="font-family:Arial,sans-serif;line-height:1.65;color:#172033;max-width:640px;margin:auto">' +
        '<h2>Your TIKSE TECH certificate is ready</h2>' +
        '<p>Hello ' + name + ',</p>' +
        '<p>Congratulations on completing <strong>' + program + '</strong>. Your certificate has been issued.</p>' +
        '<p><strong>Certificate ID:</strong> ' + number + '</p>' +
        '<p><a href="' + downloadUrl + '" style="display:inline-block;background:#123b68;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Download certificate (PDF)</a></p>' +
        '<p><a href="' + verifyUrl + '">Verify this certificate online</a></p>' +
        '<p>— TIKSE TECH</p></div>';

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from,
                to: [input.to],
                subject: 'Your TIKSE TECH certificate — ' + input.programTitle,
                html
            })
        });
        return response.ok;
    } catch {
        return false;
    }
}
