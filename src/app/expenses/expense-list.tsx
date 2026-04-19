"use client";

import { useState } from "react";
import { ExpenseDetail } from "./expense-detail";
import { toggleBudget } from "./actions";
import { formatItDecimal } from "@/lib/format-it";

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
  return formatItDecimal(n);
}

// Tree
type CategoryNode = {
  category: Category;
  budget: number | null;
  budgetExpense: Expense | null;
  directExpenses: Expense[];
  children: CategoryNode[];
  totalAllocated: number;
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
    const childrenBudgetTotal = children.reduce((s, c) => s + (c.budget || 0), 0);

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

  const totalGross = expenses.reduce((s, e) => s + getExpenseGross(e), 0);
  const totalVat = expenses.reduce((s, e) => {
    if (!e.vat_applicable || !e.vat_rate) return s;
    return s + getCurrentNet(e) * (e.vat_rate / 100);
  }, 0);
  const totalPaidAll = expenses.reduce((s, e) => s + getTotalPaid(e), 0);

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
        <SummaryCard label="Totale lordo" value={totalGross} color="green" />
        <SummaryCard label="di cui IVA" value={totalVat} muted />
        <SummaryCard label="Pagato" value={totalPaidAll} color="sky" />
        <SummaryCard label="Residuo" value={totalGross - totalPaidAll} />
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-200">
        <div className="col-span-4">Voce</div>
        <div className="col-span-2 text-right">Budget</div>
        <div className="col-span-2 text-right">Allocato</div>
        <div className="col-span-2 text-right">Disponibile</div>
        <div className="col-span-2 text-right">Pagato</div>
      </div>

      {/* Category rows */}
      <div className="divide-y divide-gray-100">
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
      </div>

      {tree.length === 0 && (
        <p className="text-center py-12 text-gray-400">Nessuna spesa trovata.</p>
      )}
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

  const prevKey = node.category.name.trim().toLowerCase();
  const prevData = depth === 1 && previousEditionData ? previousEditionData[prevKey] : null;
  const prevDelta =
    prevData && node.budget !== null && prevData.totalGross > 0
      ? ((node.budget - prevData.totalGross) / prevData.totalGross) * 100
      : null;

  const borderClass =
    depth === 1
      ? "border-l-4 border-l-primary"
      : depth === 2
        ? "border-l-4 border-l-primary/40"
        : "border-l-4 border-l-primary/20";
  const labelIndent = depth === 1 ? "" : depth === 2 ? "pl-3" : "pl-6";
  const bgClass = depth === 1 ? "bg-primary-subtle/50" : "";
  const fontClass = depth === 1 ? "font-semibold" : depth === 2 ? "font-medium text-sm" : "text-sm text-gray-600";

  return (
    <div>
      {/* Category row */}
      <button
        onClick={() => toggle(node.category.id)}
        className={`w-full grid grid-cols-12 gap-2 items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${bgClass} ${borderClass}`}
      >
        <div className={`col-span-4 flex items-center gap-2 min-w-0 ${labelIndent}`}>
          <span className="text-gray-400 text-[10px] w-3 shrink-0">
            {isExpanded ? "▼" : "▶"}
          </span>
          <span className={fontClass}>{node.category.name}</span>
          {prevData && (
            <span className="text-[10px] text-gray-400 hidden lg:inline">
              {prevData.editionName}: €{fmt(prevData.totalGross)}
              {prevDelta !== null && (
                <span className={prevDelta > 0 ? "text-red-500 ml-0.5" : "text-primary ml-0.5"}>
                  {prevDelta > 0 ? "+" : ""}{prevDelta.toFixed(0)}%
                </span>
              )}
            </span>
          )}
        </div>
        <div className="col-span-2 text-right font-mono text-sm">
          {node.budget !== null ? `€${fmt(node.budget)}` : "—"}
        </div>
        <div className="col-span-2 text-right font-mono text-sm">
          €{fmt(node.totalAllocated)}
        </div>
        <div className={`col-span-2 text-right font-mono text-sm ${isOverBudget ? "text-red-600 font-semibold" : available !== null ? "text-primary" : "text-gray-400"}`}>
          {available !== null ? `€${fmt(available)}` : "—"}
        </div>
        <div className="col-span-2 text-right font-mono text-sm text-secondary-solid">
          €{fmt(node.totalPaid)}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div>
          {/* Budget entry */}
          {node.budgetExpense && (
            <ExpenseRow
              expense={node.budgetExpense}
              depth={depth}
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
              depth={depth}
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
  depth,
  canEdit,
  isExpanded,
  onToggle,
}: {
  expense: Expense;
  depth: number;
  canEdit: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const gross = getExpenseGross(expense);
  const paid = getTotalPaid(expense);
  const remaining = gross - paid;

  const borderClass = "border-l-4 border-l-secondary/25";
  const labelIndent = depth === 1 ? "pl-3" : depth === 2 ? "pl-6" : "pl-9";

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full grid grid-cols-12 gap-2 items-center px-4 py-2 text-left text-sm hover:bg-secondary-subtle/50 transition-colors ${borderClass} ${isExpanded ? "bg-secondary-subtle/30" : ""}`}
      >
        <div className={`col-span-4 flex items-center gap-2 min-w-0 ${labelIndent}`}>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
              expense.is_budget
                ? "bg-secondary-subtle text-secondary-solid"
                : "bg-gray-100 text-gray-600"
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
          <span className="truncate text-gray-800">
            {expense.description || expense.expense_categories?.name || "—"}
          </span>
          {expense.supplier && (
            <span className="text-xs text-gray-400 truncate hidden lg:inline">
              {expense.supplier}
            </span>
          )}
        </div>
        <div className="col-span-2 text-right font-mono">
          {expense.is_budget ? `€${fmt(gross)}` : ""}
        </div>
        <div className="col-span-2 text-right font-mono">
          {!expense.is_budget ? `€${fmt(gross)}` : ""}
          {expense.vat_applicable && expense.vat_rate && (
            <span className="block text-[10px] text-gray-400">incl. IVA {expense.vat_rate}%</span>
          )}
        </div>
        <div className="col-span-2 text-right">
          {/* empty for row level */}
        </div>
        <div className="col-span-2 text-right font-mono">
          {expense.is_fully_paid ? (
            <span className="text-primary text-xs">Saldato</span>
          ) : paid > 0 ? (
            <span className="text-secondary-solid">€{fmt(paid)}</span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      </button>

      {isExpanded && <ExpenseDetail expense={expense} canEdit={canEdit} />}
    </div>
  );
}

function SummaryCard({ label, value, color, muted }: { label: string; value: number; color?: "green" | "sky"; muted?: boolean }) {
  const valueColor = muted
    ? "text-gray-400 text-sm"
    : color === "green"
      ? "text-primary-dark text-lg"
      : color === "sky"
        ? "text-secondary-solid text-lg"
        : "text-gray-800 text-lg";

  const borderColor = color === "green"
    ? "border-primary/25"
    : color === "sky"
      ? "border-secondary/25"
      : "border-gray-200";

  return (
    <div className={`rounded-xl border ${borderColor} bg-white p-4 shadow-sm`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 font-mono font-semibold ${valueColor}`}>
        €{fmt(value)}
      </p>
    </div>
  );
}
