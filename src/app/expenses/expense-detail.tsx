"use client";

import { useState } from "react";
import { addRevision, addPayment, markFullyPaid, deleteExpense } from "./actions";

type Expense = {
  id: string;
  description: string | null;
  is_budget: boolean;
  supplier: string | null;
  supplier_ref: string | null;
  vat_applicable: boolean;
  vat_rate: number | null;
  is_fully_paid: boolean;
  notes: string | null;
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
};

export function ExpenseDetail({
  expense,
  canEdit,
}: {
  expense: Expense;
  canEdit: boolean;
}) {
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revisions = [...expense.expense_revisions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const payments = [...expense.expense_payments].sort(
    (a, b) => new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime()
  );

  const currentAmount = revisions.length > 0 ? revisions[revisions.length - 1].amount : 0;
  const grossAmount = expense.vat_applicable && expense.vat_rate
    ? currentAmount * (1 + expense.vat_rate / 100)
    : currentAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="ml-1 mr-1 mb-2 rounded-b-lg border border-t-0 border-zinc-800 bg-zinc-900/80 p-5 space-y-5">
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Gross amount note */}
      {expense.vat_applicable && expense.vat_rate && (
        <p className="text-sm text-zinc-300">
          Importo lordo: <span className="font-mono font-medium">€{grossAmount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
          <span className="text-zinc-500"> (incl. IVA {expense.vat_rate}%)</span>
        </p>
      )}

      {/* Info */}
      {(expense.supplier || expense.notes) && (
        <div className="text-sm space-y-1">
          {expense.supplier && (
            <p className="text-zinc-400">
              Fornitore: <span className="text-white">{expense.supplier}</span>
              {expense.supplier_ref && (
                <span className="text-zinc-500"> ({expense.supplier_ref})</span>
              )}
            </p>
          )}
          {expense.notes && <p className="text-zinc-400">Note: {expense.notes}</p>}
        </div>
      )}

      {/* Revisions timeline */}
      <div>
        <h4 className="text-sm font-medium text-zinc-400 mb-2">Storico stanziamenti</h4>
        <div className="space-y-1.5">
          {revisions.map((rev, i) => {
            const prevAmount = i > 0 ? revisions[i - 1].amount : null;
            const diff = prevAmount !== null ? rev.amount - prevAmount : null;
            return (
              <div key={rev.id} className="flex items-center gap-3 text-sm">
                <span className="text-zinc-500 w-20 shrink-0">
                  {new Date(rev.created_at).toLocaleDateString("it-IT")}
                </span>
                <span className="font-mono text-white">
                  €{rev.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </span>
                {diff !== null && (
                  <span className={`text-xs ${diff > 0 ? "text-red-400" : "text-green-400"}`}>
                    {diff > 0 ? "+" : ""}€{diff.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </span>
                )}
                {rev.note && <span className="text-zinc-500 text-xs">{rev.note}</span>}
              </div>
            );
          })}
        </div>

        {canEdit && !showRevisionForm && (
          <button
            onClick={() => setShowRevisionForm(true)}
            className="mt-2 text-xs text-amber-400 hover:text-amber-300"
          >
            + Nuova revisione
          </button>
        )}

        {showRevisionForm && (
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            action={async (formData) => {
              setError(null);
              const result = await addRevision(formData);
              if (result?.error) setError(result.error);
              else setShowRevisionForm(false);
            }}
          >
            <input type="hidden" name="expense_id" value={expense.id} />
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Nuovo importo (€)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                defaultValue={currentAmount}
                className="w-32 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Motivo</label>
              <input
                name="note"
                type="text"
                placeholder="Motivo revisione..."
                className="w-48 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white placeholder-zinc-600"
              />
            </div>
            <button type="submit" className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500">
              Salva
            </button>
            <button type="button" onClick={() => setShowRevisionForm(false)} className="text-xs text-zinc-500 hover:text-white">
              Annulla
            </button>
          </form>
        )}
      </div>

      {/* Payments */}
      <div>
        <h4 className="text-sm font-medium text-zinc-400 mb-2">Pagamenti</h4>

        {payments.length > 0 ? (
          <div className="space-y-1.5">
            {payments.map((pay) => (
              <div key={pay.id} className="flex items-center gap-3 text-sm">
                <span className="text-zinc-500 w-20 shrink-0">
                  {new Date(pay.paid_at + "T00:00:00").toLocaleDateString("it-IT")}
                </span>
                <span className="font-mono text-white">
                  €{pay.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs ${pay.is_advance ? "text-amber-400" : "text-green-400"}`}>
                  {pay.is_advance ? "Anticipo" : "Saldo"}
                </span>
                {pay.note && <span className="text-zinc-500 text-xs">{pay.note}</span>}
              </div>
            ))}
            <p className="text-xs text-zinc-500 mt-1">
              Totale pagato: €{totalPaid.toLocaleString("it-IT", { minimumFractionDigits: 2 })} / €{currentAmount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Nessun pagamento registrato.</p>
        )}

        {canEdit && !expense.is_fully_paid && (
          <div className="mt-2 flex gap-3">
            {!showPaymentForm && (
              <>
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  + Registra pagamento
                </button>
                {totalPaid >= currentAmount && (
                  <button
                    onClick={() => markFullyPaid(expense.id)}
                    className="text-xs text-green-400 hover:text-green-300"
                  >
                    Segna come saldato
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {showPaymentForm && (
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            action={async (formData) => {
              setError(null);
              const result = await addPayment(formData);
              if (result?.error) setError(result.error);
              else setShowPaymentForm(false);
            }}
          >
            <input type="hidden" name="expense_id" value={expense.id} />
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Importo (€)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                className="w-32 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Data</label>
              <input
                name="paid_at"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white"
              />
            </div>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="is_advance" defaultChecked />
              <span className="text-xs text-zinc-400">Anticipo</span>
            </label>
            <div>
              <input
                name="note"
                type="text"
                placeholder="Nota..."
                className="w-32 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white placeholder-zinc-600"
              />
            </div>
            <button type="submit" className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500">
              Salva
            </button>
            <button type="button" onClick={() => setShowPaymentForm(false)} className="text-xs text-zinc-500 hover:text-white">
              Annulla
            </button>
          </form>
        )}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="pt-3 border-t border-zinc-800 flex gap-3">
          <button
            onClick={async () => {
              if (confirm("Eliminare questa spesa? L'azione è irreversibile.")) {
                const result = await deleteExpense(expense.id);
                if (result?.error) setError(result.error);
              }
            }}
            className="text-xs text-red-400/70 hover:text-red-400"
          >
            Elimina spesa
          </button>
        </div>
      )}
    </div>
  );
}
