"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutUser } from "@/actions/auth";

type Props = { name: string; email: string; role: string; dashboardHref: string };

export function AccountMenu({ name, email, role, dashboardHref }: Props) {
  const [open, setOpen] = useState(false);
  const initials = name.trim().split(/\\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-800">{initials}</span>
        <span className="hidden max-w-32 sm:block"><span className="block truncate text-sm font-semibold text-slate-900">{name}</span><span className="block text-[10px] uppercase tracking-wide text-slate-500">{role.replaceAll("_", " ")}</span></span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-slate-500"><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open ? <>
        <button aria-label="Close account menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-3"><p className="truncate text-sm font-semibold text-slate-900">{name}</p><p className="truncate text-xs text-slate-500">{email}</p></div>
          <Link role="menuitem" onClick={() => setOpen(false)} href={dashboardHref} className="mt-2 block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">My Dashboard</Link>
          <Link role="menuitem" onClick={() => setOpen(false)} href="/profile" className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">My Profile</Link>
          <Link role="menuitem" onClick={() => setOpen(false)} href="/settings" className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Settings</Link>
          {role === "ADMIN" || role === "SUPER_ADMIN" ? <Link role="menuitem" onClick={() => setOpen(false)} href="/admin" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">Manager workspace</Link> : null}
          <form action={logoutUser} className="mt-2 border-t border-slate-100 pt-2"><button type="submit" className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50">Sign out</button></form>
        </div>
      </> : null}
    </div>
  );
}
