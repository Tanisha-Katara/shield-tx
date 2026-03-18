export function Footer() {
  return (
    <footer className="border-t border-shieldtx-border px-6 md:px-12 lg:px-20 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="font-mono text-xs text-shieldtx-muted">
          SHIELD TX — Shielded perp execution on Hyperliquid
        </span>
        <span className="font-mono text-xs text-shieldtx-muted/50">
          Private beta
        </span>
      </div>
    </footer>
  );
}
