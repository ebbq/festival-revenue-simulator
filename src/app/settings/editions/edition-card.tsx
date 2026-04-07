"use client";

import { setCurrentEdition, deleteFestivalDay, toggleEditionComparison } from "./actions";
import { DayForm } from "./day-form";

type FestivalDay = {
  id: string;
  label: string;
  date: string;
  sort_order: number;
};

type Edition = {
  id: string;
  name: string;
  year: number;
  is_current: boolean;
  show_edition_comparison: boolean;
};

export function EditionCard({
  edition,
  days,
}: {
  edition: Edition;
  days: FestivalDay[];
}) {
  const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div
      className={`rounded-xl border p-5 bg-white shadow-sm ${
        edition.is_current ? "border-primary/40" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-800">
            {edition.name}
            {edition.is_current && (
              <span className="ml-2 rounded-full bg-primary-subtle px-2 py-0.5 text-xs text-primary-dark">
                Corrente
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-400">Anno {edition.year}</p>
        </div>
        {!edition.is_current && (
          <button
            onClick={() => setCurrentEdition(edition.id)}
            className="text-sm text-gray-400 hover:text-primary transition-colors"
          >
            Imposta come corrente
          </button>
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={edition.show_edition_comparison}
            onChange={(e) => toggleEditionComparison(edition.id, e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-500">Mostra confronto con edizione precedente nelle spese</span>
        </label>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <h4 className="text-sm font-medium text-gray-500 mb-3">Giorni del festival</h4>

        {sortedDays.map((day) => (
          <div
            key={day.id}
            className="flex items-center justify-between py-1.5 text-sm"
          >
            <span className="text-gray-700">
              {day.label}{" "}
              <span className="text-gray-400">
                ({new Date(day.date + "T00:00:00").toLocaleDateString("it-IT")})
              </span>
            </span>
            <button
              onClick={() => deleteFestivalDay(day.id)}
              className="text-gray-300 hover:text-red-500 text-xs transition-colors"
            >
              Rimuovi
            </button>
          </div>
        ))}

        <DayForm editionId={edition.id} />
      </div>
    </div>
  );
}
