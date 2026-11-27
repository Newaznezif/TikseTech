"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ParticipantRow = {
  id: string;
  name: string;
  email: string;
  country: string;
  participantNumber: string;
  accountStatus: string;
  joinedAt: string;
  programs: string[];
  applicationStatuses: string[];
  enrollmentStatuses: string[];
  assignmentsTotal: number;
  assignmentsAccepted: number;
  certificates: number;
  completionStatus: string;
  overallStatus: string;
};

const filters = ["ALL", "REGISTERED", "APPLICATION_PENDING", "ENROLLED", "ACTIVE", "COMPLETED", "NOT_ENROLLED"] as const;

function statusStyle(status: string) {
  if (["ACTIVE", "COMPLETED", "ACCEPTED", "ENROLLED"].includes(status)) return "bg-emerald-50 text-emerald-700";
  if (["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "WAITLISTED", "REGISTERED"].includes(status)) return "bg-amber-50 text-amber-700";
  if (["REJECTED", "DID_NOT_COMPLETE", "NOT_ENROLLED"].includes(status)) return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

function readable(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\\b\\w/g, (letter) => letter.toUpperCase());
}

export function ParticipantsTable({ participants }: { participants: ParticipantRow[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return participants.filter((person) => {
      const matchesSearch = !term || [person.name, person.email, person.country, ...person.programs].some((value) => value.toLowerCase().includes(term));
      const matchesFilter = filter === "ALL" || (
        filter === "REGISTERED" ? person.overallStatus === "REGISTERED" :
        filter === "APPLICATION_PENDING" ? person.applicationStatuses.some((status) => ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "WAITLISTED"].includes(status)) && person.enrollmentStatuses.length === 0 :
        filter === "ENROLLED" ? person.enrollmentStatuses.includes("ENROLLED") :
        filter === "ACTIVE" ? person.enrollmentStatuses.includes("ACTIVE") :
        filter === "COMPLETED" ? person.enrollmentStatuses.includes("COMPLETED") || person.completionStatus === "COMPLETED" :
        filter === "NOT_ENROLLED" ? person.enrollmentStatuses.length === 0 && person.applicationStatuses.some((status) => ["REJECTED", "WITHDRAWN"].includes(status)) : true
      );
      return matchesSearch && matchesFilter;
    });
  }, [participants, search, filter]);

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, country, or program..." aria-label="Search participants" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <select value={filter} onChange={(event) => setFilter(event.target.value as (typeof filters)[number])} aria-label="Filter participants by status" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500">
          {filters.map((item) => <option key={item} value={item}>{item === "ALL" ? "All participants" : readable(item)}</option>)}
        </select>
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">{visible.length} of {participants.length} participants</div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Participant</th>
                <th className="px-5 py-4 font-semibold">Program(s)</th>
                <th className="px-5 py-4 font-semibold">Application</th>
                <th className="px-5 py-4 font-semibold">Training status</th>
                <th className="px-5 py-4 font-semibold">Assignments</th>
                <th className="px-5 py-4 font-semibold">Certificates</th>
                <th className="px-5 py-4 font-semibold">Joined</th>
                <th className="px-5 py-4 font-semibold">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((person) => (
                <tr key={person.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{person.name || "Name not provided"}</p>
                    <p className="mt-1 text-xs text-slate-500">{person.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{person.country || "Country not provided"}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{person.participantNumber || "ID pending"}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${person.accountStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{person.accountStatus}</span>
                  </td>
                  <td className="max-w-[220px] px-5 py-4 text-slate-700">{person.programs.length ? person.programs.join(", ") : <span className="text-slate-400">No program yet</span>}</td>
                  <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{person.applicationStatuses.length ? person.applicationStatuses.map((status, index) => <span key={status + index} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>{readable(status)}</span>) : <span className="text-slate-400">No application</span>}</div></td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(person.overallStatus)}`}>{readable(person.overallStatus)}</span>{person.enrollmentStatuses.length > 1 ? <p className="mt-1 text-xs text-slate-500">{person.enrollmentStatuses.map(readable).join(", ")}</p> : null}</td>
                  <td className="px-5 py-4 text-slate-700">{person.assignmentsAccepted}/{person.assignmentsTotal} accepted</td>
                  <td className="px-5 py-4 text-slate-700">{person.certificates}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{person.joinedAt ? new Date(person.joinedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-4"><Link href={`/admin/participants/${person.id}`} className="whitespace-nowrap font-semibold text-blue-700 hover:text-blue-900">View record →</Link></td>
                </tr>
              ))}
              {!visible.length ? <tr><td colSpan={8} className="px-5 py-14 text-center text-slate-500">No participants match this search or filter.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Training status is derived from enrollment and completion records. Assignment progress reflects submitted work recorded in TIKSE TECH.</p>
    </section>
  );
}
