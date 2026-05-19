import { useEffect, useRef } from "react"

export default function Hero() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".reveal, .reveal-scale").forEach((child, i) => {
            setTimeout(() => child.classList.add("visible"), i * 150)
          })
          observer.unobserve(el)
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
      {/* subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-border/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 border border-border/30 rounded-full translate-x-1/2" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="reveal-scale mb-8 flex justify-center">
          <div className="animate-float w-20 h-20 border-2 border-ink rounded-2xl flex items-center justify-center">
            <svg viewBox="0 0 180 240" className="w-10 h-14" fill="none" stroke="currentColor" strokeWidth="8" strokeLinejoin="round">
              <path d="M90 10L170 38V98C170 155 135 196 90 216C45 196 10 155 10 98V38L90 10Z" />
              <rect x="58" y="102" width="64" height="52" rx="12" />
              <path d="M74 102V82C74 64 81 56 90 56C99 56 106 64 106 82V102" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <h1 className="reveal text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-ink leading-[1.1]">
          Your passwords,
          <br />
          <span className="text-accent">your control</span>
        </h1>
        <p className="reveal reveal-delay-1 mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
          VaultLock is a zero-knowledge, offline-first encrypted password manager.
          Built with <strong className="text-ink">AES-256-GCM</strong>,{" "}
          <strong className="text-ink">Argon2id</strong>, and a fierce commitment to
          privacy. Fully open source.
        </p>

        <div className="reveal reveal-delay-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#features"
            className="px-8 py-3.5 bg-ink text-paper rounded-xl font-medium text-base hover:bg-ink/90 transition-colors"
          >
            Explore Features
          </a>
          <a
            href="https://github.com/LinuxBeste/Encryped_Password_Manager"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-border rounded-xl font-medium text-base text-ink hover:bg-surface transition-colors"
          >
            View on GitHub
          </a>
          <a
            href="https://github.com/LinuxBeste/Encryped_Password_Manager/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-border rounded-xl font-medium text-base text-muted hover:text-ink hover:bg-surface transition-colors"
          >
            Download
          </a>
        </div>

        <div className="reveal reveal-delay-3 mt-12 flex items-center justify-center gap-8 text-sm text-muted">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Open Source
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Zero-Knowledge
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Offline-First
          </span>
        </div>
      </div>
    </section>
  )
}
