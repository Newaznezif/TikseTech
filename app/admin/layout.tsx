import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, hasRequiredRole } from "@/lib/session";

const navigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/reviews", label: "Assignments" },
  { href: "/admin/challenges", label: "Challenges" },
  { href: "/admin/certificates", label: "Certificates" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!hasRequiredRole(session, ["ADMIN", "SUPER_ADMIN"])) redirect("/dashboard");

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="container-shell flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="TIKSE TECH" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-900">Manager workspace</p>
              <p className="text-[11px] text-slate-500">Operations and participant management</p>
            </div>
          </div>
          <nav aria-label="Manager navigation" className="flex max-w-full gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden text-right text-xs text-slate-500 xl:block">
            <p className="font-semibold text-slate-800">{session.name}</p>
            <p>{session.role}</p>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
