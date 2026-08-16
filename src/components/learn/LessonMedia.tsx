function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return url;
  } catch {
    return null;
  }
}

export function LessonMedia({ lesson }: { lesson: any }) {
  if (lesson.media_signed_url) {
    return (
      <video controls preload="metadata" className="w-full rounded-xl bg-black aspect-video" src={lesson.media_signed_url}>
        <track kind="captions" />
      </video>
    );
  }
  if (lesson.media_url) {
    const embed = toEmbed(lesson.media_url);
    if (!embed) return null;
    return (
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <iframe
          src={embed}
          title={lesson.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  return null;
}
