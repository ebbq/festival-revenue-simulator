"use client";

import { useState } from "react";
import { createEdition } from "./actions";

export function EditionForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
      >
        + Nuova edizione
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
      action={async (formData) => {
        setError(null);
        const result = await createEdition(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setOpen(false);
        }
      }}
    >
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Anno</label>
        <input
          name="year"
          type="number"
          required
          defaultValue={new Date().getFullYear()}
          className="w-24 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Nome</label>
        <input
          name="name"
          type="text"
          required
          placeholder="EBBQ 2026"
          className="w-48 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white placeholder-zinc-600"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
      >
        Crea
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-zinc-500 hover:text-white transition-colors"
      >
        Annulla
      </button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
