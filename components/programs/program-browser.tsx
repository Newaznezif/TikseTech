"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarRange, Search, Users } from "lucide-react";
import type { Program } from "@/lib/types";

export function ProgramBrowser({ programs }: { programs: Program[] }) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("ALL");
    const [status, setStatus] = useState("AVAILABLE");

    const categories = useMemo(() => [...new Set(programs.map(program => program.category).filter(Boolean))].sort(), [programs]);
    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return programs.filter(program => {
            const searchable = [program.title, program.category, program.shortDescription, ...program.skills].join(" ").toLowerCase();
            const matchesSearch = !term || searchable.includes(term);
            const matchesCategory = category === "ALL" || program.category === category;
            const matchesStatus = status === "ALL" || (status === "AVAILABLE" ? ["OPEN", "IN_PROGRESS"].includes(program.status) : program.status === status);
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [programs, search, category, status]);

    return (
        <>
            <section className="mt-9 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_190px]">
                    <label className="relative block">
                        <span className="sr-only">Search programs</span>
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                        <input value={search} onChange={event => setSearch(event.target.value)} className="field-control pl-11" placeholder="Search programs, skills, or topics..." />
                    </label>
                    <label><span className="sr-only">Filter by category</span><select value={category} onChange={event => setCategory(event.target.value)} className="field-control"><option value="ALL">All categories</option>{categories.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
                    <label><span className="sr-only">Filter by availability</span><select value={status} onChange={event => setStatus(event.target.value)} className="field-control"><option value="AVAILABLE">Available now</option><option value="ALL">All published</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="CLOSED">Closed</option></select></label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-600"><strong className="text-slate-950">{visible.length}</strong> of {programs.length} published programs</p>
                    {(search || category !== "ALL" || status !== "AVAILABLE") ? <button type="button" onClick={() => { setSearch(""); setCategory("ALL"); setStatus("AVAILABLE"); }} className="text-sm font-semibold text-blue-700 hover:underline">Clear filters</button> : <span className="text-xs text-slate-400">Browse opportunities open to global participants</span>}
                </div>
            </section>

            {visible.length ? (
                <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                    {visible.map(program => (
                        <article key={program.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                            <div className="h-1.5 bg-gradient-to-r from-blue-700 via-cyan-500 to-teal-400" />
                            <div className="flex flex-1 flex-col p-6">
                                <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-800">{program.category}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${program.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : program.status === "IN_PROGRESS" ? "bg-cyan-50 text-cyan-800" : "bg-slate-100 text-slate-600"}`}>{program.status.replaceAll("_", " ")}</span></div>
                                <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950">{program.title}</h2>
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{program.shortDescription}</p>
                                <div className="mt-5 space-y-2 text-xs text-slate-500">
                                    <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-blue-600" aria-hidden="true" /> {program.duration} · {program.difficulty}</div>
                                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" aria-hidden="true" /> {program.availableSeats} seats available</div>
                                </div>
                                {program.skills.length ? <div className="mt-5 flex flex-wrap gap-1.5">{program.skills.slice(0,3).map(skill=><span key={skill} className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">{skill}</span>)}</div> : null}
                                <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-5 mt-6"><span className="text-[11px] text-slate-400">Deadline · {program.applicationDeadline}</span><Link href={`/programs/${program.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 group-hover:text-blue-900">Explore <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                    <p className="text-lg font-bold text-slate-800">No matching programs</p>
                    <p className="mt-2 text-sm text-slate-500">Try a different search term or clear your filters.</p>
                    <button type="button" onClick={() => { setSearch(""); setCategory("ALL"); setStatus("AVAILABLE"); }} className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Reset filters</button>
                </div>
            )}
        </>
    );
}
