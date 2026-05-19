import { useEffect, useRef } from "react"

export default function CTA() {
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
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="reveal text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Ready to take control?
        </h2>
        <p className="reveal reveal-delay-1 mt-4 text-lg text-muted max-w-lg mx-auto">
          VaultLock is free, open source, and built for people who take their privacy seriously.
        </p>
        <div className="reveal-scale reveal-delay-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://github.com/anomalyco/vaultlock/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="animate-pulse-glow px-8 py-3.5 bg-ink text-paper rounded-xl font-medium text-base hover:bg-ink/90 transition-colors"
          >
            Download Now
          </a>
          <a
            href="https://github.com/anomalyco/vaultlock"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-border rounded-xl font-medium text-base text-ink hover:bg-surface transition-colors"
          >
            Star on GitHub
          </a>
        </div>
        <p className="reveal reveal-delay-3 mt-6 text-sm text-muted">
          macOS &middot; Windows &middot; Linux &middot; No account required
        </p>
      </div>
    </section>
  )
}
