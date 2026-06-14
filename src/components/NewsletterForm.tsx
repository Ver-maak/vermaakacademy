import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: cleanEmail, name: cleanName });
    if (error && error.code === "23505") {
      // Re-subscribe if previously unsubscribed
      const { data: existing } = await supabase.from("newsletter_subscribers").select("id,unsubscribed_at").eq("email", cleanEmail).maybeSingle();
      if (existing?.unsubscribed_at) {
        const { error: upErr } = await supabase.from("newsletter_subscribers").update({ unsubscribed_at: null, name: cleanName || undefined }).eq("id", existing.id);
        setBusy(false);
        if (upErr) return toast.error(upErr.message);
        toast.success("Welcome back! You're subscribed again.");
        setEmail(""); setName("");
        return;
      }
      setBusy(false);
      return toast.error("You're already subscribed.");
    }
    setBusy(false);
    if (error) {
      toast.error(error.message || "Could not subscribe. Try again.");
      return;
    }
    toast.success("You're in! Welcome to Vermaak.");
    setEmail("");
    setName("");
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={120}
        className="h-11 px-4 rounded-full bg-background border border-border focus:ring-2 focus:ring-[var(--cyan)] outline-none text-sm"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        maxLength={255}
        className="h-11 px-4 rounded-full bg-background border border-border focus:ring-2 focus:ring-[var(--cyan)] outline-none text-sm"
      />
      <Button type="submit" variant="brand" disabled={busy} className="h-11 rounded-full">
        {busy ? "…" : <><Send className="h-4 w-4 mr-1.5" /> Subscribe</>}
      </Button>
    </form>
  );
}
