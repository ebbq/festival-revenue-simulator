"use client";

import { useState } from "react";
import { saveScenario, deleteScenario } from "./actions";
import { formatItDecimal, formatItInteger } from "@/lib/format-it";

type FestivalDay = { id: string; label: string; date: string };
type Expense = {
  id: string;
  description: string;
  expense_revisions: { amount: number; created_at: string }[];
};
type Revenue = { id: string; description: string; amount: number; status: string };
type FbOperator = {
  id: string;
  name: string;
  type: string;
  fixed_fee: number | null;
  percentage: number | null;
  estimated_avg_spend_per_person: number | null;
  estimated_conversion_rate: number | null;
};
type Scenario = {
  id: string;
  name: string;
  total_attendance: number;
  attendance_per_day: Record<string, number>;
  calculated_total_costs: number;
  calculated_total_revenues: number;
  calculated_margin: number;
  created_at: string;
};

function getCurrentAmount(expense: Expense): number {
  const revisions = [...expense.expense_revisions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return revisions.length > 0 ? revisions[0].amount : 0;
}

function estimateFbRevenue(op: FbOperator, attendance: number): number {
  if (op.type === "fixed_fee") return op.fixed_fee || 0;
  const avgSpend = op.estimated_avg_spend_per_person || 0;
  const conv = (op.estimated_conversion_rate || 0) / 100;
  const estimatedTurnover = attendance * conv * avgSpend;
  if (op.type === "percentage") return estimatedTurnover * ((op.percentage || 0) / 100);
  if (op.type === "internal") return estimatedTurnover;
  return 0;
}

export function ScenarioSimulator({
  editionId,
  festivalDays,
  expenses,
  revenues,
  fbOperators,
  savedScenarios,
  canEdit,
}: {
  editionId: string;
  festivalDays: FestivalDay[];
  expenses: Expense[];
  revenues: Revenue[];
  fbOperators: FbOperator[];
  savedScenarios: Scenario[];
  canEdit: boolean;
}) {
  const [attendancePerDay, setAttendancePerDay] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    festivalDays.forEach((d) => (init[d.id] = 1000));
    return init;
  });
  const [saveName, setSaveName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalAttendance = Object.values(attendancePerDay).reduce((s, v) => s + v, 0);

  // Fixed costs (all expenses)
  const totalFixedCosts = expenses.reduce((s, e) => s + getCurrentAmount(e), 0);

  // F&B revenue (variable with attendance)
  const totalFbRevenue = fbOperators.reduce(
    (s, op) => s + estimateFbRevenue(op, totalAttendance),
    0
  );

  // Fixed revenues (sponsors, grants, etc.)
  const confirmedRevenues = revenues
    .filter((r) => r.status === "confirmed")
    .reduce((s, r) => s + r.amount, 0);
  const potentialRevenues = revenues
    .filter((r) => r.status === "potential")
    .reduce((s, r) => s + r.amount, 0);

  const totalRevenues = confirmedRevenues + totalFbRevenue;
  const totalRevenuesWithPotential = totalRevenues + potentialRevenues;
  const margin = totalRevenues - totalFixedCosts;
  const marginWithPotential = totalRevenuesWithPotential - totalFixedCosts;

  return (
    <div className="space-y-8">
      {/* Attendance sliders */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Presenze attese</h2>
        <div className="space-y-4">
          {festivalDays.map((day) => (
            <div key={day.id}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-500">{day.label}</label>
                <span className="font-mono text-sm">
                  {formatItInteger(attendancePerDay[day.id] || 0)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10000}
                step={100}
                value={attendancePerDay[day.id] || 0}
                onChange={(e) =>
                  setAttendancePerDay((prev) => ({
                    ...prev,
                    [day.id]: parseInt(e.target.value),
                  }))
                }
                className="w-full accent-primary-solid"
              />
            </div>
          ))}
          <p className="text-right text-sm font-medium mt-2">
            Totale: <span className="font-mono">{formatItInteger(totalAttendance)}</span> presenze
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <ResultCard label="Costi totali" value={totalFixedCosts} color="text-red-400" />
        <ResultCard label="Ricavi confermati + F&B" value={totalRevenues} color="text-primary-soft" />
        <ResultCard
          label="Margine"
          value={margin}
          color={margin >= 0 ? "text-primary-soft" : "text-red-400"}
        />
        <ResultCard
          label="Margine (con potenziali)"
          value={marginWithPotential}
          color={marginWithPotential >= 0 ? "text-primary-soft" : "text-red-400"}
        />
      </section>

      {/* Breakdown */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Dettaglio</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Costi</h3>
            <p className="text-sm">
              Spese fisse: <span className="font-mono">€{formatItDecimal(totalFixedCosts)}</span>
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Ricavi</h3>
            <p className="text-sm">
              Confermati (sponsor, contributi, ecc.): <span className="font-mono">€{formatItDecimal(confirmedRevenues)}</span>
            </p>
            <p className="text-sm">
              Potenziali: <span className="font-mono text-primary">€{formatItDecimal(potentialRevenues)}</span>
            </p>
            <p className="text-sm mt-1">
              F&B stimato ({formatItInteger(totalAttendance)} presenze): <span className="font-mono">€{formatItDecimal(totalFbRevenue)}</span>
            </p>
            {fbOperators.length > 0 && (
              <div className="ml-4 mt-1 space-y-0.5">
                {fbOperators.map((op) => (
                  <p key={op.id} className="text-xs text-gray-400">
                    {op.name}: €{formatItDecimal(estimateFbRevenue(op, totalAttendance))}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Save scenario */}
      {canEdit && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Salva scenario</h2>
          <form
            className="flex items-end gap-3"
            action={async (formData) => {
              setError(null);
              const result = await saveScenario(formData);
              if (result?.error) setError(result.error);
              else setSaveName("");
            }}
          >
            <input type="hidden" name="edition_id" value={editionId} />
            <input type="hidden" name="attendance_per_day" value={JSON.stringify(attendancePerDay)} />
            <input type="hidden" name="total_attendance" value={totalAttendance} />
            <input type="hidden" name="calculated_total_costs" value={totalFixedCosts} />
            <input type="hidden" name="calculated_total_revenues" value={totalRevenues} />
            <input type="hidden" name="calculated_margin" value={margin} />
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Nome scenario</label>
              <input
                name="name"
                required
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Es. Pessimistico — 2.000 persone"
                className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-800 placeholder-gray-400"
              />
            </div>
            <button type="submit" className="rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-foreground hover:bg-cta-hover">
              Salva
            </button>
          </form>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </section>
      )}

      {/* Saved scenarios */}
      {savedScenarios.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Scenari salvati</h2>
          <div className="space-y-2">
            {savedScenarios.map((sc) => (
              <div key={sc.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <p className="font-medium">{sc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatItInteger(sc.total_attendance)} presenze ·{" "}
                    {new Date(sc.created_at).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-mono">
                      €{formatItDecimal(sc.calculated_total_revenues)} ricavi
                    </p>
                    <p className={`text-xs font-mono ${sc.calculated_margin >= 0 ? "text-primary-soft" : "text-red-400"}`}>
                      Margine: €{formatItDecimal(sc.calculated_margin)}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={async () => {
                        if (confirm("Eliminare questo scenario?")) {
                          await deleteScenario(sc.id);
                        }
                      }}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      Elimina
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ResultCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-mono font-bold ${color || ""}`}>
        €{formatItDecimal(value)}
      </p>
    </div>
  );
}
