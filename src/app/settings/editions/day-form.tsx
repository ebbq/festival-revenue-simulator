"use client";

import { useState } from "react";
import { addFestivalDay } from "./actions";

export function DayForm({ editionId }: { editionId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
      >
        + Aggiungi giorno
      </button>
    );
  }

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3 rounded border border-zinc-700 bg-zinc-800/50 p-3"
      action={async (formData) => {
        setError(null);
        const result = await addFestivalDay(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setOpen(false);
        }
      }}
    >
      <input type="hidden" name="edition_id" value={editionId} />
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Nome</label>
        <input
          name="label"
          type="text"
          required
          placeholder="Venerdì"
          className="w-32 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white placeholder-zinc-600"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Data</label>
        <input
          name="date"
          type="date"
          required
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500 transition-colors"
      >
        Aggiungi
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-zinc-500 hover:text-white transition-colors"
      >
        Annulla
      </button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
