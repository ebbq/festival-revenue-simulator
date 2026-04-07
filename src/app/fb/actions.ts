"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFbOperator(formData: FormData) {
  const supabase = await createClient();
  const type = formData.get("type") as string;

  const { error } = await supabase.from("fb_operators").insert({
    edition_id: formData.get("edition_id") as string,
    name: formData.get("name") as string,
    type,
    fixed_fee: type === "fixed_fee" ? parseFloat(formData.get("fixed_fee") as string) : null,
    percentage: type === "percentage" ? parseFloat(formData.get("percentage") as string) : null,
    estimated_avg_spend_per_person: formData.get("estimated_avg_spend_per_person")
      ? parseFloat(formData.get("estimated_avg_spend_per_person") as string)
      : null,
    estimated_conversion_rate: formData.get("estimated_conversion_rate")
      ? parseFloat(formData.get("estimated_conversion_rate") as string)
      : null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/fb");
}

export async function saveFbActuals(formData: FormData) {
  const supabase = await createClient();
  const fb_operator_id = formData.get("fb_operator_id") as string;

  // Upsert — check if actuals exist
  const { data: existing } = await supabase
    .from("fb_actuals")
    .select("id")
    .eq("fb_operator_id", fb_operator_id)
    .single();

  const payload = {
    fb_operator_id,
    actual_revenue: formData.get("actual_revenue") ? parseFloat(formData.get("actual_revenue") as string) : null,
    actual_cost: formData.get("actual_cost") ? parseFloat(formData.get("actual_cost") as string) : null,
    actual_fee_paid: formData.get("actual_fee_paid") ? parseFloat(formData.get("actual_fee_paid") as string) : null,
    notes: (formData.get("notes") as string) || null,
  };

  if (existing) {
    const { error } = await supabase
      .from("fb_actuals")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("fb_actuals").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/fb");
}

export async function deleteFbOperator(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fb_operators").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/fb");
}
