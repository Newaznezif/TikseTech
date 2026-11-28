import { createSupabaseServerClient } from '@/lib/supabase-server';

export type AdminReportMetric = {
    section: string;
    label: string;
    value: number;
};

export async function getAdminReportMetrics(): Promise<AdminReportMetric[]> {
    const supabase = await createSupabaseServerClient();
    const results = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'PARTICIPANT'),
        supabase.from('programs').select('id', { count: 'exact', head: true }),
        supabase.from('programs').select('id', { count: 'exact', head: true }).in('status', ['OPEN', 'IN_PROGRESS']),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'WAITLISTED']),
        supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'ACCEPTED'),
        supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'REJECTED'),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('status', ['ENROLLED', 'ACTIVE']),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
        supabase.from('assignment_submissions').select('id', { count: 'exact', head: true }),
        supabase.from('assignment_submissions').select('id', { count: 'exact', head: true }).in('status', ['SUBMITTED', 'UNDER_REVIEW']),
        supabase.from('assignment_submissions').select('id', { count: 'exact', head: true }).eq('status', 'ACCEPTED'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('status', 'REVOKED')
    ]);

    const failed = results.find((result) => result.error);
    if (failed?.error) {
        throw new Error('Live report data could not be loaded: ' + failed.error.message);
    }

    const count = (index: number) => results[index].count ?? 0;
    return [
        { section: 'Participants', label: 'Participant accounts', value: count(0) },
        { section: 'Programs', label: 'Total programs', value: count(1) },
        { section: 'Programs', label: 'Open or in progress', value: count(2) },
        { section: 'Applications', label: 'Total applications', value: count(3) },
        { section: 'Applications', label: 'Awaiting decision', value: count(4) },
        { section: 'Applications', label: 'Accepted', value: count(5) },
        { section: 'Applications', label: 'Rejected', value: count(6) },
        { section: 'Enrollments', label: 'Active enrollments', value: count(7) },
        { section: 'Enrollments', label: 'Completed enrollments', value: count(8) },
        { section: 'Assignments', label: 'Total submissions', value: count(9) },
        { section: 'Assignments', label: 'Awaiting review', value: count(10) },
        { section: 'Assignments', label: 'Accepted submissions', value: count(11) },
        { section: 'Certificates', label: 'Active certificates', value: count(12) },
        { section: 'Certificates', label: 'Revoked certificates', value: count(13) }
    ];
}
