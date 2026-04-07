import { createClient } from "@supabase/supabase-js";

export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let status = "disconnected";
  let error = "";

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error: dbError } = await supabase.from("_health_check").select("*").limit(1);
      // A "relation does not exist" error still means the connection works
      if (!dbError || dbError.message?.includes("does not exist")) {
        status = "connected";
      } else {
        error = dbError.message;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
  } else {
    error = "Missing environment variables";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white font-sans">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">EBBQ Festival</h1>
        <p className="text-zinc-400 text-lg">Revenue Simulator</p>

        <div className="mt-8 space-y-3 text-sm">
          <div className="flex items-center justify-center gap-2">
            <span className={status === "connected" ? "text-green-400" : "text-red-400"}>●</span>
            <span>Supabase: {status}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className={supabaseUrl ? "text-green-400" : "text-red-400"}>●</span>
            <span>ENV vars: {supabaseUrl ? "loaded" : "missing"}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-400">●</span>
            <span>Vercel: deployed</span>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
