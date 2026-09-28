import { z } from 'zod';

export const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long')
});

export const applicationSchema = z.object({
    fullName: z.string().trim().min(2, 'Full name is required.'),
    email: z.string().trim().min(1, 'Please enter a valid email address before submitting.').email('Please enter a valid email address before submitting.'),
    country: z.string().trim().min(2, 'Country is required.'),
    timezone: z.string().trim().min(2, 'Timezone is required.'),
    education: z.string().trim().min(2, 'Education is required.'),
    experience: z.string().trim().min(5, 'Experience is required.'),
    skills: z.union([z.string().min(1), z.array(z.string()).min(1)]).transform((value) => Array.isArray(value) ? value.join(', ') : value),
    motivation: z.string().trim().min(20, 'Please share a bit more about your motivation.'),
    availability: z.string().trim().min(2, 'Availability is required.'),
    github: z.string().optional().or(z.literal('')),
    linkedin: z.string().optional().or(z.literal('')),
    portfolio: z.string().optional().or(z.literal(''))
});

export const programSchema = z.object({
    title: z.string().min(3),
    category: z.string().min(2),
    shortDescription: z.string().min(10),
    description: z.string().min(20),
    duration: z.string().min(2),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    applicationDeadline: z.string().min(1),
    availableSeats: z.coerce.number().min(1),
    status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']),
    communityUrl: z.union([z.string().trim().url('Community URL must be a valid URL'), z.literal('')]).optional()
});
