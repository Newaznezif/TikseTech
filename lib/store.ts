import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

import { getSupabaseAdminClient, isSupabaseConfigured, shouldUseLocalStore } from '@/lib/supabase';
import { appUrl } from '@/lib/env';
import { generateCertificateNumber, generateVerificationCode } from '@/lib/utils';
import type { AppData, Application, Certificate, Enrollment, Program, ProgramStatus, UserProfile } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'tikse-data.json');

const initialPrograms: Program[] = [
    {
        id: 'program-cybersecurity',
        slug: 'cybersecurity-internship',
        title: 'Cybersecurity Internship Program',
        category: 'Cybersecurity',
        shortDescription: 'Develop practical skills in threat analysis, network defense, and secure operations.',
        description:
            'This program helps aspiring cybersecurity professionals learn how to analyze threats, secure systems, and respond to incidents in a real-world remote environment.',
        duration: '8 Weeks',
        difficulty: 'Beginner',
        deliveryMode: 'REMOTE',
        eligibility: 'WORLDWIDE',
        startDate: '2026-10-01',
        endDate: '2026-11-25',
        applicationDeadline: '2026-09-30',
        availableSeats: 35,
        currentParticipants: 18,
        status: 'OPEN',
        skills: ['Network Security', 'Threat Analysis', 'Linux', 'Incident Response'],
        learningOutcomes: ['Identify common cyber risks', 'Secure digital assets', 'Explore security monitoring'],
        requirements: ['Basic computer literacy', 'Willingness to learn', 'Access to a laptop'],
        applicationQuestions: ['Why cybersecurity?', 'Do you have technical experience?'],
        communityPlatform: 'DISCORD',
        communityUrl: 'https://example.com/community/cybersecurity',
        createdAt: '2026-09-01T10:00:00.000Z',
        updatedAt: '2026-09-01T10:00:00.000Z'
    },
    {
        id: 'program-software-development',
        slug: 'software-development-internship',
        title: 'Software Development Internship',
        category: 'Programming / Software Development',
        shortDescription: 'Build production-ready skills in full-stack development, APIs, and collaboration workflows.',
        description:
            'Develop real software solutions with modern web tooling, structured engineering workflows, and collaborative mentoring practices.',
        duration: '10 Weeks',
        difficulty: 'Intermediate',
        deliveryMode: 'REMOTE',
        eligibility: 'WORLDWIDE',
        startDate: '2026-10-08',
        endDate: '2026-12-15',
        applicationDeadline: '2026-10-05',
        availableSeats: 30,
        currentParticipants: 12,
        status: 'OPEN',
        skills: ['TypeScript', 'React', 'APIs', 'Git'],
        learningOutcomes: ['Ship a project sprint', 'Use version control', 'Debug and test apps'],
        requirements: ['Programming basics', 'Motivation to learn', 'English proficiency'],
        applicationQuestions: ['What tech stack interests you?', 'Describe one project you built'],
        createdAt: '2026-09-02T12:00:00.000Z',
        updatedAt: '2026-09-02T12:00:00.000Z'
    },
    {
        id: 'program-networking',
        slug: 'computer-networking-program',
        title: 'Computer Networking Program',
        category: 'Computer Networking',
        shortDescription: 'Learn the fundamentals of networking, routing, and infrastructure reliability.',
        description:
            'Explore network topologies, services, troubleshooting, and practical scenarios that strengthen infrastructure knowledge across remote teams.',
        duration: '6 Weeks',
        difficulty: 'Beginner',
        deliveryMode: 'REMOTE',
        eligibility: 'WORLDWIDE',
        startDate: '2026-11-03',
        endDate: '2026-12-18',
        applicationDeadline: '2026-10-28',
        availableSeats: 20,
        currentParticipants: 10,
        status: 'OPEN',
        skills: ['Networking', 'Troubleshooting', 'Routing', 'Packet Analysis'],
        learningOutcomes: ['Understand network fundamentals', 'Diagnose common issues', 'Build a resilient lab setup'],
        requirements: ['Stable internet', 'Interest in networking', 'Commitment to project tasks'],
        applicationQuestions: ['Where do you see networking in your career?', 'What devices or systems do you use?'],
        createdAt: '2026-09-02T14:00:00.000Z',
        updatedAt: '2026-09-02T14:00:00.000Z'
    }
];

const defaultData: AppData = {
    programs: initialPrograms,
    profiles: [
        {
            id: 'profile-admin',
            authUserId: 'auth-admin',
            fullName: 'TIKSE TECH Admin',
            username: 'tiksetech-admin',
            email: 'admin@tiksetech.dev',
            role: 'ADMIN',
            country: 'Global',
            timezone: 'UTC',
            shortBio: 'Program administrator and platform operations lead.',
            skills: ['Operations', 'Mentorship', 'Strategy'],
            createdAt: new Date().toISOString()
        }
    ],
    applications: [],
    enrollments: [],
    certificates: [],
    adminNotes: {}
};

function normalizeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => String(item)).filter(Boolean);
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
        } catch {
            return [];
        }
    }

    return [];
}

function mapDbProgram(row: any): Program {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: row.category,
        shortDescription: row.short_description ?? '',
        description: row.description ?? '',
        duration: row.duration ?? '',
        difficulty: row.difficulty ?? 'Beginner',
        deliveryMode: row.delivery_mode ?? 'REMOTE',
        eligibility: row.eligibility ?? 'WORLDWIDE',
        startDate: row.start_date ?? '',
        endDate: row.end_date ?? '',
        applicationDeadline: row.application_deadline ?? '',
        availableSeats: Number(row.available_seats ?? 0),
        currentParticipants: Number(row.current_participants ?? 0),
        status: row.status ?? 'DRAFT',
        skills: normalizeStringArray(row.skills),
        learningOutcomes: normalizeStringArray(row.learning_outcomes),
        requirements: normalizeStringArray(row.requirements),
        applicationQuestions: normalizeStringArray(row.application_questions),
        communityPlatform: row.community_platform ?? undefined,
        communityUrl: row.community_url ?? undefined,
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString()
    };
}

function mapDbProfile(row: any): UserProfile {
    return {
        id: row.id,
        authUserId: row.auth_user_id ?? '',
        fullName: row.full_name ?? '',
        username: row.username ?? '',
        email: row.email ?? '',
        role: row.role ?? 'PARTICIPANT',
        country: row.country ?? 'Global',
        timezone: row.timezone ?? 'UTC',
        profilePhoto: row.profile_photo ?? undefined,
        shortBio: row.short_bio ?? undefined,
        skills: normalizeStringArray(row.skills),
        education: row.education ?? undefined,
        experience: row.experience ?? undefined,
        github: row.github ?? undefined,
        linkedin: row.linkedin ?? undefined,
        portfolio: row.portfolio ?? undefined,
        website: row.website ?? undefined,
        createdAt: row.created_at ?? new Date().toISOString()
    };
}

function mapDbApplication(row: any): Application {
    return {
        id: row.id,
        programId: row.program_id,
        applicantId: row.applicant_id,
        fullName: row.full_name ?? '',
        email: row.email ?? '',
        country: row.country ?? 'Global',
        timezone: row.timezone ?? 'UTC',
        education: row.education ?? '',
        experience: row.experience ?? '',
        skills: normalizeStringArray(row.skills),
        motivation: row.motivation ?? '',
        github: row.github ?? undefined,
        linkedin: row.linkedin ?? undefined,
        portfolio: row.portfolio ?? undefined,
        availability: row.availability ?? '',
        answers: row.answers && typeof row.answers === 'object' ? Object.fromEntries(Object.entries(row.answers).map(([key, value]) => [key, String(value)])) : {},
        status: row.status ?? 'SUBMITTED',
        submittedAt: row.submitted_at ?? new Date().toISOString()
    };
}

function mapDbEnrollment(row: any): Enrollment {
    return {
        id: row.id,
        programId: row.program_id,
        participantId: row.participant_id,
        cohortName: row.cohort_name ?? undefined,
        status: row.status ?? 'ENROLLED',
        joinedAt: row.joined_at ?? new Date().toISOString(),
        completedAt: row.completed_at ?? undefined
    };
}

function mapDbCertificate(row: any): Certificate {
    return {
        id: row.id,
        certificateNumber: row.certificate_number ?? '',
        verificationCode: row.verification_code ?? '',
        participantId: row.participant_id,
        programId: row.program_id,
        cohortId: row.cohort_id ?? undefined,
        certificateTitle: row.certificate_title ?? 'Certificate of Completion',
        issueDate: row.issued_at ?? new Date().toISOString(),
        completedAt: row.completed_at ?? new Date().toISOString(),
        status: row.status ?? 'ACTIVE',
        pdfPath: row.pdf_path ?? '',
        verificationUrl: row.verification_url ?? '',
        revokedAt: row.revoked_at ?? undefined,
        revocationReason: row.revocation_reason ?? undefined,
        revokedBy: row.revoked_by ?? undefined,
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? new Date().toISOString()
    };
}

function shouldUseSupabaseStore() {
    return !shouldUseLocalStore() && isSupabaseConfigured();
}

async function withSupabaseFallback<T>(context: string, operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (!isSupabaseConfigured()) {
        return fallback();
    }

    try {
        return await operation();
    } catch (error) {
        console.warn(`[store:${context}] Supabase operation failed; falling back to local store:`, error);
        return fallback();
    }
}

async function ensureStoreFile() {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
}

export async function readStore(): Promise<AppData> {
    await ensureStoreFile();
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as AppData;
    return {
        ...defaultData,
        ...parsed,
        programs: parsed.programs?.length ? parsed.programs : defaultData.programs,
        profiles: parsed.profiles || defaultData.profiles,
        applications: parsed.applications || [],
        enrollments: parsed.enrollments || [],
        certificates: parsed.certificates || [],
        adminNotes: parsed.adminNotes || {}
    };
}

export async function saveStore(data: AppData) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function listPrograms() {
    return withSupabaseFallback('listPrograms', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.from('programs').select('*').order('created_at', { ascending: false });
        if (error) {
            throw error;
        }

        return (data ?? []).map(mapDbProgram);
    }, async () => {
        const data = await readStore();
        return data.programs;
    });
}

export async function getProgramBySlug(slug: string) {
    return withSupabaseFallback('getProgramBySlug', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.from('programs').select('*').eq('slug', slug).maybeSingle();
        if (error) {
            throw error;
        }

        return data ? mapDbProgram(data) : null;
    }, async () => {
        const data = await readStore();
        return data.programs.find((program) => program.slug === slug) || null;
    });
}

export async function createUserProfile(input: Partial<UserProfile> & { email: string; fullName: string; role?: UserProfile['role'] }) {
    return withSupabaseFallback('createUserProfile', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const id = input.id || crypto.randomUUID();
        const profileRow = {
            id,
            auth_user_id: input.authUserId || null,
            full_name: input.fullName,
            username: input.username || input.email.split('@')[0].toLowerCase(),
            email: input.email,
            role: input.role || 'PARTICIPANT',
            country: input.country || 'Global',
            timezone: input.timezone || 'UTC',
            short_bio: input.shortBio || '',
            skills: input.skills || [],
            education: input.education || '',
            experience: input.experience || '',
            github: input.github || '',
            linkedin: input.linkedin || '',
            portfolio: input.portfolio || '',
            website: input.website || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await admin.from('profiles').upsert(profileRow, { onConflict: 'id' }).select().single();
        if (error) {
            throw error;
        }

        return mapDbProfile(data);
    }, async () => {
        const data = await readStore();
        const existing = data.profiles.find((profile) => profile.email.toLowerCase() === input.email.toLowerCase());
        if (existing) return existing;

        const profile: UserProfile = {
            id: input.id || uuidv4(),
            authUserId: input.authUserId || uuidv4(),
            fullName: input.fullName,
            username: input.username || input.email.split('@')[0].toLowerCase(),
            email: input.email,
            role: input.role || 'PARTICIPANT',
            country: input.country || 'Global',
            timezone: input.timezone || 'UTC',
            shortBio: input.shortBio || '',
            skills: input.skills || [],
            education: input.education || '',
            experience: input.experience || '',
            github: input.github || '',
            linkedin: input.linkedin || '',
            portfolio: input.portfolio || '',
            website: input.website || '',
            createdAt: new Date().toISOString()
        };

        data.profiles.push(profile);
        await saveStore(data);
        return profile;
    });
}

export async function getProfileByEmail(email: string) {
    return withSupabaseFallback('getProfileByEmail', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
        if (error) {
            throw error;
        }

        return data ? mapDbProfile(data) : null;
    }, async () => {
        const data = await readStore();
        return data.profiles.find((profile) => profile.email.toLowerCase() === email.toLowerCase()) || null;
    });
}

export async function getApplicationsByUser(userId: string) {
    return withSupabaseFallback('getApplicationsByUser', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.from('applications').select('*').eq('applicant_id', userId);
        if (error) {
            throw error;
        }

        return (data ?? []).map(mapDbApplication);
    }, async () => {
        const data = await readStore();
        return data.applications.filter((application) => application.applicantId === userId);
    });
}

export async function getApplicationsForProgram(programId: string) {
    return withSupabaseFallback('getApplicationsForProgram', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.from('applications').select('*').eq('program_id', programId);
        if (error) {
            throw error;
        }

        return (data ?? []).map(mapDbApplication);
    }, async () => {
        const data = await readStore();
        return data.applications.filter((application) => application.programId === programId);
    });
}

export async function createApplication(payload: Omit<Application, 'id' | 'status' | 'submittedAt'> & { applicationId?: string }) {
    return withSupabaseFallback('createApplication', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const existing = await admin
            .from('applications')
            .select('*')
            .eq('program_id', payload.programId)
            .eq('applicant_id', payload.applicantId)
            .maybeSingle();

        if (existing.data) {
            return mapDbApplication(existing.data);
        }

        const insertPayload = {
            id: payload.applicationId || crypto.randomUUID(),
            program_id: payload.programId,
            applicant_id: payload.applicantId,
            full_name: payload.fullName,
            email: payload.email,
            country: payload.country,
            timezone: payload.timezone,
            education: payload.education,
            experience: payload.experience,
            skills: payload.skills,
            motivation: payload.motivation,
            github: payload.github ?? '',
            linkedin: payload.linkedin ?? '',
            portfolio: payload.portfolio ?? '',
            availability: payload.availability,
            answers: payload.answers ?? {},
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString()
        };

        const { data, error } = await admin.from('applications').insert(insertPayload).select().single();
        if (error) {
            throw error;
        }

        return mapDbApplication(data);
    }, async () => {
        const data = await readStore();
        const duplicate = data.applications.find(
            (application) =>
                application.programId === payload.programId &&
                application.applicantId === payload.applicantId
        );

        if (duplicate) {
            return duplicate;
        }

        const application: Application = {
            id: payload.applicationId || uuidv4(),
            ...payload,
            status: 'SUBMITTED',
            submittedAt: new Date().toISOString()
        };

        data.applications.push(application);
        await saveStore(data);
        return application;
    });
}

export async function setApplicationStatus(applicationId: string, status: Application['status']) {
    return withSupabaseFallback('setApplicationStatus', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.from('applications').update({ status }).eq('id', applicationId).select().single();
        if (error) {
            throw error;
        }

        return mapDbApplication(data);
    }, async () => {
        const data = await readStore();
        const application = data.applications.find((item) => item.id === applicationId);
        if (!application) return null;
        application.status = status;
        await saveStore(data);
        return application;
    });
}

export async function createProgramRecord(input: Omit<Program, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'currentParticipants'> & { slug?: string }) {
    return withSupabaseFallback('createProgramRecord', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const title = input.title.trim();
        const slug = input.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const record = {
            slug,
            title,
            category: input.category,
            short_description: input.shortDescription,
            description: input.description,
            duration: input.duration,
            difficulty: input.difficulty,
            delivery_mode: input.deliveryMode,
            eligibility: input.eligibility,
            start_date: input.startDate,
            end_date: input.endDate,
            application_deadline: input.applicationDeadline,
            available_seats: input.availableSeats || 20,
            current_participants: 0,
            status: input.status,
            skills: input.skills || [],
            learning_outcomes: input.learningOutcomes || [],
            requirements: input.requirements || [],
            application_questions: input.applicationQuestions || [],
            community_url: input.communityUrl ?? null,
            community_platform: input.communityPlatform ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await admin.from('programs').insert(record).select().single();
        if (error) {
            throw error;
        }

        return mapDbProgram(data);
    }, async () => {
        const data = await readStore();
        const title = input.title.trim();
        const slug = input.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const program: Program = {
            ...input,
            id: uuidv4(),
            slug,
            currentParticipants: 0,
            availableSeats: input.availableSeats || 20,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.programs.push(program);
        await saveStore(data);
        return program;
    });
}

export async function getEnrollmentForParticipant(programId: string, participantId: string) {
    return withSupabaseFallback('getEnrollmentForParticipant', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.from('enrollments').select('*').eq('program_id', programId).eq('participant_id', participantId).maybeSingle();
        if (error) {
            throw error;
        }

        return data ? mapDbEnrollment(data) : null;
    }, async () => {
        const data = await readStore();
        return data.enrollments.find((enrollment) => enrollment.programId === programId && enrollment.participantId === participantId) || null;
    });
}

export async function canAccessProgramCommunity(programId: string, participantId: string) {
    return withSupabaseFallback('canAccessProgramCommunity', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const [enrollmentResult, applicationResult] = await Promise.all([
            admin.from('enrollments').select('*').eq('program_id', programId).eq('participant_id', participantId).maybeSingle(),
            admin.from('applications').select('*').eq('program_id', programId).eq('applicant_id', participantId).maybeSingle()
        ]);

        if (enrollmentResult.error) {
            throw enrollmentResult.error;
        }

        if (applicationResult.error) {
            throw applicationResult.error;
        }

        const enrollment = enrollmentResult.data ? mapDbEnrollment(enrollmentResult.data) : null;
        const application = applicationResult.data ? mapDbApplication(applicationResult.data) : null;

        const hasAllowedEnrollment = enrollment ? ['ENROLLED', 'ACTIVE', 'COMPLETED'].includes(enrollment.status) : false;
        const hasAcceptedApplication = application ? ['ACCEPTED', 'SHORTLISTED'].includes(application.status) : false;

        return hasAllowedEnrollment || hasAcceptedApplication;
    }, async () => {
        const data = await readStore();
        const enrollment = data.enrollments.find(
            (item) => item.programId === programId && item.participantId === participantId
        );
        const application = data.applications.find(
            (item) => item.programId === programId && item.applicantId === participantId
        );

        const hasAllowedEnrollment = enrollment ? ['ENROLLED', 'ACTIVE', 'COMPLETED'].includes(enrollment.status) : false;
        const hasAcceptedApplication = application ? ['ACCEPTED', 'SHORTLISTED'].includes(application.status) : false;

        return hasAllowedEnrollment || hasAcceptedApplication;
    });
}

export async function enrollParticipant(programId: string, participantId: string) {
    return withSupabaseFallback('enrollParticipant', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const existing = await admin.from('enrollments').select('*').eq('program_id', programId).eq('participant_id', participantId).maybeSingle();
        if (existing.error) {
            throw existing.error;
        }

        if (existing.data) {
            return mapDbEnrollment(existing.data);
        }

        const { data, error } = await admin.from('enrollments').insert({
            program_id: programId,
            participant_id: participantId,
            status: 'ENROLLED',
            joined_at: new Date().toISOString()
        }).select().single();

        if (error) {
            throw error;
        }

        return mapDbEnrollment(data);
    }, async () => {
        const data = await readStore();
        const existing = await getEnrollmentForParticipant(programId, participantId);
        if (existing) return existing;

        const enrollment: Enrollment = {
            id: uuidv4(),
            programId,
            participantId,
            status: 'ENROLLED',
            joinedAt: new Date().toISOString()
        };

        data.enrollments.push(enrollment);
        await saveStore(data);
        return enrollment;
    });
}

export async function markParticipantCompleted(programId: string, participantId: string) {
    return withSupabaseFallback('markParticipantCompleted', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin
            .from('enrollments')
            .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
            .eq('program_id', programId)
            .eq('participant_id', participantId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return mapDbEnrollment(data);
    }, async () => {
        const data = await readStore();
        const enrollment = data.enrollments.find(
            (item) => item.programId === programId && item.participantId === participantId
        );

        if (!enrollment) return null;

        enrollment.status = 'COMPLETED';
        enrollment.completedAt = new Date().toISOString();
        await saveStore(data);
        return enrollment;
    });
}

export async function createCertificateForProgram(programId: string, participantId: string) {
    return withSupabaseFallback('createCertificateForProgram', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const [programResult, participantResult, enrollmentResult] = await Promise.all([
            admin.from('programs').select('*').eq('id', programId).maybeSingle(),
            admin.from('profiles').select('*').eq('id', participantId).maybeSingle(),
            admin.from('enrollments').select('*').eq('program_id', programId).eq('participant_id', participantId).maybeSingle()
        ]);

        if (programResult.error) throw programResult.error;
        if (participantResult.error) throw participantResult.error;
        if (enrollmentResult.error) throw enrollmentResult.error;

        const program = programResult.data ? mapDbProgram(programResult.data) : null;
        const participant = participantResult.data ? mapDbProfile(participantResult.data) : null;
        const enrollment = enrollmentResult.data ? mapDbEnrollment(enrollmentResult.data) : null;

        if (!program || !participant || !enrollment || enrollment.status !== 'COMPLETED') {
            return null;
        }

        const verificationCode = generateVerificationCode();
        const certificateNumber = generateCertificateNumber();
        const certificateRecord = {
            certificate_number: certificateNumber,
            verification_code: verificationCode,
            participant_id: participantId,
            program_id: programId,
            cohort_id: null,
            certificate_title: 'Certificate of Completion',
            issued_at: new Date().toISOString(),
            completed_at: enrollment.completedAt || new Date().toISOString(),
            status: 'ACTIVE',
            pdf_path: `/certificates/${participant.fullName.toLowerCase().replace(/\s+/g, '-')}-${verificationCode.toLowerCase()}.pdf`,
            verification_url: `${appUrl}/certificates/verify/${verificationCode}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await admin.from('certificates').insert(certificateRecord).select().single();
        if (error) {
            throw error;
        }

        return mapDbCertificate(data);
    }, async () => {
        const data = await readStore();
        const program = data.programs.find((item) => item.id === programId);
        const participant = data.profiles.find((item) => item.id === participantId);
        const enrollment = data.enrollments.find((item) => item.programId === programId && item.participantId === participantId);

        if (!program || !participant || !enrollment || enrollment.status !== 'COMPLETED') {
            return null;
        }

        const verificationCode = generateVerificationCode();
        const certificateNumber = generateCertificateNumber();
        const certificate: Certificate = {
            id: uuidv4(),
            certificateNumber,
            verificationCode,
            participantId,
            programId,
            cohortId: undefined,
            certificateTitle: 'Certificate of Completion',
            issueDate: new Date().toISOString(),
            completedAt: enrollment.completedAt || new Date().toISOString(),
            status: 'ACTIVE',
            pdfPath: `/certificates/${participant.fullName.toLowerCase().replace(/\s+/g, '-')}-${verificationCode.toLowerCase()}.pdf`,
            verificationUrl: `${appUrl}/certificates/verify/${verificationCode}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.certificates.push(certificate);
        await saveStore(data);
        return certificate;
    });
}

export async function verifyCertificateByCode(code: string) {
    return withSupabaseFallback('verifyCertificateByCode', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.rpc('get_public_certificate_by_code', { _verification_code: code.trim() });
        if (error) {
            throw error;
        }

        const row = Array.isArray(data) ? data[0] : null;
        if (!row) {
            const { data: revokedData, error: revokedError } = await admin.from('certificates').select('*').eq('verification_code', code.trim()).maybeSingle();
            if (revokedError) {
                throw revokedError;
            }

            if (revokedData) {
                return { found: true, certificate: mapDbCertificate(revokedData), revoked: revokedData.status === 'REVOKED' };
            }

            return { found: false, certificate: null };
        }

        return {
            found: true, certificate: mapDbCertificate({
                id: row.id,
                certificate_number: row.certificate_number,
                verification_code: row.verification_code,
                participant_id: row.participant_id,
                program_id: row.program_id,
                certificate_title: row.certificate_title,
                issued_at: row.issue_date,
                completed_at: row.completion_date,
                status: 'ACTIVE',
                pdf_path: '',
                verification_url: '',
                created_at: row.issue_date,
                updated_at: row.issue_date
            }), revoked: false
        };
    }, async () => {
        const data = await readStore();
        const certificate = data.certificates.find((item) => item.verificationCode === code.trim());
        if (!certificate) return { found: false, certificate: null };

        if (certificate.status === 'REVOKED') {
            return { found: true, certificate, revoked: true };
        }

        return { found: true, certificate, revoked: false };
    });
}

export async function revokeCertificate(certificateId: string, reason: string, revokedBy: string) {
    return withSupabaseFallback('revokeCertificate', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin
            .from('certificates')
            .update({
                status: 'REVOKED',
                revoked_at: new Date().toISOString(),
                revocation_reason: reason,
                revoked_by: revokedBy,
                updated_at: new Date().toISOString()
            })
            .eq('id', certificateId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return mapDbCertificate(data);
    }, async () => {
        const data = await readStore();
        const certificate = data.certificates.find((item) => item.id === certificateId);
        if (!certificate) return null;

        certificate.status = 'REVOKED';
        certificate.revokedAt = new Date().toISOString();
        certificate.revocationReason = reason;
        certificate.revokedBy = revokedBy;
        certificate.updatedAt = new Date().toISOString();
        await saveStore(data);
        return certificate;
    });
}

export async function getAdminStats() {
    return withSupabaseFallback('getAdminStats', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const [profilesResult, applicationsResult, programsResult, enrollmentsResult, certificatesResult] = await Promise.all([
            admin.from('profiles').select('id', { count: 'exact' }),
            admin.from('applications').select('id', { count: 'exact' }),
            admin.from('programs').select('id', { count: 'exact' }).in('status', ['OPEN', 'IN_PROGRESS']),
            admin.from('enrollments').select('id', { count: 'exact' }).in('status', ['ENROLLED', 'ACTIVE']),
            admin.from('certificates').select('id', { count: 'exact' }).in('status', ['ACTIVE', 'REVOKED'])
        ]);

        const totalUsers = profilesResult.count ?? 0;
        const totalApplicants = applicationsResult.count ?? 0;
        const activePrograms = programsResult.count ?? 0;
        const activeParticipants = enrollmentsResult.count ?? 0;
        const certificatesIssued = certificatesResult.count ?? 0;

        const { count: openApplicationsCount } = await admin.from('applications').select('id', { count: 'exact' }).in('status', ['SUBMITTED', 'UNDER_REVIEW']);
        const { count: acceptedParticipantsCount } = await admin.from('applications').select('id', { count: 'exact' }).eq('status', 'ACCEPTED');
        const { count: completedParticipantsCount } = await admin.from('enrollments').select('id', { count: 'exact' }).eq('status', 'COMPLETED');

        return {
            totalUsers,
            totalApplicants,
            activePrograms,
            openApplications: openApplicationsCount ?? 0,
            acceptedParticipants: acceptedParticipantsCount ?? 0,
            activeParticipants,
            completedParticipants: completedParticipantsCount ?? 0,
            certificatesIssued
        };
    }, async () => {
        const data = await readStore();
        return {
            totalUsers: data.profiles.length,
            totalApplicants: data.applications.length,
            activePrograms: data.programs.filter((program) => program.status === 'OPEN' || program.status === 'IN_PROGRESS').length,
            openApplications: data.applications.filter((application) => application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW').length,
            acceptedParticipants: data.applications.filter((application) => application.status === 'ACCEPTED').length,
            activeParticipants: data.enrollments.filter((enrollment) => enrollment.status === 'ENROLLED' || enrollment.status === 'ACTIVE').length,
            completedParticipants: data.enrollments.filter((enrollment) => enrollment.status === 'COMPLETED').length,
            certificatesIssued: data.certificates.filter((certificate) => certificate.status === 'ACTIVE' || certificate.status === 'REVOKED').length
        };
    });
}

export async function getUserById(userId: string) {
    return withSupabaseFallback('getUserById', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { data, error } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (error) {
            throw error;
        }

        return data ? mapDbProfile(data) : null;
    }, async () => {
        const data = await readStore();
        return data.profiles.find((profile) => profile.id === userId) || null;
    });
}

export async function addAdminNote(applicationId: string, note: string) {
    return withSupabaseFallback('addAdminNote', async () => {
        const admin = getSupabaseAdminClient();
        if (!admin) {
            throw new Error('Supabase admin client is unavailable.');
        }

        const { error } = await admin.from('admin_notes').insert({
            application_id: applicationId,
            note,
            created_at: new Date().toISOString()
        });

        if (error) {
            throw error;
        }

        return true;
    }, async () => {
        const data = await readStore();
        data.adminNotes[applicationId] = note;
        await saveStore(data);
        return true;
    });
}

export async function seedDemoData() {
    await saveStore(defaultData);
}
