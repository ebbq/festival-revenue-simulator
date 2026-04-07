"use client";

import { useState } from "react";
import { createFbOperator, saveFbActuals, deleteFbOperator } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  fixed_fee: "Fee fissa",
  percentage: "Percentuale",
  internal: "Interno",
};

type FbActual = {
  id: string;
  actual_revenue: number | null;
  actual_cost: number | null;
  actual_fee_paid: number | null;
  notes: string | null;
};

type FbOperator = {
  id: string;
  name: string;
  type: string;
  fixed_fee: number | null;
  percentage: number | null;
  estimated_avg_spend_per_person: number | null;
  estimated_conversion_rate: number | null;
  notes: string | null;
  fb_actuals: FbActual[];
};

export function FbOperatorList({
  operators,
  editionId,
  canEdit,
}: {
  operators: FbOperator[];
  editionId: string;
  canEdit: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("fixed_fee");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Budget estimates
  function estimateRevenue(op: FbOperator, attendance: number): number {
    if (op.type === "fixed_fee") return op.fixed_fee || 0;
    if (op.type === "percentage") {
      const avgSpend = op.estimated_avg_spend_per_person || 0;
      const conv = (op.estimated_conversion_rate || 0) / 100;
      const estimatedTurnover = attendance * conv * avgSpend;
      return estimatedTurnover * ((op.percentage || 0) / 100);
    }
    if (op.type === "internal") {
      const avgSpend = op.estimated_avg_spend_per_person || 0;
      const conv = (op.estimated_conversion_rate || 0) / 100;
      return attendance * conv * avgSpend;
    }
    return 0;
  }

  const totalBudgetRevenue = operators.reduce((s, op) => s + estimateRevenue(op, 3000), 0);
  const totalActualRevenue = operators.reduce((s, op) => {
    const actual = op.fb_actuals[0];
    if (!actual) return s;
    if (op.type === "fixed_fee") return s + (op.fixed_fee || 0);
    return s + (actual.actual_fee_paid || 0);
  }, 0);

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Operatori</p>
          <p className="mt-1 text-lg font-semibold">{operators.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Stima ricavi F&B (3.000 presenze)</p>
          <p className="mt-1 text-lg font-mono font-semibold">
            €{totalBudgetRevenue.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Consuntivo ricavi F&B</p>
          <p className="mt-1 text-lg font-mono font-semibold text-green-400">
            €{totalActualRevenue.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {canEdit && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
        >
          + Nuovo operatore
        </button>
      )}

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {showForm && (
        <form
          className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
          action={async (formData) => {
            setError(null);
            const result = await createFbOperator(formData);
            if (result?.error) setError(result.error);
            else setShowForm(false);
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Nuovo operatore F&B</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-zinc-500 hover:text-white">Annulla</button>
          </div>
          <input type="hidden" name="edition_id" value={editionId} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Nome *</label>
              <input name="name" required className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Tipo *</label>
              <select name="type" value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                <option value="fixed_fee">Fee fissa</option>
                <option value="percentage">Percentuale</option>
                <option value="internal">Interno</option>
              </select>
            </div>

            {formType === "fixed_fee" && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Fee fissa (€)</label>
                <input name="fixed_fee" type="number" step="0.01" className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
              </div>
            )}

            {formType === "percentage" && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Percentuale (%)</label>
                <input name="percentage" type="number" step="0.01" className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
              </div>
            )}

            {(formType === "percentage" || formType === "internal") && (
              <>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Spesa media €/persona</label>
                  <input name="estimated_avg_spend_per_person" type="number" step="0.01" className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Tasso conversione (%)</label>
                  <input name="estimated_conversion_rate" type="number" step="0.01" className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" placeholder="Es. 30 = 30% del pubblico" />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Note</label>
              <input name="notes" className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600" />
            </div>
          </div>

          <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500">
            Crea operatore
          </button>
        </form>
      )}

      {/* Operator cards */}
      <div className="space-y-2">
        {operators.map((op) => {
          const actual = op.fb_actuals[0] || null;
          const isExpanded = expandedId === op.id;

          return (
            <div key={op.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : op.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  isExpanded ? "border-amber-600/30 bg-zinc-900" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{op.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {TYPE_LABELS[op.type]}
                      {op.type === "fixed_fee" && op.fixed_fee && ` · €${op.fixed_fee.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`}
                      {op.type === "percentage" && op.percentage && ` · ${op.percentage}%`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">
                      Stima: €{estimateRevenue(op, 3000).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                    </p>
                    {actual && actual.actual_fee_paid != null && (
                      <p className="text-xs text-green-400">
                        Consuntivo: €{actual.actual_fee_paid.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && canEdit && (
                <div className="ml-4 mr-4 mb-2 rounded-b-lg border border-t-0 border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
                  <h4 className="text-sm font-medium text-zinc-400">Consuntivo</h4>
                  <form
                    className="grid grid-cols-1 gap-3 md:grid-cols-3"
                    action={async (formData) => {
                      setError(null);
                      const result = await saveFbActuals(formData);
                      if (result?.error) setError(result.error);
                    }}
                  >
                    <input type="hidden" name="fb_operator_id" value={op.id} />
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Fatturato reale (€)</label>
                      <input name="actual_revenue" type="number" step="0.01" defaultValue={actual?.actual_revenue ?? ""} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white" />
                    </div>
                    {op.type === "internal" && (
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Costo reale (€)</label>
                        <input name="actual_cost" type="number" step="0.01" defaultValue={actual?.actual_cost ?? ""} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Fee pagata a EBBQ (€)</label>
                      <input name="actual_fee_paid" type="number" step="0.01" defaultValue={actual?.actual_fee_paid ?? ""} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white" />
                    </div>
                    <div className="md:col-span-3 flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-zinc-500 mb-1">Note</label>
                        <input name="notes" defaultValue={actual?.notes ?? ""} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white" />
                      </div>
                      <button type="submit" className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500">Salva</button>
                    </div>
                  </form>

                  <button
                    onClick={async () => {
                      if (confirm("Eliminare questo operatore?")) {
                        const result = await deleteFbOperator(op.id);
                        if (result?.error) setError(result.error);
                        else setExpandedId(null);
                      }
                    }}
                    className="text-xs text-red-400/70 hover:text-red-400"
                  >
                    Elimina operatore
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {operators.length === 0 && (
          <p className="text-center py-8 text-zinc-500">Nessun operatore F&B registrato.</p>
        )}
      </div>
    </div>
  );
}
