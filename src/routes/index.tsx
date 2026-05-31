import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Camera, UtensilsCrossed } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TravelLens — Point, Understand, Survive" },
      {
        name: "description",
        content:
          "AI tourist assistant: translate signs, decode menus, and show emergency phrases instantly in any language.",
      },
      { property: "og:title", content: "TravelLens — Point, Understand, Survive" },
      {
        property: "og:description",
        content:
          "Snap a photo of a sign or menu and get instant translation plus context. Emergency phrases ready when you need them.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      <main className="flex-1 px-6 py-8 space-y-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Identify your surroundings.
          </h1>
          <p className="text-muted-foreground mt-2 text-pretty leading-relaxed">
            Point your camera at any sign or menu — get an instant translation with context, or pull up an emergency phrase to show a local.
          </p>
        </header>

        <div className="grid gap-4">
          <Link
            to="/scan/$mode"
            params={{ mode: "sign" }}
            className="animate-in-up group relative flex flex-col justify-end h-48 w-full p-6 bg-foreground text-background rounded-3xl overflow-hidden text-left hover:scale-[0.98] transition-transform"
          >
            <Camera className="absolute top-6 right-6 size-7 opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="relative z-10">
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60">
                Visual Recognition
              </p>
              <h2 className="text-2xl font-bold">Translate Sign</h2>
              <p className="text-sm opacity-60 mt-1">Streets, notices, labels — with context.</p>
            </div>
          </Link>

          <Link
            to="/scan/$mode"
            params={{ mode: "menu" }}
            className="animate-in-up [animation-delay:60ms] group relative flex flex-col justify-end h-48 w-full p-6 bg-accent text-accent-foreground rounded-3xl overflow-hidden text-left hover:scale-[0.98] transition-transform"
          >
            <UtensilsCrossed className="absolute top-6 right-6 size-7 opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="relative z-10">
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2 opacity-80">
                Gastronomy AI
              </p>
              <h2 className="text-2xl font-bold">Decode Menu</h2>
              <p className="text-sm opacity-80 mt-1">Dishes, ingredients & allergens.</p>
            </div>
          </Link>

          <Link
            to="/emergency"
            className="animate-in-up [animation-delay:120ms] group flex items-center justify-between w-full p-6 bg-card border border-border rounded-3xl text-left shadow-sm hover:scale-[0.98] transition-transform"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-1 text-emergency font-bold">
                Emergency
              </p>
              <h2 className="text-2xl font-bold">Direct phrases</h2>
              <p className="text-sm text-muted-foreground mt-1">Show to a local in any language.</p>
            </div>
            <div className="size-12 rounded-full bg-emergency/10 flex items-center justify-center text-emergency">
              <AlertTriangle className="size-5" />
            </div>
          </Link>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground pt-12 flex items-center gap-2">
          <span>Set your language pair up top</span>
          <ArrowRight className="size-3" />
        </p>
      </main>

      <footer className="py-8 px-6 text-center">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          TravelLens · Point, Understand, Survive
        </p>
      </footer>
    </AppShell>
  );
}
