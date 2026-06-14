import { X } from "lucide-react";
import { Button } from "./ui/button";

type Module = { title: string; description?: string };

export type CourseDetails = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  instructor: string;
  duration: string;
  category: string;
  level: string;
  rating: number;
  full_description?: string | null;
  prerequisites?: string | null;
  certificate?: string | null;
  price?: string | null;
  what_you_learn?: string[] | null;
  modules?: Module[] | null;
};

export function CourseDetailsModal({
  course,
  onClose,
  onEnroll,
}: {
  course: CourseDetails | null;
  onClose: () => void;
  onEnroll: (c: CourseDetails) => void;
}) {
  if (!course) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border/60 soft-shadow">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full glass flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
        {course.thumbnail_url && <img src={course.thumbnail_url} alt="" className="w-full aspect-[2/1] object-cover" />}
        <div className="p-7">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
            <span className="font-semibold text-[var(--ocean)] uppercase tracking-wider">{course.category}</span> · <span>{course.level}</span> · <span>{course.duration}</span>
            {course.price && <span>· <strong className="text-foreground">{course.price}</strong></span>}
          </div>
          <h2 className="font-display font-extrabold text-3xl mb-2">{course.title}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{course.full_description?.trim() || course.description}</p>

          {(course.prerequisites || course.certificate) && (
            <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
              {course.prerequisites && (
                <div className="p-4 rounded-xl bg-secondary/40">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Prerequisites</p>
                  <p>{course.prerequisites}</p>
                </div>
              )}
              {course.certificate && (
                <div className="p-4 rounded-xl bg-secondary/40">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Certificate</p>
                  <p>{course.certificate}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid sm:grid-cols-2 gap-5">
            <div>
              <h3 className="font-display font-bold mb-2">What you'll learn</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                {(course.what_you_learn && course.what_you_learn.length > 0
                  ? course.what_you_learn
                  : [
                      "Foundational concepts and modern best practices",
                      "Real project work shipped to your portfolio",
                      "Industry workflows used by top studios",
                      "Mentor feedback and peer reviews",
                    ]
                ).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display font-bold mb-2">Curriculum modules</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                {(course.modules && course.modules.length > 0
                  ? course.modules
                  : [
                      { title: "Foundations" },
                      { title: "Core craft" },
                      { title: "Advanced techniques" },
                      { title: "Capstone project" },
                    ]
                ).map((m, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[var(--cyan)] font-semibold shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                    <div>
                      <p className="text-foreground font-medium">{m.title}</p>
                      {m.description && <p className="text-xs mt-0.5">{m.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border/60 flex items-center justify-end">
            <Button size="lg" variant="brand" onClick={() => onEnroll(course)}>Enroll Now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
