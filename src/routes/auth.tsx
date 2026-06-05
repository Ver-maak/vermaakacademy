import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign-in — Vermaak Academy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in.");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16 bg-[radial-gradient(circle_at_50%_0%,oklch(0.74_0.13_230/0.18),transparent_60%)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block"><Logo /></Link>
          <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--ocean)] glass rounded-full px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Restricted area
          </div>
          <h1 className="font-display font-extrabold text-3xl mt-4">Admin sign-in</h1>
          <p className="text-muted-foreground text-sm mt-2">
            This portal is for Vermaak Academy administrators only.
          </p>
        </div>

        <div className="rounded-3xl bg-card border border-border/60 soft-shadow p-7">
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              autoComplete="email"
              className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:ring-2 focus:ring-[var(--cyan)] outline-none"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:ring-2 focus:ring-[var(--cyan)] outline-none"
            />
            <Button type="submit" variant="brand" className="w-full h-11" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Not an admin? <Link to="/" className="hover:text-foreground underline">Back to home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
