/**
 * SampleDataChip — small indicator that the page is showing mock/sample data
 * because the live backend was unavailable. Renders nothing when not in fallback mode.
 */

export function SampleDataChip({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      data-testid="sample-data-chip"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-secondary-container/30 bg-secondary-container/10 text-secondary-fixed-dim font-data-mono text-[11px]"
    >
      <span className="material-symbols-outlined text-[14px]">info</span>
      Showing sample data
    </div>
  );
}
