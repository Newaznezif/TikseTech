"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Award, BookOpenCheck, ClipboardList, FileCheck2,
    LayoutDashboard, Users
} from "lucide-react";

const items = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/participants", label: "Participants", icon: Users },
    { href: "/admin/applications", label: "Applications", icon: ClipboardList },
    { href: "/admin/reviews", label: "Assignment reviews", icon: BookOpenCheck },
    { href: "/admin/challenges", label: "Challenges", icon: FileCheck2 },
    { href: "/admin/certificates", label: "Certificates", icon: Award }
];

export function AdminNavigation() {
    const pathname = usePathname();

    return (
        <>
            <nav aria-label="Manager navigation" className="hidden h-full flex-col gap-1 lg:flex">
                {items.map(({ href, label, icon: Icon }) => {
                    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                    return (
                        <Link key={href} href={href} aria-current={active ? "page" : undefined}
                            className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                            <Icon className={`h-[18px] w-[18px] ${active ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-200"}`} aria-hidden="true" />
                            {label}
                        </Link>
                    );
                })}
            </nav>
            <nav aria-label="Manager navigation" className="flex gap-1 overflow-x-auto px-4 py-3 lg:hidden">
                {items.map(({ href, label, icon: Icon }) => {
                    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                    return (
                        <Link key={href} href={href} aria-current={active ? "page" : undefined}
                            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${active ? "bg-cyan-300/10 text-cyan-100" : "text-slate-300 hover:bg-white/5"}`}>
                            <Icon className="h-4 w-4" aria-hidden="true" />{label}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
