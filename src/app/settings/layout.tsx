import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-6">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold">Impostazioni</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-6">
        <nav className="mb-8 flex gap-4 border-b border-zinc-800 pb-4">
          <Link
            href="/settings/editions"
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Edizioni e Giorni
          </Link>
          <Link
            href="/settings/categories"
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Categorie Spesa
          </Link>
        </nav>

        {children}
      </div>
    </div>
  );
}
