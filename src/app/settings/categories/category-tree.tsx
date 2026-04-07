"use client";

import { useState } from "react";

type Category = {
  id: string;
  edition_id: string;
  parent_id: string | null;
  name: string;
  level: number;
  sort_order: number;
};

export function CategoryTree({
  categories,
  editionId,
  onCreate,
  onDelete,
  onRename,
}: {
  categories: Category[];
  editionId: string;
  onCreate: (formData: FormData) => Promise<{ error: string } | undefined>;
  onDelete: (id: string) => Promise<{ error: string } | undefined>;
  onRename: (id: string, newName: string) => Promise<{ error: string } | undefined>;
}) {
  const [error, setError] = useState<string | null>(null);

  const level1 = categories.filter((c) => c.level === 1);

  function getChildren(parentId: string) {
    return categories.filter((c) => c.parent_id === parentId);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {level1.map((l1) => (
        <div key={l1.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <CategoryRow
            category={l1}
            onDelete={async () => {
              setError(null);
              const res = await onDelete(l1.id);
              if (res?.error) setError(res.error);
            }}
            onRename={async (name) => {
              const res = await onRename(l1.id, name);
              if (res?.error) setError(res.error);
            }}
          />

          <div className="ml-4 mt-2 space-y-2">
            {getChildren(l1.id).map((l2) => (
              <div key={l2.id} className="border-l border-zinc-800 pl-4">
                <CategoryRow
                  category={l2}
                  onDelete={async () => {
                    setError(null);
                    const res = await onDelete(l2.id);
                    if (res?.error) setError(res.error);
                  }}
                  onRename={async (name) => {
                    const res = await onRename(l2.id, name);
                    if (res?.error) setError(res.error);
                  }}
                />

                <div className="ml-4 mt-1 space-y-1">
                  {getChildren(l2.id).map((l3) => (
                    <div key={l3.id} className="border-l border-zinc-700 pl-4">
                      <CategoryRow
                        category={l3}
                        onDelete={async () => {
                          setError(null);
                          const res = await onDelete(l3.id);
                          if (res?.error) setError(res.error);
                        }}
                        onRename={async (name) => {
                          const res = await onRename(l3.id, name);
                          if (res?.error) setError(res.error);
                        }}
                      />
                    </div>
                  ))}
                  {/* Add Level 3 */}
                  <AddCategoryInline
                    editionId={editionId}
                    parentId={l2.id}
                    level={3}
                    onCreate={onCreate}
                    onError={setError}
                  />
                </div>
              </div>
            ))}
            {/* Add Level 2 */}
            <AddCategoryInline
              editionId={editionId}
              parentId={l1.id}
              level={2}
              onCreate={onCreate}
              onError={setError}
            />
          </div>
        </div>
      ))}

      {/* Add Level 1 */}
      <AddCategoryInline
        editionId={editionId}
        parentId={null}
        level={1}
        onCreate={onCreate}
        onError={setError}
        label="+ Nuova categoria principale"
      />
    </div>
  );
}

function CategoryRow({
  category,
  onDelete,
  onRename,
}: {
  category: Category;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  const sizeClass =
    category.level === 1
      ? "text-base font-semibold"
      : category.level === 2
        ? "text-sm font-medium"
        : "text-sm text-zinc-300";

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-sm text-white"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRename(name);
              setEditing(false);
            }
            if (e.key === "Escape") {
              setName(category.name);
              setEditing(false);
            }
          }}
        />
        <button
          onClick={() => {
            onRename(name);
            setEditing(false);
          }}
          className="text-xs text-amber-400"
        >
          Salva
        </button>
        <button
          onClick={() => {
            setName(category.name);
            setEditing(false);
          }}
          className="text-xs text-zinc-500"
        >
          Annulla
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between py-0.5">
      <span className={sizeClass}>{category.name}</span>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Rinomina
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-zinc-500 hover:text-red-400"
        >
          Elimina
        </button>
      </div>
    </div>
  );
}

function AddCategoryInline({
  editionId,
  parentId,
  level,
  onCreate,
  onError,
  label,
}: {
  editionId: string;
  parentId: string | null;
  level: number;
  onCreate: (formData: FormData) => Promise<{ error: string } | undefined>;
  onError: (err: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const defaultLabel =
    level === 1
      ? "+ Nuova categoria principale"
      : level === 2
        ? "+ Sottocategoria"
        : "+ Voce";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 text-xs text-amber-400/70 hover:text-amber-300 transition-colors"
      >
        {label || defaultLabel}
      </button>
    );
  }

  return (
    <form
      className="mt-1 flex items-center gap-2"
      action={async (formData) => {
        const result = await onCreate(formData);
        if (result?.error) {
          onError(result.error);
        } else {
          setOpen(false);
        }
      }}
    >
      <input type="hidden" name="edition_id" value={editionId} />
      <input type="hidden" name="parent_id" value={parentId || ""} />
      <input type="hidden" name="level" value={level} />
      <input
        name="name"
        type="text"
        required
        autoFocus
        placeholder="Nome..."
        className="w-48 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-sm text-white placeholder-zinc-600"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <button
        type="submit"
        className="rounded bg-amber-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-amber-500"
      >
        Crea
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-zinc-500 hover:text-white"
      >
        Annulla
      </button>
    </form>
  );
}
