"use client";

import { useState } from "react";
import { addRevision, addPayment, markFullyPaid, deleteExpense, updateExpense } from "./actions";

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
  const [showEditForm, setShowEditForm] = useState(false);
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
    <div className="mx-4 mb-3 rounded-b-xl border border-t-0 border-gray-200 bg-white p-5 space-y-5 shadow-sm">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Gross amount */}
      {expense.vat_applicable && expense.vat_rate && (
        <p className="text-sm text-gray-700">
          Importo lordo: <span className="font-mono font-semibold">€{grossAmount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}</span>
          <span className="text-gray-400 ml-1">(incl. IVA {expense.vat_rate}%)</span>
        </p>
      )}

      {/* Info */}
      {(expense.supplier || expense.notes) && (
        <div className="text-sm space-y-1">
          {expense.supplier && (
            <p className="text-gray-500">
              Fornitore: <span className="text-gray-800">{expense.supplier}</span>
              {expense.supplier_ref && (
                <span className="text-gray-400"> ({expense.supplier_ref})</span>
              )}
            </p>
          )}
          {expense.notes && <p className="text-gray-500">Note: {expense.notes}</p>}
        </div>
      )}

      {/* Edit form */}
      {canEdit && showEditForm && (
        <form
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
          action={async (formData) => {
            setError(null);
            const result = await updateExpense(formData);
            if (result?.error) setError(result.error);
            else setShowEditForm(false);
          }}
        >
          <h4 className="text-sm font-medium text-gray-700">Modifica voce</h4>
          <input type="hidden" name="expense_id" value={expense.id} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descrizione</label>
              <input name="description" type="text" defaultValue={expense.description || ""} className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fornitore</label>
              <input name="supplier" type="text" defaultValue={expense.supplier || ""} className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rif. fornitore</label>
              <input name="supplier_ref" type="text" defaultValue={expense.supplier_ref || ""} className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" name="vat_applicable" defaultChecked={expense.vat_applicable} />
                <span className="text-sm">IVA</span>
              </label>
              <input name="vat_rate" type="number" step="0.01" defaultValue={expense.vat_rate || 22} className="w-20 rounded border border-gray-300 bg-white px-2 py-1.5 text-sm" />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Note</label>
              <input name="notes" type="text" defaultValue={expense.notes || ""} className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-500">Salva</button>
            <button type="button" onClick={() => setShowEditForm(false)} className="text-xs text-gray-500 hover:text-gray-700">Annulla</button>
          </div>
        </form>
      )}

      {/* Revisions timeline */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Storico stanziamenti</h4>
        <div className="space-y-1.5">
          {revisions.map((rev, i) => {
            const prevAmount = i > 0 ? revisions[i - 1].amount : null;
            const diff = prevAmount !== null ? rev.amount - prevAmount : null;
            return (
              <div key={rev.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 w-20 shrink-0">
                  {new Date(rev.created_at).toLocaleDateString("it-IT")}
                </span>
                <span className="font-mono text-gray-800">
                  €{rev.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </span>
                {diff !== null && (
                  <span className={`text-xs ${diff > 0 ? "text-red-500" : "text-green-600"}`}>
                    {diff > 0 ? "+" : ""}€{diff.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </span>
                )}
                {rev.note && <span className="text-gray-400 text-xs">{rev.note}</span>}
              </div>
            );
          })}
        </div>

        {canEdit && !showRevisionForm && (
          <button
            onClick={() => setShowRevisionForm(true)}
            className="mt-2 text-xs text-green-600 hover:text-green-500"
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
              <label className="block text-xs text-gray-500 mb-1">Nuovo importo (€)</label>
              <input name="amount" type="number" step="0.01" required defaultValue={currentAmount} className="w-32 rounded border border-gray-300 bg-white px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Motivo</label>
              <input name="note" type="text" placeholder="Motivo revisione..." className="w-48 rounded border border-gray-300 bg-white px-2 py-1 text-sm placeholder-gray-400" />
            </div>
            <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500">Salva</button>
            <button type="button" onClick={() => setShowRevisionForm(false)} className="text-xs text-gray-500 hover:text-gray-700">Annulla</button>
          </form>
        )}
      </div>

      {/* Payments */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">Pagamenti</h4>

        {payments.length > 0 ? (
          <div className="space-y-1.5">
            {payments.map((pay) => (
              <div key={pay.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 w-20 shrink-0">
                  {new Date(pay.paid_at + "T00:00:00").toLocaleDateString("it-IT")}
                </span>
                <span className="font-mono text-gray-800">
                  €{pay.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs ${pay.is_advance ? "text-sky-600" : "text-green-600"}`}>
                  {pay.is_advance ? "Anticipo" : "Saldo"}
                </span>
                {pay.note && <span className="text-gray-400 text-xs">{pay.note}</span>}
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-1">
              Totale pagato: €{totalPaid.toLocaleString("it-IT", { minimumFractionDigits: 2 })} / €{currentAmount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Nessun pagamento registrato.</p>
        )}

        {canEdit && !expense.is_fully_paid && (
          <div className="mt-2 flex gap-3">
            {!showPaymentForm && (
              <>
                <button onClick={() => setShowPaymentForm(true)} className="text-xs text-green-600 hover:text-green-500">
                  + Registra pagamento
                </button>
                {totalPaid >= currentAmount && (
                  <button onClick={() => markFullyPaid(expense.id)} className="text-xs text-sky-600 hover:text-sky-500">
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
              <label className="block text-xs text-gray-500 mb-1">Importo (€)</label>
              <input name="amount" type="number" step="0.01" required className="w-32 rounded border border-gray-300 bg-white px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data</label>
              <input name="paid_at" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="rounded border border-gray-300 bg-white px-2 py-1 text-sm" />
            </div>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="is_advance" defaultChecked />
              <span className="text-xs text-gray-500">Anticipo</span>
            </label>
            <div>
              <input name="note" type="text" placeholder="Nota..." className="w-32 rounded border border-gray-300 bg-white px-2 py-1 text-sm placeholder-gray-400" />
            </div>
            <button type="submit" className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-500">Salva</button>
            <button type="button" onClick={() => setShowPaymentForm(false)} className="text-xs text-gray-500 hover:text-gray-700">Annulla</button>
          </form>
        )}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="pt-3 border-t border-gray-200 flex gap-4">
          {!showEditForm && (
            <button
              onClick={() => setShowEditForm(true)}
              className="text-xs text-sky-600 hover:text-sky-500"
            >
              Modifica
            </button>
          )}
          <button
            onClick={async () => {
              if (confirm("Eliminare questa voce? L'azione è irreversibile.")) {
                const result = await deleteExpense(expense.id);
                if (result?.error) setError(result.error);
              }
            }}
            className="text-xs text-red-400 hover:text-red-500"
          >
            Elimina
          </button>
        </div>
      )}
    </div>
  );
}
