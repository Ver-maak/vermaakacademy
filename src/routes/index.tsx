import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Globe, Award, Rocket, Brain, Palette, Code2, Camera, Megaphone, Gamepad2, Box, Film, Lightbulb } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/CourseCard";
import { Counter } from "@/components/Counter";
import { courses } from "@/data/courses";
import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero-waves.jpg";
import logo from "@/assets/vermaak-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vermaak Academy — Creative-Tech Learning for Africa" },
      { name: "description", content: "Premium online courses in design, code, AI and entrepreneurship for African creatives and innovators." },
      { property: "og:title", content: "Vermaak Academy" },
      { property: "og:description", content: "Future-ready digital skills for African youth and creatives." },
    ],
  }),
  component: Home,
});

const categoryIcons = [
  { name: "Digital Marketing", icon: Megaphone },
  { name: "Graphic Design", icon: Palette },
  { name: "UI/UX Design", icon: Sparkles },
  { name: "Web Development", icon: Code2 },
  { name: "Game Development", icon: Gamepad2 },
  { name: "3D Design", icon: Box },
  { name: "Animation", icon: Film },
  { name: "Photography", icon: Camera },
  { name: "Entrepreneurship", icon: Lightbulb },
  { name: "AI & Emerging Tech", icon: Brain },
];

const stats = [
  { value: 12500, suffix: "+", label: "Students trained" },
  { value: 120, suffix: "+", label: "Premium courses" },
  { value: 8500, suffix: "+", label: "Creatives impacted" },
  { value: 24, suffix: "", label: "Countries reached" },
];

const whyItems = [
  { icon: Globe, title: "African-Centered", desc: "Built by and for the continent — our stories, our standards, our pace." },
  { icon: Rocket, title: "Industry-Relevant", desc: "Curriculum shaped with hiring teams and creative studios across Africa." },
  { icon: Users, title: "Mentorship", desc: "1:1 sessions with practicing pros — not just videos and quizzes." },
  { icon: Award, title: "Hands-on Projects", desc: "Ship portfolio-grade work, not toy assignments." },
];

const testimonials = [
  { name: "Chidi Eze", role: "Product Designer, Lagos", quote: "Vermaak rewired how I think about craft. The mentorship alone was worth it." },
  { name: "Aisha Bello", role: "Frontend Dev, Nairobi", quote: "I shipped my first production app in week 6. The community keeps me leveled up." },
  { name: "Tendai Moyo", role: "Brand Designer, Harare", quote: "Finally a platform that treats African creatives as world-class — because we are." },
];

function Home() {
  const featured = courses.filter((c) => c.featured).slice(0, 6);

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" className="h-full w-full object-cover opacity-40 dark:opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-[var(--cyan)]/20 blur-[120px] -z-10" />

        <div className="mx-auto max-w-7xl px-5 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium mb-8"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--cyan)] animate-pulse" />
            New cohort starting · April 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] max-w-4xl mx-auto"
          >
            Learn the skills <br className="hidden sm:block" />
            shaping <span className="gradient-text">Africa's future</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Vermaak Academy is a premium creative-tech learning platform for the next generation
            of African designers, developers, founders and storytellers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-9 flex flex-wrap gap-3 justify-center"
          >
            <Button asChild size="lg" variant="brand">
              <Link to="/courses">Explore Courses <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#community">Join Community</a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative mt-20 mx-auto max-w-3xl"
          >
            <div className="absolute inset-0 -m-10 bg-[var(--cyan)]/20 blur-[80px] rounded-full" />
            <img src={logo} alt="" className="relative h-40 w-40 mx-auto drop-shadow-[0_20px_60px_oklch(0.74_0.13_230/0.5)]" />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider mb-2">Featured Categories</p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl">Pick your path</h2>
            </div>
            <Link to="/courses" className="text-sm font-medium hover:text-[var(--ocean)] inline-flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryIcons.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group relative p-5 rounded-2xl bg-card border border-border/60 hover:border-[var(--cyan)]/50 hover:-translate-y-1 transition-all duration-300 soft-shadow"
              >
                <div className="h-11 w-11 rounded-xl gradient-brand flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <c.icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-sm">{c.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider mb-2">Featured Courses</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl">Crafted by practitioners</h2>
            <p className="mt-3 text-muted-foreground">Real projects, real mentors, real outcomes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="community" className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider mb-2">Why Vermaak</p>
            <h2 className="font-display font-bold text-3xl sm:text-5xl leading-tight">
              A learning ecosystem built <span className="gradient-text">for us, by us</span>.
            </h2>
            <p className="mt-5 text-muted-foreground text-lg max-w-lg">
              We blend rigorous curriculum with mentorship, community and the cultural context
              that makes African creatives unstoppable.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {whyItems.map((w, i) => (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-card border border-border/60 soft-shadow hover:border-[var(--cyan)]/40 transition-colors"
              >
                <w.icon className="h-7 w-7 text-[var(--cyan)] mb-3" />
                <h3 className="font-display font-bold text-lg mb-1.5">{w.title}</h3>
                <p className="text-sm text-muted-foreground">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-brand" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-5 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display font-extrabold text-4xl sm:text-5xl">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-sm text-white/80 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold text-[var(--ocean)] uppercase tracking-wider mb-2">Voices</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl">From our community</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-7 rounded-3xl bg-card border border-border/60 soft-shadow relative"
              >
                <div className="absolute -top-3 left-7 h-7 w-7 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">"</div>
                <blockquote className="text-foreground/90 leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-5 pt-5 border-t border-border/60">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8">Trusted by partners across Africa</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center">
            {["Andela", "Flutterwave", "MEST", "iHub", "Kuda", "Paystack"].map((p) => (
              <div key={p} className="text-center font-display font-bold text-lg text-muted-foreground/70 hover:text-foreground transition">{p}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-5 lg:px-8 text-center">
          <div className="relative p-10 sm:p-14 rounded-[2.5rem] bg-card border border-border/60 soft-shadow overflow-hidden">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[var(--cyan)]/30 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[var(--royal)]/30 blur-[80px]" />
            <div className="relative">
              <h2 className="font-display font-bold text-3xl sm:text-4xl">Stay in the loop</h2>
              <p className="mt-3 text-muted-foreground">Cohort drops, free workshops and creator tips — once a week.</p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  className="flex-1 h-12 px-5 rounded-full bg-background border border-input focus:outline-none focus:ring-2 focus:ring-[var(--cyan)]"
                />
                <Button type="submit" size="lg" variant="brand">Subscribe</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
