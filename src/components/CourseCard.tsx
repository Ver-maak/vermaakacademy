import { motion } from "framer-motion";
import { Star, Clock, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";

export type CourseCardData = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  instructor: string;
  duration: string;
  category: string;
  level: string;
  rating: number;
};

export function CourseCard({ course, onClick }: { course: CourseCardData; onClick?: () => void }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="group relative overflow-hidden rounded-3xl bg-card border border-border/60 soft-shadow hover:-translate-y-1 hover:shadow-[0_25px_60px_-20px_oklch(0.34_0.12_265/0.35)] transition-all duration-500"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <span className="absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[var(--royal)]">
          {course.category}
        </span>
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full glass text-white">
          <Star className="h-3 w-3 fill-[var(--cyan)] text-[var(--cyan)]" />
          {course.rating}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-bold text-lg leading-snug mb-2 group-hover:text-[var(--ocean)] transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
          <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> {course.level}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground/80">by {course.instructor}</span>
          <Button size="sm" variant="brand" onClick={onClick}>Enroll</Button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-[var(--cyan)]/0 group-hover:ring-[var(--cyan)]/40 transition" />
    </motion.article>
  );
}
