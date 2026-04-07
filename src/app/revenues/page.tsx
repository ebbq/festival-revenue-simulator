import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import Link from "next/link";
import { RevenueList } from "./revenue-list";

export default async function RevenuesPage() {
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
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm">← Dashboard</Link>
            <h1 className="text-lg font-semibold">Ricavi</h1>
          </div>
        </header>
        <div className="text-center py-12 text-gray-400">
          Nessuna edizione corrente.
        </div>
      </div>
    );
  }

  const { data: revenues } = await supabase
    .from("revenues")
    .select("*")
    .eq("edition_id", currentEdition.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm">← Dashboard</Link>
          <h1 className="text-lg font-semibold">Ricavi — {currentEdition.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <RevenueList
          revenues={revenues || []}
          editionId={currentEdition.id}
          canEdit={canEdit}
        />
      </main>
    </div>
  );
}
