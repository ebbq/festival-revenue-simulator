import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import Link from "next/link";
import { ScenarioSimulator } from "./scenario-simulator";

export default async function ScenariosPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const canEdit = profile.role === "admin" || profile.role === "editor";

  const { data: currentEdition } = await supabase
    .from("editions")
    .select("id, name")
    .eq("is_current", true)
    .single();

  if (!currentEdition) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <header className="border-b border-zinc-800 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center gap-6">
            <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Dashboard</Link>
            <h1 className="text-lg font-semibold">Scenari</h1>
          </div>
        </header>
        <div className="text-center py-12 text-zinc-400">Nessuna edizione corrente.</div>
      </div>
    );
  }

  // Fetch all data needed for simulation
  const [
    { data: festivalDays },
    { data: expenses },
    { data: revenues },
    { data: fbOperators },
    { data: savedScenarios },
  ] = await Promise.all([
    supabase.from("festival_days").select("*").eq("edition_id", currentEdition.id).order("sort_order"),
    supabase.from("expenses").select("*, expense_revisions(*)").eq("edition_id", currentEdition.id),
    supabase.from("revenues").select("*").eq("edition_id", currentEdition.id),
    supabase.from("fb_operators").select("*").eq("edition_id", currentEdition.id),
    supabase.from("scenarios").select("*").eq("edition_id", currentEdition.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Dashboard</Link>
          <h1 className="text-lg font-semibold">Simulatore scenari — {currentEdition.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <ScenarioSimulator
          editionId={currentEdition.id}
          festivalDays={festivalDays || []}
          expenses={expenses || []}
          revenues={revenues || []}
          fbOperators={fbOperators || []}
          savedScenarios={savedScenarios || []}
          canEdit={canEdit}
        />
      </main>
    </div>
  );
}
