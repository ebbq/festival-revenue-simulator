"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveScenario(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("scenarios").insert({
    edition_id: formData.get("edition_id") as string,
    name: formData.get("name") as string,
    attendance_per_day: JSON.parse(formData.get("attendance_per_day") as string),
    total_attendance: parseInt(formData.get("total_attendance") as string),
    calculated_total_costs: parseFloat(formData.get("calculated_total_costs") as string),
    calculated_total_revenues: parseFloat(formData.get("calculated_total_revenues") as string),
    calculated_margin: parseFloat(formData.get("calculated_margin") as string),
    notes: (formData.get("notes") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/scenarios");
}

export async function deleteScenario(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("scenarios").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/scenarios");
}
