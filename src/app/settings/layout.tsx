import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EbbqLogo } from "@/components/ebbq-logo";

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
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 sm:gap-6">
          <EbbqLogo href="/" heightClass="h-7" />
          <Link href="/" className="text-gray-400 hover:text-gray-700 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-primary-dark">Impostazioni</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-6">
        <nav className="mb-8 flex gap-4 border-b border-gray-200 pb-4">
          <Link
            href="/settings/editions"
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            Edizioni e Giorni
          </Link>
          <Link
            href="/settings/categories"
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            Categorie Spesa
          </Link>
        </nav>

        {children}
      </div>
    </div>
  );
}
