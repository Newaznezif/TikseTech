import { Globe2 } from "lucide-react";
import { listPrograms } from "@/lib/store";
import { ProgramBrowser } from "@/components/programs/program-browser";

export const metadata = {
    title: "Programs | TIKSE TECH",
    description: "Browse remote technology programs and practical learning opportunities open to global participants."
};

export default async function ProgramsPage() {
    const allPrograms = await listPrograms();
    const programs = allPrograms.filter(program => !["DRAFT", "ARCHIVED"].includes(program.status));

    return (
        <main className="container-shell py-10 sm:py-14">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0a1628] px-6 py-10 text-white sm:px-10 sm:py-14">
                <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="relative max-w-3xl">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Learning pathways</p>
                    <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Find the program that moves you forward.</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Explore practical technology programs, build skills through guided work, and connect with a global learning community.</p>
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"><Globe2 className="h-4 w-4 text-cyan-300" aria-hidden="true" /> Remote · Worldwide</div>
                </div>
            </section>
            <ProgramBrowser programs={programs} />
        </main>
    );
}
