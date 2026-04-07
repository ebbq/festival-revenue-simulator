import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import Link from "next/link";
import { ExpenseList } from "./expense-list";
import { NewExpenseForm } from "./new-expense-form";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const canEdit = profile.role === "admin" || profile.role === "editor";

  // Get current edition
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
            <h1 className="text-lg font-semibold">Spese</h1>
          </div>
        </header>
        <div className="text-center py-12 text-zinc-400">
          Nessuna edizione corrente. Vai nelle impostazioni per impostarne una.
        </div>
      </div>
    );
  }

  // Get categories tree
  const { data: categories } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("edition_id", currentEdition.id)
    .order("sort_order");

  // Get festival days
  const { data: festivalDays } = await supabase
    .from("festival_days")
    .select("*")
    .eq("edition_id", currentEdition.id)
    .order("sort_order");

  // Get expenses with revisions, payments, and day assignments
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
      *,
      expense_revisions(*),
      expense_payments(*),
      expense_day_assignments(*, festival_days(*)),
      expense_categories(id, name, parent_id, level)
    `)
    .eq("edition_id", currentEdition.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Dashboard</Link>
            <h1 className="text-lg font-semibold">Spese — {currentEdition.name}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {canEdit && (
          <NewExpenseForm
            editionId={currentEdition.id}
            categories={categories || []}
            festivalDays={festivalDays || []}
          />
        )}

        <ExpenseList
          expenses={expenses || []}
          categories={categories || []}
          canEdit={canEdit}
        />
      </main>
    </div>
  );
}
