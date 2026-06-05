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
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim(), name: name.trim() });
    setBusy(false);
    if (error) {
      if (error.code === "23505") toast.error("You're already subscribed.");
      else toast.error(error.message || "Could not subscribe. Try again.");
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
