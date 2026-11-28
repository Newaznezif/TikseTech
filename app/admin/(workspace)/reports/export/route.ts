import { getSessionUser, hasRequiredRole } from '@/lib/session';
import { getAdminReportMetrics } from '@/lib/admin-reports';

function csvCell(value: string | number) {
    return '"' + String(value).replace(/"/g, '""') + '"';
}

export async function GET() {
    const session = await getSessionUser();
    if (!session) return new Response('Authentication required.', { status: 401 });
    if (!hasRequiredRole(session, ['ADMIN', 'SUPER_ADMIN'])) {
        return new Response('Administrator access required.', { status: 403 });
    }

    try {
        const metrics = await getAdminReportMetrics();
        const rows = [
            ['Section', 'Metric', 'Value'],
            ...metrics.map((metric) => [metric.section, metric.label, metric.value])
        ];
        const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
        const date = new Date().toISOString().slice(0, 10);
        return new Response('\uFEFF' + csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="tikse-tech-report-' + date + '.csv"',
                'Cache-Control': 'private, no-store, max-age=0'
            }
        });
    } catch {
        return new Response('Report export is temporarily unavailable.', {
            status: 500,
            headers: { 'Cache-Control': 'no-store' }
        });
    }
}
