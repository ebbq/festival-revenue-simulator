"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createRevenue(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("revenues").insert({
    edition_id: formData.get("edition_id") as string,
    category: formData.get("category") as string,
    description: formData.get("description") as string,
    amount: parseFloat(formData.get("amount") as string),
    status: formData.get("status") as string,
    expected_date: (formData.get("expected_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/revenues");
}

export async function updateRevenue(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("revenues")
    .update({
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
      status: formData.get("status") as string,
      expected_date: (formData.get("expected_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/revenues");
}

export async function deleteRevenue(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("revenues").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/revenues");
}
