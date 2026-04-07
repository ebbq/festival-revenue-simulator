import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "editor" | "viewer";
};

export async function getProfile(): Promise<UserProfile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return profile as UserProfile;
}
