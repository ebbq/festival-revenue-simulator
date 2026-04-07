"use client";

import { useState } from "react";
import { ExpenseDetail } from "./expense-detail";
import { toggleBudget } from "./actions";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

type Expense = {
  id: string;
  description: string | null;
  supplier: string | null;
  supplier_ref: string | null;
  vat_applicable: boolean;
  vat_rate: number | null;
  is_fully_paid: boolean;
  paid_at: string | null;
  is_festival_wide: boolean;
  is_budget: boolean;
  notes: string | null;
  category_id: string;
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

type PreviousEditionData = Record<string, { totalGross: number; editionName: string }>;

// Helpers
function getGrossAmount(net: number, vatApplicable: boolean, vatRate: number | null): number {
  if (!vatApplicable || !vatRate) return net;
  return net * (1 + vatRate / 100);
}

function getCurrentNet(expense: Expense): number {
  const revisions = [...expense.expense_revisions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return revisions.length > 0 ? revisions[0].amount : 0;
}

function getExpenseGross(expense: Expense): number {
  return getGrossAmount(getCurrentNet(expense), expense.vat_applicable, expense.vat_rate);
}

function getTotalPaid(expense: Expense): number {
  return expense.expense_payments.reduce((sum, p) => sum + p.amount, 0);
}

function fmt(n: number): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2 });
}

// Tree
type CategoryNode = {
  category: Category;
  budget: number | null; // gross amount of budget entry at this category
  budgetExpense: Expense | null;
  directExpenses: Expense[]; // non-budget expenses at this category
  children: CategoryNode[];
  totalAllocated: number; // gross sum of all non-budget expenses (direct + recursive children)
  totalPaid: number;
};

function buildCategoryTree(categories: Category[], expenses: Expense[]): CategoryNode[] {
  const expensesByCategory = new Map<string, Expense[]>();
  for (const e of expenses) {
    const list = expensesByCategory.get(e.category_id) || [];
    list.push(e);
    expensesByCategory.set(e.category_id, list);
  }

  function buildNode(cat: Category): CategoryNode {
    const catExpenses = expensesByCategory.get(cat.id) || [];
    const budgetExp = catExpenses.find((e) => e.is_budget) || null;
    const directExpenses = catExpenses.filter((e) => !e.is_budget);

    const childCats = categories.filter((c) => c.parent_id === cat.id);
    const children = childCats.map(buildNode).filter(
      (n) => n.budget !== null || n.directExpenses.length > 0 || n.children.length > 0
    );

    const directGross = directExpenses.reduce((s, e) => s + getExpenseGross(e), 0);
    const directPaid = directExpenses.reduce((s, e) => s + getTotalPaid(e), 0);
    const childrenAllocated = children.reduce((s, c) => s + c.totalAllocated, 0);
    const childrenPaid = children.reduce((s, c) => s + c.totalPaid, 0);

    // Budget expenses in children also count toward parent's allocated for hierarchy comparison
    const childrenBudgetTotal = children.reduce(
      (s, c) => s + (c.budget || 0),
      0
    );

    return {
      category: cat,
      budget: budgetExp ? getExpenseGross(budgetExp) : null,
      budgetExpense: budgetExp,
      directExpenses,
      children,
      totalAllocated: directGross + childrenAllocated + childrenBudgetTotal,
      totalPaid: directPaid + childrenPaid,
    };
  }

  const l1Cats = categories.filter((c) => c.level === 1);
  return l1Cats
    .map(buildNode)
    .filter((n) => n.budget !== null || n.directExpenses.length > 0 || n.children.length > 0);
}

export function ExpenseList({
  expenses,
  categories,
  canEdit,
  previousEditionData,
}: {
  expenses: Expense[];
  categories: Category[];
  canEdit: boolean;
  previousEditionData?: PreviousEditionData | null;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  const tree = buildCategoryTree(categories, expenses);

  // Global totals
  const totalGross = expenses.reduce((s, e) => s + getExpenseGross(e), 0);
  const totalBudgets = expenses.filter((e) => e.is_budget).reduce((s, e) => s + getExpenseGross(e), 0);
  const totalAllocated = expenses.filter((e) => !e.is_budget).reduce((s, e) => s + getExpenseGross(e), 0);
  const totalPaidAll = expenses.reduce((s, e) => s + getTotalPaid(e), 0);
  const totalVat = expenses.reduce((s, e) => {
    if (!e.vat_applicable || !e.vat_rate) return s;
    return s + getCurrentNet(e) * (e.vat_rate / 100);
  }, 0);

  function toggle(categoryId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="Totale lordo" value={totalGross} />
        <SummaryCard label="di cui IVA" value={totalVat} sub />
        <SummaryCard label="Pagato" value={totalPaidAll} />
        <SummaryCard label="Residuo" value={totalGross - totalPaidAll} />
      </div>

      {/* Category tree */}
      <div className="space-y-2">
        {tree.map((node) => (
          <CategorySection
            key={node.category.id}
            node={node}
            depth={1}
            expandedCategories={expandedCategories}
            toggle={toggle}
            expandedExpenseId={expandedExpenseId}
            setExpandedExpenseId={setExpandedExpenseId}
            canEdit={canEdit}
            previousEditionData={previousEditionData}
          />
        ))}

        {tree.length === 0 && (
          <p className="text-center py-8 text-zinc-500">Nessuna spesa trovata.</p>
        )}
      </div>
    </div>
  );
}

function CategorySection({
  node,
  depth,
  expandedCategories,
  toggle,
  expandedExpenseId,
  setExpandedExpenseId,
  canEdit,
  previousEditionData,
}: {
  node: CategoryNode;
  depth: number;
  expandedCategories: Set<string>;
  toggle: (id: string) => void;
  expandedExpenseId: string | null;
  setExpandedExpenseId: (id: string | null) => void;
  canEdit: boolean;
  previousEditionData?: PreviousEditionData | null;
}) {
  const isExpanded = expandedCategories.has(node.category.id);
  const available = node.budget !== null ? node.budget - node.totalAllocated : null;
  const isOverBudget = available !== null && available < 0;

  // Previous edition comparison (L1 only)
  const prevKey = node.category.name.trim().toLowerCase();
  const prevData = depth === 1 && previousEditionData ? previousEditionData[prevKey] : null;
  const prevDelta =
    prevData && node.budget !== null && prevData.totalGross > 0
      ? ((node.budget - prevData.totalGross) / prevData.totalGross) * 100
      : null;

  const borderClass =
    depth === 1
      ? "rounded-xl border border-zinc-800 bg-zinc-900"
      : depth === 2
        ? "border-l border-zinc-800 ml-2"
        : "border-l border-zinc-700 ml-2";

  return (
    <div className={borderClass}>
      {/* Header row */}
      <button
        onClick={() => toggle(node.category.id)}
        className={`w-full text-left ${depth === 1 ? "p-4" : "px-4 py-2"} hover:bg-zinc-800/30 transition-colors`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-500 text-xs w-4 shrink-0">
              {isExpanded ? "▼" : "▶"}
            </span>
            <span className={depth === 1 ? "font-semibold" : depth === 2 ? "font-medium text-sm" : "text-sm text-zinc-300"}>
              {node.category.name}
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-right">
            {node.budget !== null && (
              <div className="text-xs">
                <span className="text-zinc-500">Budget </span>
                <span className="font-mono">€{fmt(node.budget)}</span>
              </div>
            )}
            <div className="text-xs">
              <span className="text-zinc-500">Allocato </span>
              <span className="font-mono">€{fmt(node.totalAllocated)}</span>
            </div>
            {available !== null && (
              <div className="text-xs">
                <span className="text-zinc-500">Disp. </span>
                <span className={`font-mono ${isOverBudget ? "text-red-400" : "text-green-400"}`}>
                  €{fmt(available)}
                </span>
              </div>
            )}
            {prevData && (
              <div className="text-xs text-zinc-500">
                <span>{prevData.editionName}: €{fmt(prevData.totalGross)}</span>
                {prevDelta !== null && (
                  <span className={`ml-1 ${prevDelta > 0 ? "text-red-400" : "text-green-400"}`}>
                    {prevDelta > 0 ? "+" : ""}{prevDelta.toFixed(0)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className={depth === 1 ? "px-4 pb-4" : "px-4 pb-2"}>
          {/* Budget entry if exists */}
          {node.budgetExpense && (
            <ExpenseRow
              expense={node.budgetExpense}
              canEdit={canEdit}
              isExpanded={expandedExpenseId === node.budgetExpense.id}
              onToggle={() =>
                setExpandedExpenseId(
                  expandedExpenseId === node.budgetExpense!.id ? null : node.budgetExpense!.id
                )
              }
            />
          )}

          {/* Direct expenses */}
          {node.directExpenses.map((exp) => (
            <ExpenseRow
              key={exp.id}
              expense={exp}
              canEdit={canEdit}
              isExpanded={expandedExpenseId === exp.id}
              onToggle={() =>
                setExpandedExpenseId(expandedExpenseId === exp.id ? null : exp.id)
              }
            />
          ))}

          {/* Child categories */}
          {node.children.map((child) => (
            <CategorySection
              key={child.category.id}
              node={child}
              depth={depth + 1}
              expandedCategories={expandedCategories}
              toggle={toggle}
              expandedExpenseId={expandedExpenseId}
              setExpandedExpenseId={setExpandedExpenseId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseRow({
  expense,
  canEdit,
  isExpanded,
  onToggle,
}: {
  expense: Expense;
  canEdit: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const net = getCurrentNet(expense);
  const gross = getExpenseGross(expense);
  const paid = getTotalPaid(expense);
  const remaining = gross - paid;

  return (
    <div className="mt-1">
      <button
        onClick={onToggle}
        className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
          isExpanded
            ? "border-amber-600/30 bg-zinc-800"
            : "border-zinc-800/50 bg-zinc-800/30 hover:bg-zinc-800/50"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Badge */}
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                expense.is_budget
                  ? "bg-blue-500/15 text-blue-400"
                  : "bg-zinc-700/50 text-zinc-400"
              }`}
              onClick={(e) => {
                if (!canEdit) return;
                e.stopPropagation();
                toggleBudget(expense.id, !expense.is_budget);
              }}
              title={canEdit ? "Clicca per cambiare tipo" : undefined}
            >
              {expense.is_budget ? "Budget" : "Spesa"}
            </span>

            <span className="truncate">
              {expense.description || expense.expense_categories?.name || "—"}
            </span>
            {expense.supplier && (
              <span className="text-xs text-zinc-500 truncate hidden md:inline">
                · {expense.supplier}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="font-mono font-medium">€{fmt(gross)}</span>
              {expense.vat_applicable && expense.vat_rate && (
                <span className="block text-[10px] text-zinc-500">incl. IVA {expense.vat_rate}%</span>
              )}
            </div>
            <div className="text-right w-28">
              {expense.is_fully_paid ? (
                <span className="text-xs text-green-400">Saldato</span>
              ) : paid > 0 ? (
                <span className="text-xs text-amber-400">
                  Residuo €{fmt(remaining)}
                </span>
              ) : (
                <span className="text-xs text-zinc-500">Da pagare</span>
              )}
            </div>
          </div>
        </div>

        {/* Day badges */}
        {!expense.is_festival_wide && expense.expense_day_assignments.length > 0 && (
          <div className="mt-1.5 flex gap-1.5">
            {expense.expense_day_assignments.map((a) => (
              <span
                key={a.festival_days.id}
                className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-[10px] text-zinc-400"
              >
                {a.festival_days.label}
              </span>
            ))}
          </div>
        )}
      </button>

      {isExpanded && <ExpenseDetail expense={expense} canEdit={canEdit} />}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: number; sub?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className={`text-xs ${sub ? "text-zinc-600" : "text-zinc-500"}`}>{label}</p>
      <p className={`mt-1 font-mono font-semibold ${sub ? "text-sm text-zinc-400" : "text-lg"}`}>
        €{fmt(value)}
      </p>
    </div>
  );
}
