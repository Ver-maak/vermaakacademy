export function WaveBg({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[var(--cyan)]/30 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-[var(--royal)]/40 blur-[140px]" />
      <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[var(--ocean)]/30 blur-[120px]" />
      <svg className="absolute bottom-0 inset-x-0 w-full text-background" viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          fill="currentColor"
          d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,53.3C840,53,960,75,1080,80C1200,85,1320,75,1380,69.3L1440,64L1440,120L0,120Z"
        />
      </svg>
    </div>
  );
}
