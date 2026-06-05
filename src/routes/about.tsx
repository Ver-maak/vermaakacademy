import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/Counter";
import { Target, Eye, Heart, Users, GraduationCap, Lightbulb, Sparkles, Handshake } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Vermaak Academy" },
      { name: "description", content: "Our mission to empower African creatives with future-ready digital skills." },
      { property: "og:title", content: "About Vermaak Academy" },
      { property: "og:description", content: "Building Africa's premier creative-tech learning ecosystem." },
    ],
  }),
  component: About,
});

const values = [
  { icon: Sparkles, title: "Creativity", desc: "We honor original thinking and the courage to make." },
  { icon: Lightbulb, title: "Innovation", desc: "We push past the obvious into what's next." },
  { icon: Heart, title: "Inclusion", desc: "Every voice, every region, every story belongs." },
  { icon: Handshake, title: "Collaboration", desc: "We grow faster, together — across borders." },
  { icon: GraduationCap, title: "Excellence", desc: "World-class craft is the only standard." },
];

const doings = [
  { title: "Online Learning", desc: "Cohort-based and self-paced premium courses." },
  { title: "Bootcamps", desc: "Intensive sprints that take you from zero to portfolio." },
  { title: "Workshops", desc: "Hands-on labs with industry mentors." },
  { title: "Creative Incubation", desc: "Studio support to launch your craft or startup." },
  { title: "Community Building", desc: "City chapters, hackathons and showcases." },
  { title: "Mentorship", desc: "1:1 guidance from working professionals." },
];

const team = [
  { name: "Amara Okonkwo", role: "Founder & CEO" },
  { name: "Thabo Mokoena", role: "Head of Design" },
  { name: "Lerato Ndlovu", role: "Head of Curriculum" },
  { name: "Kwame Asante", role: "Community Lead" },
];

function About() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,oklch(0.74_0.13_230/0.18),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-5 lg:px-8 text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider mb-3">About Vermaak</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="font-display font-extrabold text-5xl sm:text-6xl leading-[1.05]">
            We're building <span className="gradient-text">the academy</span> Africa deserves.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Vermaak Academy is a premium creative-tech learning ecosystem — courses, mentorship,
            community and incubation — designed for the next wave of African builders.
          </motion.p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 grid md:grid-cols-2 gap-6">
          {[
            { icon: Target, label: "Our Mission", body: "To equip one million African creatives with the skills, mentorship and network to build globally-competitive work from anywhere on the continent." },
            { icon: Eye, label: "Our Vision", body: "A continent where every creative ambition has a clear, dignified path to mastery — and where African talent shapes the global creative-tech economy." },
          ].map((b) => (
            <div key={b.label} className="p-8 rounded-3xl bg-card border border-border/60 soft-shadow">
              <b.icon className="h-8 w-8 text-[var(--cyan)] mb-4" />
              <h2 className="font-display font-bold text-2xl mb-3">{b.label}</h2>
              <p className="text-muted-foreground leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider mb-2">Core Values</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl">What we stand for</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="p-6 rounded-2xl bg-card border border-border/60 text-center soft-shadow">
                <v.icon className="h-7 w-7 text-[var(--cyan)] mx-auto mb-3" />
                <h3 className="font-display font-bold mb-1">{v.title}</h3>
                <p className="text-xs text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider mb-2">What We Do</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl">Six ways we help you level up</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doings.map((d, i) => (
              <motion.div key={d.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-6 rounded-2xl bg-card border border-border/60 soft-shadow flex gap-4">
                <div className="h-10 w-10 rounded-xl gradient-brand text-white flex items-center justify-center font-bold shrink-0">{i + 1}</div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground">{d.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-brand" />
        <div className="mx-auto max-w-7xl px-5 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
          {[
            { v: 12500, s: "+", l: "Students" },
            { v: 120, s: "+", l: "Courses" },
            { v: 8500, s: "+", l: "Creatives" },
            { v: 24, s: "", l: "Countries" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display font-extrabold text-4xl sm:text-5xl"><Counter value={s.v} suffix={s.s} /></div>
              <p className="mt-2 text-sm text-white/80 uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-5 lg:px-8 text-center">
          <Users className="h-10 w-10 mx-auto text-[var(--cyan)] mb-5" />
          <h2 className="font-display font-bold text-3xl sm:text-5xl">Build the future with us</h2>
          <p className="mt-4 text-muted-foreground text-lg">Enroll, partner, or join the community.</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" variant="brand"><Link to="/courses">Enroll Now</Link></Button>
            <Button asChild size="lg" variant="outline"><a href="#">Become a Partner</a></Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
