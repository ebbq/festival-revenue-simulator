import { createClient } from "@/lib/supabase/server";
import { EditionForm } from "./edition-form";
import { DayForm } from "./day-form";
import { EditionCard } from "./edition-card";

export default async function EditionsPage() {
  const supabase = await createClient();

  const { data: editions } = await supabase
    .from("editions")
    .select("*, festival_days(*)")
    .order("year", { ascending: false });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">Edizioni</h2>
        <EditionForm />

        <div className="mt-6 space-y-4">
          {editions?.map((edition) => (
            <EditionCard
              key={edition.id}
              edition={edition}
              days={edition.festival_days || []}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
