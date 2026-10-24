/** Shared "on the way" badge: lit and pulsing, so upcoming reads as momentum, not as disabled. */
export function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-label-caps border border-amber-300/40 bg-amber-300/10 text-amber-200 w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" aria-hidden="true" />
      Coming soon
    </span>
  );
}
