import { useEffect, useRef } from "react"

const items = [
  { label: "Encryption", value: "AES-256-GCM" },
  { label: "Key Derivation", value: "PBKDF2 (client) + Argon2id (server)" },
  { label: "Authentication", value: "JWT (15m access + 7d refresh tokens)" },
  { label: "2FA", value: "TOTP (Time-based One-Time Password)" },
  { label: "CSRF Protection", value: "Double-submit cookie pattern" },
  { label: "Rate Limiting", value: "Per-endpoint in-memory limiter" },
  { label: "Password Hashing", value: "Argon2id (memory: 64MB, iterations: 3)" },
  { label: "CORS", value: "Strict origin whitelist" },
]

export default function Security() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach((child, i) => {
            setTimeout(() => child.classList.add("visible"), i * 80)
          })
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 px-6 border-t border-border bg-surface">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="reveal text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Security first
          </h2>
          <p className="reveal reveal-delay-1 mt-4 text-lg text-muted max-w-xl mx-auto">
            Every layer of the stack is built with security in mind.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <div
              key={i}
              className={`${i % 2 === 0 ? "reveal-left" : "reveal-right"} flex items-center justify-between p-4 rounded-lg border border-border bg-paper hover:bg-surface-hover transition-colors`}
            >
              <span className="text-sm font-medium text-muted">{item.label}</span>
              <span className="text-sm font-semibold text-ink font-mono text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
