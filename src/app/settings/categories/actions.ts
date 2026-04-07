"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const edition_id = formData.get("edition_id") as string;
  const parent_id = formData.get("parent_id") as string | null;
  const name = formData.get("name") as string;
  const level = parseInt(formData.get("level") as string);

  const { error } = await supabase.from("expense_categories").insert({
    edition_id,
    parent_id: parent_id || null,
    name,
    level,
  });

  if (error) return { error: error.message };
  revalidatePath("/settings/categories");
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expense_categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    if (error.message.includes("violates foreign key")) {
      return { error: "Non puoi eliminare una categoria che ha sottocategorie o spese collegate." };
    }
    return { error: error.message };
  }
  revalidatePath("/settings/categories");
}

export async function renameCategory(categoryId: string, newName: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expense_categories")
    .update({ name: newName })
    .eq("id", categoryId);

  if (error) return { error: error.message };
  revalidatePath("/settings/categories");
}
