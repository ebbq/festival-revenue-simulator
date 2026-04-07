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
        className="mt-2 text-xs text-primary hover:text-primary-solid transition-colors"
      >
        + Aggiungi giorno
      </button>
    );
  }

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3 rounded border border-gray-300 bg-gray-50 p-3"
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
        <label className="block text-xs text-gray-400 mb-1">Nome</label>
        <input
          name="label"
          type="text"
          required
          placeholder="Venerdì"
          className="w-32 rounded border border-gray-300 bg-gray-100 px-2 py-1 text-sm text-gray-800 placeholder-gray-400"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Data</label>
        <input
          name="date"
          type="date"
          required
          className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-sm text-gray-800"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-primary-solid px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-solid-hover transition-colors"
      >
        Aggiungi
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-gray-400 hover:text-gray-800 transition-colors"
      >
        Annulla
      </button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
