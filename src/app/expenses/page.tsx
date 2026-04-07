import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import Link from "next/link";
import { EbbqLogo } from "@/components/ebbq-logo";
import { ExpenseList } from "./expense-list";
import { NewExpenseForm } from "./new-expense-form";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const canEdit = profile.role === "admin" || profile.role === "editor";

  const { data: currentEdition } = await supabase
    .from("editions")
    .select("id, name, year, show_edition_comparison")
    .eq("is_current", true)
    .single();

  if (!currentEdition) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200 px-6 py-4">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 sm:gap-6">
            <EbbqLogo href="/" heightClass="h-7" />
            <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm">← Dashboard</Link>
            <h1 className="text-lg font-semibold">Spese</h1>
          </div>
        </header>
        <div className="text-center py-12 text-gray-400">
          Nessuna edizione corrente. Vai nelle impostazioni per impostarne una.
        </div>
      </div>
    );
  }

  const { data: categories } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("edition_id", currentEdition.id)
    .order("sort_order");

  const { data: festivalDays } = await supabase
    .from("festival_days")
    .select("*")
    .eq("edition_id", currentEdition.id)
    .order("sort_order");

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

  let previousEditionData: Record<string, { totalGross: number; editionName: string }> | null = null;

  if (currentEdition.show_edition_comparison) {
    const { data: prevEdition } = await supabase
      .from("editions")
      .select("id, year, name")
      .lt("year", currentEdition.year)
      .order("year", { ascending: false })
      .limit(1)
      .single();

    if (prevEdition) {
      const { data: prevCategories } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("edition_id", prevEdition.id);

      const { data: prevExpenses } = await supabase
        .from("expenses")
        .select("*, expense_revisions(*), expense_categories(id, name, parent_id, level)")
        .eq("edition_id", prevEdition.id);

      if (prevCategories && prevExpenses) {
        previousEditionData = {};
        for (const exp of prevExpenses) {
          let cat = exp.expense_categories;
          while (cat && cat.parent_id) {
            const parent = prevCategories.find((c: { id: string }) => c.id === cat.parent_id);
            if (!parent) break;
            cat = parent;
          }
          if (!cat) continue;

          const key = cat.name.trim().toLowerCase();
          const net = [...exp.expense_revisions]
            .sort((a: { created_at: string }, b: { created_at: string }) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]?.amount || 0;
          const gross = exp.vat_applicable && exp.vat_rate
            ? net * (1 + exp.vat_rate / 100)
            : net;

          if (!previousEditionData[key]) {
            previousEditionData[key] = { totalGross: 0, editionName: prevEdition.name };
          }
          previousEditionData[key].totalGross += gross;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <EbbqLogo href="/" heightClass="h-7" />
            <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm">← Dashboard</Link>
            <h1 className="text-lg font-semibold text-primary-dark">Spese — {currentEdition.name}</h1>
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
          previousEditionData={previousEditionData}
        />
      </main>
    </div>
  );
}
