import logo from "@/assets/vermaak-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src={logo} alt="Vermaak Academy" className="h-9 w-9 object-contain" />
      <div className="flex flex-col leading-none">
        <span className="font-display font-extrabold text-base tracking-tight">Vermaak</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Academy</span>
      </div>
    </div>
  );
}
