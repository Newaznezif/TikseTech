type StatusEmailInput = { to: string; name: string; subject: string; programTitle: string; status: string; feedback?: string; kind?: 'application' | 'assignment'; score?: number | null };

function escapeHtml(value: string) {
    return value.replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character] || character));
}

/** Optional Resend integration. In-app status remains the source of truth. */
export async function sendStatusEmail(input: StatusEmailInput): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) return false;

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
