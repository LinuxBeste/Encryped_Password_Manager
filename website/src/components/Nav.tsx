export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <a href="#" className="flex items-center gap-2">
          <svg viewBox="0 0 180 240" className="w-5 h-6" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round">
            <path d="M90 10L170 38V98C170 155 135 196 90 216C45 196 10 155 10 98V38L90 10Z" />
            <rect x="58" y="102" width="64" height="52" rx="12" />
            <path d="M74 102V82C74 64 81 56 90 56C99 56 106 64 106 82V102" strokeLinecap="round" />
          </svg>
          <span className="font-semibold text-ink">VaultLock</span>
        </a>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a
            href="https://github.com/anomalyco/vaultlock"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  )
}
