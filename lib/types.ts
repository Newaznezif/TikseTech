export type Role = 'PARTICIPANT' | 'MENTOR' | 'ADMIN' | 'SUPER_ADMIN';
export type ProgramStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type ApplicationStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'ACCEPTED' | 'WAITLISTED' | 'REJECTED' | 'WITHDRAWN';
export type EnrollmentStatus = 'ENROLLED' | 'ACTIVE' | 'COMPLETED' | 'DID_NOT_COMPLETE';
export type CertificateStatus = 'ACTIVE' | 'REVOKED';

export interface Program {
    id: string;
    slug: string;
    title: string;
    category: string;
    shortDescription: string;
    description: string;
    duration: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    deliveryMode: 'REMOTE';
    eligibility: 'WORLDWIDE';
    startDate: string;
    endDate: string;
    applicationDeadline: string;
    availableSeats: number;
    currentParticipants: number;
    status: ProgramStatus;
    skills: string[];
    learningOutcomes: string[];
    requirements: string[];
    applicationQuestions: string[];
    communityPlatform?: 'DISCORD' | 'WHATSAPP' | 'TELEGRAM' | 'OTHER';
    communityUrl?: string;
    communityGroupId?: string;
    cohortChannelId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfile {
    id: string;
    authUserId: string;
    fullName: string;
    username: string;
    email: string;
    role: Role;
    country: string;
    timezone: string;
    profilePhoto?: string;
    shortBio?: string;
    skills: string[];
    education?: string;
    experience?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
    website?: string;
    createdAt: string;
}

export interface Application {
    id: string;
    programId: string;
    applicantId: string;
    fullName: string;
    email: string;
    country: string;
    timezone: string;
    education: string;
    experience: string;
    skills: string[];
    motivation: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
    availability: string;
    answers: Record<string, string>;
    status: ApplicationStatus;
    submittedAt: string;
}

export interface Enrollment {
    id: string;
    programId: string;
    participantId: string;
    cohortName?: string;
    status: EnrollmentStatus;
    joinedAt: string;
    completedAt?: string;
}

export interface Certificate {
    id: string;
    certificateNumber: string;
    verificationCode: string;
    participantId: string;
    programId: string;
    cohortId?: string;
    certificateTitle: string;
    issueDate: string;
    completedAt: string;
    status: CertificateStatus;
    pdfPath: string;
    verificationUrl: string;
    revokedAt?: string;
    revocationReason?: string;
    revokedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AppData {
    programs: Program[];
    profiles: UserProfile[];
    applications: Application[];
    enrollments: Enrollment[];
    certificates: Certificate[];
    adminNotes: Record<string, string>;
}
