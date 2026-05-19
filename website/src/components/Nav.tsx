import { useState } from "react"

const links = [
  { label: "Features", href: "#features" },
  { label: "Stats", href: "#stats" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Tech Stack", href: "#tech-stack" },
  { label: "Security", href: "#security" },
  { label: "Download", href: "#download" },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
        <a href="#" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 180 240" className="w-5 h-6" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round">
            <path d="M90 10L170 38V98C170 155 135 196 90 216C45 196 10 155 10 98V38L90 10Z" />
            <rect x="58" y="102" width="64" height="52" rx="12" />
            <path d="M74 102V82C74 64 81 56 90 56C99 56 106 64 106 82V102" strokeLinecap="round" />
          </svg>
          <span className="font-semibold text-ink">VaultLock</span>
        </a>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-ink transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com/LinuxBeste/Encryped_Password_Manager"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-4 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* mobile toggle */}
        <button
          className="md:hidden p-2 -mr-2 text-muted hover:text-ink transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-paper/95 backdrop-blur-md">
          <div className="flex flex-col gap-1 px-6 py-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2.5 text-sm text-muted hover:text-ink transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/LinuxBeste/Encryped_Password_Manager"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-4 py-2.5 bg-ink text-paper rounded-lg text-sm font-medium text-center hover:bg-ink/90 transition-colors"
              onClick={() => setOpen(false)}
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
