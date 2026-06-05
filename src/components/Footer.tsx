import { Link } from "@tanstack/react-router";
import { Github, Twitter, Instagram, Linkedin, Mail } from "lucide-react";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
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
            {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
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
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4">Contact</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@vermaak.academy</li>
            <li>Lagos · Nairobi · Cape Town</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 h-14 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Vermaak Academy. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
