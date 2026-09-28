import { describe, expect, it } from 'vitest';

import { submitApplication } from '@/actions/applications';
import { hasRequiredRole } from '@/lib/session';
import { canAccessProgramCommunity, createApplication, createProgramRecord, createUserProfile, enrollParticipant, markParticipantCompleted, createCertificateForProgram, readStore, revokeCertificate, setApplicationStatus, verifyCertificateByCode } from '@/lib/store';

describe('TIKSE TECH core workflow', () => {
    it('enforces admin role checks for privileged areas', () => {
        const participantSession = { email: 'participant@example.com', role: 'PARTICIPANT', profileId: 'profile-123', name: 'Participant User' };
        const adminSession = { email: 'admin@tiksetech.dev', role: 'ADMIN', profileId: 'profile-admin', name: 'Admin User' };

        expect(hasRequiredRole(null, ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
        expect(hasRequiredRole(participantSession, ['ADMIN', 'SUPER_ADMIN'])).toBe(false);
        expect(hasRequiredRole(adminSession, ['ADMIN', 'SUPER_ADMIN'])).toBe(true);
    });

    it('rejects an application submitted without a valid email', async () => {
        const formData = new FormData();
        formData.set('programId', 'program-demo');
        formData.set('applicantId', 'profile-123');
        formData.set('fullName', 'Test Applicant');
        formData.set('email', '');
        formData.set('country', 'Kenya');
        formData.set('timezone', 'UTC');
        formData.set('education', 'Bachelor of Science');
        formData.set('experience', '2 years');
        formData.set('skills', 'Security');
        formData.set('motivation', 'I want to build practical security experience and contribute to the program.');
        formData.set('availability', '10 hours/week');
        formData.set('questionOne', 'I want to improve my technical foundations.');

        await expect(submitApplication(formData)).rejects.toThrow('Please enter a valid email address before submitting.');
    });

    it('registers a participant and prevents duplicate applications to the same program', async () => {
        const email = `participant-${Math.random().toString(36).slice(2)}@example.com`;
        const profile = await createUserProfile({
            id: `profile-${Math.random().toString(36).slice(2)}`,
            fullName: 'Test Participant',
            email,
            role: 'PARTICIPANT',
            country: 'Kenya',
            timezone: 'UTC',
            skills: ['Security', 'Problem solving']
        });

        const state = await readStore();
        const programId = state.programs[0].id;

        const firstApplication = await createApplication({
            programId,
            applicantId: profile.id,
            fullName: profile.fullName,
            email: profile.email,
            country: 'Kenya',
            timezone: 'UTC',
            education: 'Bachelor of Science',
            experience: '2 years of self-study',
            skills: ['Security'],
            motivation: 'I am excited to build practical cybersecurity experience.',
            github: '',
            linkedin: '',
            portfolio: '',
            availability: '10 hours/week',
            answers: { questionOne: 'I want to improve my skills.' }
        });

        const duplicateApplication = await createApplication({
            programId,
            applicantId: profile.id,
            fullName: profile.fullName,
            email: profile.email,
            country: 'Kenya',
            timezone: 'UTC',
            education: 'Bachelor of Science',
            experience: '2 years of self-study',
            skills: ['Security'],
            motivation: 'I am excited to build practical cybersecurity experience.',
            github: '',
            linkedin: '',
            portfolio: '',
            availability: '10 hours/week',
            answers: { questionOne: 'I want to improve my skills.' }
        });

        expect(firstApplication.id).toBe(duplicateApplication.id);
        expect(firstApplication.status).toBe('SUBMITTED');
    });

    it('issues and verifies a certificate, then revokes it', async () => {
        const email = `certificate-${Math.random().toString(36).slice(2)}@example.com`;
        const profile = await createUserProfile({
            id: `profile-${Math.random().toString(36).slice(2)}`,
            fullName: 'Certificate User',
            email,
            role: 'PARTICIPANT',
            country: 'Nigeria',
            timezone: 'UTC',
            skills: ['Cloud']
        });

        const state = await readStore();
        const programId = state.programs[1].id;

        await enrollParticipant(programId, profile.id);
        await markParticipantCompleted(programId, profile.id);

        const certificate = await createCertificateForProgram(programId, profile.id);
        expect(certificate).not.toBeNull();
        expect(certificate?.verificationCode).toMatch(/^TT-/);

        const verified = await verifyCertificateByCode(certificate!.verificationCode);
        expect(verified.found).toBe(true);
        expect(verified.revoked).toBe(false);

        await revokeCertificate(certificate!.id, 'Administrative error', 'admin-user');

        const revoked = await verifyCertificateByCode(certificate!.verificationCode);
        expect(revoked.revoked).toBe(true);
    });

    it('allows community access only after acceptance or enrollment and stores the community URL', async () => {
        const email = `community-${Math.random().toString(36).slice(2)}@example.com`;
        const profile = await createUserProfile({
            id: `profile-${Math.random().toString(36).slice(2)}`,
            fullName: 'Community User',
            email,
            role: 'PARTICIPANT',
            country: 'Ghana',
            timezone: 'UTC',
            skills: ['Communication']
        });

        const state = await readStore();
        const programId = state.programs[0].id;

        const program = await createProgramRecord({
            title: 'Community Access Program',
            category: 'Community',
            shortDescription: 'A program that teaches how to work in a community-driven environment.',
            description: 'Participants join a dedicated social and mentorship platform during the onboarding phase.',
            duration: '6 Weeks',
            difficulty: 'Beginner',
            deliveryMode: 'REMOTE',
            eligibility: 'WORLDWIDE',
            startDate: '2026-11-01',
            endDate: '2026-12-15',
            applicationDeadline: '2026-10-30',
            availableSeats: 25,
            status: 'OPEN',
            skills: ['Communication', 'Mentorship'],
            learningOutcomes: ['Understand the community workflow'],
            requirements: ['A stable internet connection'],
            applicationQuestions: ['Why join this group?'],
            communityUrl: 'https://example.com/community/alpha'
        });

        expect(program.communityUrl).toBe('https://example.com/community/alpha');

        const application = await createApplication({
            programId,
            applicantId: profile.id,
            fullName: profile.fullName,
            email: profile.email,
            country: profile.country,
            timezone: profile.timezone,
            education: 'Bachelor of Arts',
            experience: '2 years of project work',
            skills: ['Communication'],
            motivation: 'I want to join a supportive learning community and collaborate with peers.',
            github: '',
            linkedin: '',
            portfolio: '',
            availability: '8 hours/week',
            answers: { questionOne: 'I enjoy structured mentorship.' }
        });

        expect(await canAccessProgramCommunity(programId, profile.id)).toBe(false);

        await setApplicationStatus(application.id, 'ACCEPTED');
        expect(await canAccessProgramCommunity(programId, profile.id)).toBe(true);

        await enrollParticipant(programId, profile.id);
        expect(await canAccessProgramCommunity(programId, profile.id)).toBe(true);
    });
});
