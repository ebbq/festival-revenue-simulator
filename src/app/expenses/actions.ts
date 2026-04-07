"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  const supabase = await createClient();

  const edition_id = formData.get("edition_id") as string;
  const category_id = formData.get("category_id") as string;
  const description = (formData.get("description") as string) || null;
  const supplier = (formData.get("supplier") as string) || null;
  const supplier_ref = (formData.get("supplier_ref") as string) || null;
  const vat_applicable = formData.get("vat_applicable") === "on";
  const vat_rate_raw = formData.get("vat_rate") as string;
  const vat_rate = vat_applicable && vat_rate_raw ? parseFloat(vat_rate_raw) : null;
  const initial_amount = parseFloat(formData.get("initial_amount") as string);
  const notes = (formData.get("notes") as string) || null;
  const is_budget = !description || description.trim() === "";

  // Day assignments
  const is_festival_wide = formData.get("is_festival_wide") === "on";
  const day_ids = formData.getAll("day_ids") as string[];

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      edition_id,
      category_id,
      description,
      supplier,
      supplier_ref,
      vat_applicable,
      vat_rate,
      is_festival_wide,
      is_budget,
      notes,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("expense_revisions").insert({
    expense_id: expense.id,
    amount: initial_amount,
    note: is_budget ? "Budget iniziale" : "Stanziamento iniziale",
  });

  if (!is_festival_wide && day_ids.length > 0) {
    await supabase.from("expense_day_assignments").insert(
      day_ids.map((day_id) => ({
        expense_id: expense.id,
        festival_day_id: day_id,
      }))
    );
  }

  revalidatePath("/expenses");
}

export async function addRevision(formData: FormData) {
  const supabase = await createClient();

  const expense_id = formData.get("expense_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const note = (formData.get("note") as string) || null;

  const { error } = await supabase.from("expense_revisions").insert({
    expense_id,
    amount,
    note,
  });

  if (error) return { error: error.message };
  revalidatePath("/expenses");
}

export async function addPayment(formData: FormData) {
  const supabase = await createClient();

  const expense_id = formData.get("expense_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paid_at = formData.get("paid_at") as string;
  const is_advance = formData.get("is_advance") === "on";
  const note = (formData.get("note") as string) || null;

  const { error } = await supabase.from("expense_payments").insert({
    expense_id,
    amount,
    paid_at,
    is_advance,
    note,
  });

  if (error) return { error: error.message };
  revalidatePath("/expenses");
}

export async function markFullyPaid(expenseId: string) {
  const supabase = await createClient();

  await supabase
    .from("expenses")
    .update({ is_fully_paid: true, paid_at: new Date().toISOString().split("T")[0] })
    .eq("id", expenseId);

  revalidatePath("/expenses");
}

export async function toggleBudget(expenseId: string, isBudget: boolean) {
  const supabase = await createClient();

  await supabase
    .from("expenses")
    .update({ is_budget: isBudget })
    .eq("id", expenseId);

  revalidatePath("/expenses");
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) return { error: error.message };
  revalidatePath("/expenses");
}

export async function updateExpense(formData: FormData) {
  const supabase = await createClient();

  const expense_id = formData.get("expense_id") as string;
  const description = (formData.get("description") as string) || null;
  const supplier = (formData.get("supplier") as string) || null;
  const supplier_ref = (formData.get("supplier_ref") as string) || null;
  const vat_applicable = formData.get("vat_applicable") === "on";
  const vat_rate_raw = formData.get("vat_rate") as string;
  const vat_rate = vat_applicable && vat_rate_raw ? parseFloat(vat_rate_raw) : null;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabase
    .from("expenses")
    .update({ description, supplier, supplier_ref, vat_applicable, vat_rate, notes })
    .eq("id", expense_id);

  if (error) return { error: error.message };
  revalidatePath("/expenses");
}
