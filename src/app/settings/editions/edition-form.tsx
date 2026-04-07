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
        className="text-sm text-primary hover:text-primary-solid transition-colors"
      >
        + Nuova edizione
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
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
        <label className="block text-xs text-gray-400 mb-1">Anno</label>
        <input
          name="year"
          type="number"
          required
          defaultValue={new Date().getFullYear()}
          className="w-24 rounded border border-gray-300 bg-gray-100 px-2 py-1.5 text-sm text-gray-800"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Nome</label>
        <input
          name="name"
          type="text"
          required
          placeholder="EBBQ 2026"
          className="w-48 rounded border border-gray-300 bg-gray-100 px-2 py-1.5 text-sm text-gray-800 placeholder-gray-400"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-primary-solid px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-solid-hover transition-colors"
      >
        Crea
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-gray-400 hover:text-gray-800 transition-colors"
      >
        Annulla
      </button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
