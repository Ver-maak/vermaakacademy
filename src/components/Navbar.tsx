import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-border/40" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-5 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" aria-label="Vermaak Academy home"><Logo /></Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full transition-colors"
              activeProps={{ className: "text-foreground bg-secondary" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary transition"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button asChild variant="brand" size="sm" className="hidden sm:inline-flex">
            <Link to="/courses">Start Learning</Link>
          </Button>
          <button
            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-secondary"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden glass border-t border-border/40 px-5 py-4 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-secondary"
            >
              {l.label}
            </Link>
          ))}
          <Button asChild variant="brand" className="w-full mt-2">
            <Link to="/courses" onClick={() => setOpen(false)}>Start Learning</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
