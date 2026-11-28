import { redirect } from "next/navigation";
import { updateOwnProfile } from "@/actions/profile";
import { getSessionUser } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata = { title: "My Profile | TIKSE TECH" };

const skillOptions = [
  "Programming", "Web Development", "Mobile Development", "Cybersecurity", "Networking",
  "Artificial Intelligence", "Data Analysis", "Cloud Computing", "DevOps", "UI/UX Design",
  "Graphic Design", "Project Management", "Research", "Communication", "Digital Marketing"
];

const errors: Record<string, string> = {
  name: "Enter a name between 2 and 160 characters.",
  length: "One or more profile fields exceed the allowed length.",
  url: "Enter valid HTTP or HTTPS links for your profile URLs.",
  save: "Your profile could not be saved. Check your account permissions and try again."
};

export default async function ProfilePage({ searchParams }: { searchParams?: Promise<{ error?: string; saved?: string }> }) {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/profile");
  const params = searchParams ? await searchParams : {};
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase.from("profiles")
    .select("full_name,email,country,timezone,short_bio,education,experience,skills,github,linkedin,portfolio,website,participant_number")
    .eq("id", session.profileId).maybeSingle();
  if (error || !profile) throw new Error("Your profile could not be loaded. Please refresh or contact support.");
  const selectedSkills = Array.isArray(profile.skills) ? profile.skills : [];

  return <main className="container-shell py-10 sm:py-12">
    <div className="mx-auto max-w-4xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Your account</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Profile</h1>
      <p className="mt-2 text-slate-600">Keep your professional information accurate so the TIKSE TECH team can understand your background.</p>
      {params.saved === "1" ? <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Profile changes saved successfully.</p> : null}
      {params.error && errors[params.error] ? <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{errors[params.error]}</p> : null}

      <section className="surface-panel mt-7 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/80 p-6">
          <div><h2 className="text-lg font-bold text-slate-950">{profile.full_name || session.name}</h2><p className="mt-1 text-sm text-slate-500">{profile.email} · {session.role.replaceAll("_", " ")}</p></div>
          {profile.participant_number ? <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 font-mono text-xs font-bold text-blue-800">{profile.participant_number}</span> : null}
        </div>
        <form action={updateOwnProfile} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
          <div className="sm:col-span-2"><label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label><input id="fullName" name="fullName" defaultValue={profile.full_name || ""} required minLength={2} maxLength={160} className="field-control" /></div>
          <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label><input id="email" value={profile.email} readOnly aria-readonly="true" className="field-control cursor-not-allowed bg-slate-50 text-slate-500" /><p className="mt-1 text-xs text-slate-500">Managed by account authentication.</p></div>
          <div><label htmlFor="country" className="mb-2 block text-sm font-semibold text-slate-700">Country</label><input id="country" name="country" defaultValue={profile.country || ""} maxLength={100} className="field-control" placeholder="Your country" /></div>
          <div><label htmlFor="timezone" className="mb-2 block text-sm font-semibold text-slate-700">Time zone</label><input id="timezone" name="timezone" defaultValue={profile.timezone || ""} maxLength={100} className="field-control" placeholder="e.g. Africa/Addis_Ababa" /></div>
          <div><label htmlFor="education" className="mb-2 block text-sm font-semibold text-slate-700">Education</label><input id="education" name="education" defaultValue={profile.education || ""} maxLength={160} className="field-control" placeholder="Your education background" /></div>
          <div><label htmlFor="experience" className="mb-2 block text-sm font-semibold text-slate-700">Experience</label><input id="experience" name="experience" defaultValue={profile.experience || ""} maxLength={160} className="field-control" placeholder="Your experience" /></div>
          <div className="sm:col-span-2"><label htmlFor="shortBio" className="mb-2 block text-sm font-semibold text-slate-700">Professional summary</label><textarea id="shortBio" name="shortBio" defaultValue={profile.short_bio || ""} maxLength={500} rows={4} className="field-control resize-y" placeholder="A short introduction about your interests and goals." /></div>
          <fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-semibold text-slate-700">Skills</legend><div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">{skillOptions.map(skill=><label key={skill} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-slate-700 hover:bg-white"><input type="checkbox" name="skills" value={skill} defaultChecked={selectedSkills.includes(skill)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />{skill}</label>)}</div></fieldset>
          <div><label htmlFor="github" className="mb-2 block text-sm font-semibold text-slate-700">GitHub URL</label><input id="github" name="github" type="url" defaultValue={profile.github || ""} className="field-control" placeholder="https://github.com/username" /></div>
          <div><label htmlFor="linkedin" className="mb-2 block text-sm font-semibold text-slate-700">LinkedIn URL</label><input id="linkedin" name="linkedin" type="url" defaultValue={profile.linkedin || ""} className="field-control" placeholder="https://linkedin.com/in/username" /></div>
          <div><label htmlFor="portfolio" className="mb-2 block text-sm font-semibold text-slate-700">Portfolio URL</label><input id="portfolio" name="portfolio" type="url" defaultValue={profile.portfolio || ""} className="field-control" placeholder="https://yourportfolio.com" /></div>
          <div><label htmlFor="website" className="mb-2 block text-sm font-semibold text-slate-700">Website URL</label><input id="website" name="website" type="url" defaultValue={profile.website || ""} className="field-control" placeholder="https://example.com" /></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 sm:col-span-2"><p className="text-xs text-slate-500">Your role and email address cannot be changed from this form.</p><button type="submit" className="min-h-11 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700">Save profile</button></div>
        </form>
      </section>
    </div>
  </main>;
}
