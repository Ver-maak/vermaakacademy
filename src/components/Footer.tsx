import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Github, Twitter, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { supabase } from "@/integrations/supabase/client";

type Contact = { contact_email?: string; contact_phone?: string; cities?: string; facebook?: string; instagram?: string; linkedin?: string; x?: string };

export function Footer() {
  const [c, setC] = useState<Contact>({});

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "general")
      .maybeSingle()
      .then(({ data }) => setC((data?.value ?? {}) as Contact));
  }, []);

  const socials: { Icon: typeof Twitter; href: string; label: string }[] = [
    { Icon: Twitter, href: c.x || "#", label: "X" },
    { Icon: Instagram, href: c.instagram || "#", label: "Instagram" },
    { Icon: Linkedin, href: c.linkedin || "#", label: "LinkedIn" },
    { Icon: Github, href: c.facebook || "#", label: "Facebook" },
  ];

  const email = c.contact_email || "vermaakinc1@gmail.com";

  return (
    <footer className="relative mt-32 border-t border-border/60 bg-gradient-to-b from-background to-secondary/40">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[var(--cyan)]/60 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8 pt-16">
        <div className="rounded-3xl gradient-brand p-8 md:p-10 text-white grid md:grid-cols-[1fr_1.2fr] gap-6 items-center">
          <div>
            <h3 className="font-display font-extrabold text-2xl md:text-3xl">Stay in the loop</h3>
            <p className="text-white/85 text-sm mt-1.5">New courses, workshops, and creator stories — straight to your inbox.</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3"><NewsletterForm /></div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 max-w-sm">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            A creative-tech learning platform empowering African youth with future-ready
            digital skills, mentorship, and a community that ships.
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href === "#" ? undefined : "_blank"}
                rel={href === "#" ? undefined : "noreferrer"}
                aria-label={label}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-secondary hover:bg-[var(--cyan)] hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4">Platform</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/courses" className="hover:text-foreground">Courses</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><a href="#" className="hover:text-foreground">Mentorship</a></li>
            <li><a href="#" className="hover:text-foreground">Community</a></li>
            <li><Link to="/verify" className="hover:text-foreground">Verify a certificate</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4">Contact</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> <a href={`mailto:${email}`} className="hover:text-foreground">{email}</a></li>
            {c.contact_phone && (
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> <a href={`tel:${c.contact_phone}`} className="hover:text-foreground">{c.contact_phone}</a></li>
            )}
            <li>{c.cities || "Kampala · Nairobi"}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 h-14 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Vermaak Academy. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <Link to="/unsubscribe" className="hover:text-foreground">Unsubscribe</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
