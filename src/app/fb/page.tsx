import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import Link from "next/link";
import { EbbqLogo } from "@/components/ebbq-logo";
import { FbOperatorList } from "./fb-operator-list";

export default async function FbPage() {
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
      <div className="min-h-screen bg-white text-gray-800">
        <header className="border-b border-gray-200 px-6 py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 sm:gap-6">
            <EbbqLogo href="/" heightClass="h-7" />
            <Link href="/" className="text-gray-500 hover:text-gray-800 text-sm">← Dashboard</Link>
            <h1 className="text-lg font-semibold">Ristorazione</h1>
          </div>
        </header>
        <div className="text-center py-12 text-gray-500">Nessuna edizione corrente.</div>
      </div>
    );
  }

  const { data: operators } = await supabase
    .from("fb_operators")
    .select("*, fb_actuals(*)")
    .eq("edition_id", currentEdition.id)
    .order("created_at");

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 sm:gap-6">
          <EbbqLogo href="/" heightClass="h-7" />
          <Link href="/" className="text-gray-500 hover:text-gray-800 text-sm">← Dashboard</Link>
          <h1 className="text-lg font-semibold">Ristorazione — {currentEdition.name}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <FbOperatorList
          operators={operators || []}
          editionId={currentEdition.id}
          canEdit={canEdit}
        />
      </main>
    </div>
  );
}
