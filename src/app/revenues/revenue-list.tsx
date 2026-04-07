"use client";

import { useState } from "react";
import { createRevenue, deleteRevenue } from "./actions";

const CATEGORY_LABELS: Record<string, string> = {
  sponsor: "Sponsor",
  grants: "Contributi pubblici",
  merch: "Merch",
  other: "Altro",
};

type Revenue = {
  id: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  expected_date: string | null;
  notes: string | null;
};

export function RevenueList({
  revenues,
  editionId,
  canEdit,
}: {
  revenues: Revenue[];
  editionId: string;
  canEdit: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = revenues.filter((r) => r.status === "confirmed");
  const potential = revenues.filter((r) => r.status === "potential");
  const totalConfirmed = confirmed.reduce((s, r) => s + r.amount, 0);
  const totalPotential = potential.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <SummaryCard label="Confermati" value={totalConfirmed} color="text-green-400" />
        <SummaryCard label="Potenziali" value={totalPotential} color="text-amber-400" />
        <SummaryCard label="Totale" value={totalConfirmed + totalPotential} />
      </div>

      {canEdit && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
        >
          + Nuovo ricavo
        </button>
      )}

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {showForm && (
        <form
          className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
          action={async (formData) => {
            setError(null);
            const result = await createRevenue(formData);
            if (result?.error) setError(result.error);
            else setShowForm(false);
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Nuovo ricavo</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-zinc-500 hover:text-white">Annulla</button>
          </div>
          <input type="hidden" name="edition_id" value={editionId} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Descrizione *</label>
              <input name="description" type="text" required className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Categoria *</label>
              <select name="category" required className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Importo (€) *</label>
              <input name="amount" type="number" step="0.01" required className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Stato *</label>
              <select name="status" required className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                <option value="confirmed">Confermato</option>
                <option value="potential">Potenziale</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Data incasso prevista</label>
              <input name="expected_date" type="date" className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Note</label>
              <input name="notes" type="text" className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600" />
            </div>
          </div>

          <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500">
            Crea ricavo
          </button>
        </form>
      )}

      {/* Table */}
      <div className="space-y-2">
        {revenues.map((rev) => (
          <div key={rev.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{rev.description}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {CATEGORY_LABELS[rev.category] || rev.category}
                {rev.expected_date && (
                  <> · Incasso previsto: {new Date(rev.expected_date + "T00:00:00").toLocaleDateString("it-IT")}</>
                )}
                {rev.notes && <> · {rev.notes}</>}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                rev.status === "confirmed"
                  ? "bg-green-400/10 text-green-400"
                  : "bg-amber-400/10 text-amber-400"
              }`}>
                {rev.status === "confirmed" ? "Confermato" : "Potenziale"}
              </span>
              <span className="font-mono font-medium">
                €{rev.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
              </span>
              {canEdit && (
                <button
                  onClick={async () => {
                    if (confirm("Eliminare questo ricavo?")) {
                      const result = await deleteRevenue(rev.id);
                      if (result?.error) setError(result.error);
                    }
                  }}
                  className="text-xs text-zinc-600 hover:text-red-400"
                >
                  Elimina
                </button>
              )}
            </div>
          </div>
        ))}

        {revenues.length === 0 && (
          <p className="text-center py-8 text-zinc-500">Nessun ricavo registrato.</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-mono font-semibold ${color || ""}`}>
        €{value.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
