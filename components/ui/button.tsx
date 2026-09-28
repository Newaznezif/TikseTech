import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = ({
    variant = 'primary',
    size = 'md'
}: {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
} = {}) => {
    const base = 'inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-slate-900 text-white hover:bg-slate-800',
        outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100'
    };
    const sizes = {
        sm: 'h-10 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base'
    };

    return cn(base, variants[variant], sizes[size]);
};

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; size?: 'sm' | 'md' | 'lg' }) {
    return <button className={cn(buttonVariants({ variant: props.variant, size: props.size }), className)} {...props} />;
}

export { buttonVariants };
