import { createClient } from "@/lib/supabase/server";
import { CategoryTree } from "./category-tree";
import { createCategory, deleteCategory, renameCategory } from "./actions";

export default async function CategoriesPage() {
  const supabase = await createClient();

  // Get current edition
  const { data: currentEdition } = await supabase
    .from("editions")
    .select("id, name, year")
    .eq("is_current", true)
    .single();

  if (!currentEdition) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">
          Nessuna edizione corrente impostata.
        </p>
        <p className="text-sm text-zinc-500 mt-1">
          Vai su &quot;Edizioni e Giorni&quot; per impostarne una.
        </p>
      </div>
    );
  }

  // Get all categories for current edition
  const { data: categories } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("edition_id", currentEdition.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Categorie Spesa</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Edizione: {currentEdition.name}
        </p>
      </div>

      <CategoryTree
        categories={categories || []}
        editionId={currentEdition.id}
        onCreate={createCategory}
        onDelete={deleteCategory}
        onRename={renameCategory}
      />
    </div>
  );
}
