export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 180 240" className="w-5 h-6" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round">
              <path d="M90 10L170 38V98C170 155 135 196 90 216C45 196 10 155 10 98V38L90 10Z" />
              <rect x="58" y="102" width="64" height="52" rx="12" />
              <path d="M74 102V82C74 64 81 56 90 56C99 56 106 64 106 82V102" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold text-ink">VaultLock</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="https://github.com/anomalyco/vaultlock" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">GitHub</a>
            <a href="https://github.com/anomalyco/vaultlock/releases" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">Releases</a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted">
          Open source. Zero knowledge. Always encrypted. &copy; {new Date().getFullYear()} VaultLock
        </div>
      </div>
    </footer>
  )
}
