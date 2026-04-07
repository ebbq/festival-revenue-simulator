"use client";

import { useState } from "react";
import { ExpenseDetail } from "./expense-detail";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

type Expense = {
  id: string;
  description: string;
  supplier: string | null;
  supplier_ref: string | null;
  vat_applicable: boolean;
  vat_rate: number | null;
  is_fully_paid: boolean;
  paid_at: string | null;
  is_festival_wide: boolean;
  notes: string | null;
  created_at: string;
  expense_revisions: {
    id: string;
    amount: number;
    note: string | null;
    created_at: string;
  }[];
  expense_payments: {
    id: string;
    amount: number;
    paid_at: string;
    is_advance: boolean;
    note: string | null;
  }[];
  expense_day_assignments: {
    festival_days: { id: string; label: string; date: string };
  }[];
  expense_categories: Category;
};

export function ExpenseList({
  expenses,
  categories,
  canEdit,
}: {
  expenses: Expense[];
  categories: Category[];
  canEdit: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Build category path
  function getCategoryPath(cat: Category): string {
    const parts: string[] = [cat.name];
    let current = cat;
    while (current.parent_id) {
      const parent = categories.find((c) => c.id === current.parent_id);
      if (!parent) break;
      parts.unshift(parent.name);
      current = parent;
    }
    return parts.join(" › ");
  }

  // Get current amount (latest revision)
  function getCurrentAmount(expense: Expense): number {
    const revisions = [...expense.expense_revisions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return revisions.length > 0 ? revisions[0].amount : 0;
  }

  // Get total paid
  function getTotalPaid(expense: Expense): number {
    return expense.expense_payments.reduce((sum, p) => sum + p.amount, 0);
  }

  // Level 1 categories for filter
  const level1Cats = categories.filter((c) => c.level === 1);

  // Filter
  const filtered =
    filterCategory === "all"
      ? expenses
      : expenses.filter((e) => {
          let cat: Category | undefined = e.expense_categories;
          while (cat) {
            if (cat.id === filterCategory) return true;
            cat = categories.find((c) => c.id === cat!.parent_id);
          }
          return false;
        });

  // Totals
  const totalBudget = filtered.reduce((sum, e) => sum + getCurrentAmount(e), 0);
  const totalPaid = filtered.reduce((sum, e) => sum + getTotalPaid(e), 0);
  const totalVat = filtered.reduce((sum, e) => {
    if (!e.vat_applicable || !e.vat_rate) return sum;
    return sum + getCurrentAmount(e) * (e.vat_rate / 100);
  }, 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="Budget totale" value={totalBudget} />
        <SummaryCard label="IVA totale" value={totalVat} />
        <SummaryCard label="Pagato" value={totalPaid} />
        <SummaryCard label="Residuo" value={totalBudget - totalPaid} />
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs text-zinc-500">Filtra:</span>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white"
        >
          <option value="all">Tutte le categorie</option>
          {level1Cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500 ml-auto">
          {filtered.length} {filtered.length === 1 ? "spesa" : "spese"}
        </span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((expense) => {
          const currentAmount = getCurrentAmount(expense);
          const totalPaidExp = getTotalPaid(expense);
          const remaining = currentAmount - totalPaidExp;
          const isExpanded = expandedId === expense.id;

          return (
            <div key={expense.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  isExpanded
                    ? "border-amber-600/30 bg-zinc-900"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{expense.description}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {getCategoryPath(expense.expense_categories)}
                      {expense.supplier && ` · ${expense.supplier}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-medium">
                      €{currentAmount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      {expense.vat_applicable && expense.vat_rate && (
                        <span className="text-xs text-zinc-500 ml-1">+IVA {expense.vat_rate}%</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 justify-end mt-0.5">
                      {expense.is_fully_paid ? (
                        <span className="text-xs text-green-400">Saldato</span>
                      ) : totalPaidExp > 0 ? (
                        <span className="text-xs text-amber-400">
                          Pagato €{totalPaidExp.toLocaleString("it-IT", { minimumFractionDigits: 2 })} · Residuo €{remaining.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">Da pagare</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Day badges */}
                {!expense.is_festival_wide && expense.expense_day_assignments.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {expense.expense_day_assignments.map((a) => (
                      <span
                        key={a.festival_days.id}
                        className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
                      >
                        {a.festival_days.label}
                      </span>
                    ))}
                  </div>
                )}
              </button>

              {isExpanded && (
                <ExpenseDetail expense={expense} canEdit={canEdit} />
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center py-8 text-zinc-500">Nessuna spesa trovata.</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-mono font-semibold">
        €{value.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
