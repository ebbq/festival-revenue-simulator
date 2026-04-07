import { getProfile } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function Home() {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">EBBQ</h1>
          <p className="text-xs text-zinc-400">Festival Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="text-zinc-300">{profile.email}</p>
            <p className="text-xs text-zinc-500 capitalize">{profile.role}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
            >
              Esci
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold mb-8">Dashboard</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Spese"
            description="Gestisci il piano di spesa"
            href="/expenses"
          />
          <DashboardCard
            title="Ricavi"
            description="Sponsor, contributi, merch"
            href="/revenues"
          />
          <DashboardCard
            title="Ristorazione"
            description="Operatori F&B e simulazioni"
            href="/fb"
          />
          <DashboardCard
            title="Scenari"
            description="Simula incassi e margini"
            href="/scenarios"
          />
          {profile.role === "admin" && (
            <DashboardCard
              title="Impostazioni"
              description="Edizioni, giorni, categorie, utenti"
              href="/settings"
            />
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-amber-600/50 hover:bg-zinc-900/80 transition-colors"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </a>
  );
}
