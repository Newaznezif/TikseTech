import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { getSessionUser, hasRequiredRole } from "@/lib/session";

export default async function AdminWorkspaceLayout({ children }: { children: React.ReactNode }) {
    const session = await getSessionUser();
    if (!session) redirect("/admin/login");
    if (!hasRequiredRole(session, ["ADMIN", "SUPER_ADMIN"])) redirect("/dashboard");

    return (
        <div className="min-h-screen bg-[#f5f7fb] lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
            <aside className="relative z-20 flex flex-col bg-[#0a1628] text-white lg:sticky lg:top-0 lg:h-screen">
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
                    <Image src="/logo.png" alt="TIKSE TECH" width={42} height={42} className="h-10 w-10 rounded-xl bg-white p-1 object-contain" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black tracking-tight">TIKSE TECH</p>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300">Control center</p>
                    </div>
                </div>

                <div className="hidden px-5 pb-3 pt-6 lg:block">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
                </div>
                <AdminNavigation />

                <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="truncate text-sm font-bold text-white">{session.name || "Administrator"}</p>
                        <p className="mt-1 truncate text-xs text-slate-400">{session.email}</p>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Authorized</span>
                            <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white">Public site ↗</Link>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="min-w-0">
                <header className="sticky top-0 z-10 hidden h-[68px] items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur lg:flex">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">TIKSE TECH / Operations</p>
                        <p className="text-sm font-bold text-slate-900">Manager workspace</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-slate-600">Administrator session active</span>
                    </div>
                </header>
                <div className="border-b border-slate-200 bg-[#0a1628] px-4 py-3 text-white lg:hidden">
                    <div className="flex items-center justify-between gap-3">
                        <div><p className="text-xs font-bold">{session.name || "Administrator"}</p><p className="text-[10px] text-slate-400">{session.role} · Authorized workspace</p></div>
                        <Link href="/" className="text-xs font-semibold text-cyan-200">Public site ↗</Link>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}
