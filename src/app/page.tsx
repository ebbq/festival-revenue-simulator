import { getProfile } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function Home() {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-green-700">EBBQ</h1>
          <p className="text-xs text-gray-500">Festival Management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="text-gray-700">{profile.email}</p>
            <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
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
            color="green"
          />
          <DashboardCard
            title="Ricavi"
            description="Sponsor, contributi, merch"
            href="/revenues"
            color="sky"
          />
          <DashboardCard
            title="Ristorazione"
            description="Operatori F&B e simulazioni"
            href="/fb"
            color="green"
          />
          <DashboardCard
            title="Scenari"
            description="Simula incassi e margini"
            href="/scenarios"
            color="sky"
          />
          {profile.role === "admin" && (
            <DashboardCard
              title="Impostazioni"
              description="Edizioni, giorni, categorie, utenti"
              href="/settings"
              color="gray"
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
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: "green" | "sky" | "gray";
}) {
  const borderHover =
    color === "green"
      ? "hover:border-green-400"
      : color === "sky"
        ? "hover:border-sky-400"
        : "hover:border-gray-400";

  return (
    <a
      href={href}
      className={`block rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${borderHover} transition-colors`}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </a>
  );
}
