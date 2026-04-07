"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createEdition(formData: FormData) {
  const supabase = await createClient();
  const year = parseInt(formData.get("year") as string);
  const name = formData.get("name") as string;

  const { error } = await supabase.from("editions").insert({ year, name });

  if (error) return { error: error.message };
  revalidatePath("/settings/editions");
}

export async function setCurrentEdition(editionId: string) {
  const supabase = await createClient();

  // Reset all
  await supabase.from("editions").update({ is_current: false }).neq("id", "");
  // Set selected
  await supabase
    .from("editions")
    .update({ is_current: true })
    .eq("id", editionId);

  revalidatePath("/settings/editions");
}


export async function addFestivalDay(formData: FormData) {
  const supabase = await createClient();
  const edition_id = formData.get("edition_id") as string;
  const label = formData.get("label") as string;
  const date = formData.get("date") as string;

  // Get next sort_order
  const { data: existing } = await supabase
    .from("festival_days")
    .select("sort_order")
    .eq("edition_id", edition_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sort_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase
    .from("festival_days")
    .insert({ edition_id, label, date, sort_order });

  if (error) return { error: error.message };
  revalidatePath("/settings/editions");
}

export async function toggleEditionComparison(editionId: string, enabled: boolean) {
  const supabase = await createClient();

  await supabase
    .from("editions")
    .update({ show_edition_comparison: enabled })
    .eq("id", editionId);

  revalidatePath("/settings/editions");
  revalidatePath("/expenses");
}

export async function deleteFestivalDay(dayId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("festival_days").delete().eq("id", dayId);

  if (error) return { error: error.message };
  revalidatePath("/settings/editions");
}
