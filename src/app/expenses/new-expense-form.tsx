"use client";

import { useState } from "react";
import { createExpense } from "./actions";

type Category = {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
};

type FestivalDay = {
  id: string;
  label: string;
  date: string;
};

export function NewExpenseForm({
  editionId,
  categories,
  festivalDays,
}: {
  editionId: string;
  categories: Category[];
  festivalDays: FestivalDay[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFestivalWide, setIsFestivalWide] = useState(true);
  const [vatApplicable, setVatApplicable] = useState(false);

  const level1 = categories.filter((c) => c.level === 1);

  function getCategoryOptions() {
    const options: { value: string; label: string }[] = [];
    for (const l1 of level1) {
      options.push({ value: l1.id, label: l1.name });
      const l2s = categories.filter((c) => c.parent_id === l1.id);
      for (const l2 of l2s) {
        options.push({ value: l2.id, label: `  ${l1.name} › ${l2.name}` });
        const l3s = categories.filter((c) => c.parent_id === l2.id);
        for (const l3 of l3s) {
          options.push({
            value: l3.id,
            label: `    ${l1.name} › ${l2.name} › ${l3.name}`,
          });
        }
      }
    }
    return options;
  }

  if (!open) {
    return (
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
        >
          + Nuova voce
        </button>
      </div>
    );
  }

  const categoryOptions = getCategoryOptions();

  return (
    <form
      className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4"
      action={async (formData) => {
        setError(null);
        const result = await createExpense(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setOpen(false);
          setIsFestivalWide(true);
          setVatApplicable(false);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Nuova voce di spesa</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-500 hover:text-white"
        >
          Annulla
        </button>
      </div>

      <p className="text-xs text-zinc-500">Lascia la descrizione vuota per creare un budget da allocare.</p>

      <input type="hidden" name="edition_id" value={editionId} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Descrizione (vuoto = budget)</label>
          <input
            name="description"
            type="text"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600"
            placeholder="Es. Noleggio palco principale"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Categoria *</label>
          <select
            name="category_id"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
          >
            <option value="">Seleziona...</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Importo (€) *</label>
          <input
            name="initial_amount"
            type="number"
            step="0.01"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Fornitore</label>
          <input
            name="supplier"
            type="text"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600"
            placeholder="Nome fornitore"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Rif. fornitore</label>
          <input
            name="supplier_ref"
            type="text"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600"
            placeholder="N. preventivo, contratto..."
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="vat_applicable"
              checked={vatApplicable}
              onChange={(e) => setVatApplicable(e.target.checked)}
              className="rounded border-zinc-700"
            />
            <span className="text-sm text-zinc-300">IVA applicabile</span>
          </label>
          {vatApplicable && (
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Aliquota IVA (%)</label>
              <input
                name="vat_rate"
                type="number"
                step="0.01"
                defaultValue="22"
                className="w-24 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_festival_wide"
            checked={isFestivalWide}
            onChange={(e) => setIsFestivalWide(e.target.checked)}
          />
          <span className="text-sm text-zinc-300">Spesa per tutto il festival</span>
        </label>

        {!isFestivalWide && festivalDays.length > 0 && (
          <div className="flex flex-wrap gap-3 ml-6">
            {festivalDays.map((day) => (
              <label key={day.id} className="flex items-center gap-1.5">
                <input type="checkbox" name="day_ids" value={day.id} />
                <span className="text-sm text-zinc-400">{day.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">Note</label>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600"
          placeholder="Note aggiuntive..."
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
      >
        Crea voce
      </button>
    </form>
  );
}
