import { useEffect, useRef } from "react"

const categories = [
  {
    title: "Frontend",
    items: ["React 18", "TypeScript", "Tailwind CSS", "Zustand", "Vite", "Electron"],
  },
  {
    title: "Backend",
    items: ["Node.js", "Express", "SQLite", "Zod", "JWT"],
  },
  {
    title: "Security",
    items: ["AES-256-GCM", "Argon2id", "PBKDF2", "TOTP", "Helmet", "CORS"],
  },
  {
    title: "Tooling",
    items: ["pnpm", "Docker", "ESLint", "Prettier", "Vitest", "GitHub Actions"],
  },
]

export default function TechStack() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach((child, i) => {
            setTimeout(() => child.classList.add("visible"), i * 120)
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
    <section ref={ref} className="py-24 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="reveal text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Tech stack
          </h2>
          <p className="reveal reveal-delay-1 mt-4 text-lg text-muted max-w-xl mx-auto">
            Modern tools, battle-tested libraries.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <div
              key={i}
              className={`reveal ${i % 2 === 0 ? "reveal-left" : "reveal-right"} p-6 rounded-xl border border-border bg-paper`}
            >
              <h3 className="font-semibold text-lg text-ink mb-4">{cat.title}</h3>
              <ul className="space-y-2">
                {cat.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
