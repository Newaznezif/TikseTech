import { SiteHeaderClient } from "@/components/site-header-client";
import { getSessionUser, hasRequiredRole } from "@/lib/session";

const navItems = [
    { href: "/about", label: "About" },
    { href: "/programs", label: "Programs" },
    { href: "/opportunities", label: "Opportunities" },
    { href: "/community", label: "Community" },
    { href: "/certificates/verify", label: "Verify certificate" }
];

export async function SiteHeader() {
    const session = await getSessionUser();
    const dashboardHref = hasRequiredRole(session, ["ADMIN", "SUPER_ADMIN"]) ? "/admin" : "/dashboard";

    return (
        <SiteHeaderClient
            navItems={navItems}
            session={session ? { name: session.name, email: session.email, role: session.role } : null}
            dashboardHref={dashboardHref}
        />
    );
}
