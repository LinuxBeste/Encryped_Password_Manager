import { useEffect, useRef, useState } from "react"

function AnimatedNumber({ n }: { n: number }) {
  const [val, setVal] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 1200
    const step = Math.ceil(n / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= n) {
        setVal(n)
        clearInterval(timer)
      } else {
        setVal(start)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [n])

  return <span>{val.toLocaleString()}</span>
}

const data = [
  {
    number: "256",
    unit: "bit",
    suffix: "",
    label: "Encryption strength",
    desc: "AES-256-GCM symmetric encryption — the same standard used by banks and governments worldwide.",
  },
  {
    number: "",
    value: "15",
    unit: "min",
    label: "Access token lifetime",
    desc: "Short-lived JWT access tokens minimize the window of exposure in case of token leakage.",
  },
  {
    number: "",
    value: "7",
    unit: "days",
    label: "Refresh token lifetime",
    desc: "Longer-lived refresh tokens are SHA-256 hashed at rest and rotated on every use.",
  },
  {
    number: "",
    value: "3",
    unit: "",
    label: "Supported platforms",
    desc: "Native desktop apps for macOS (dmg), Windows (NSIS), and Linux (AppImage + deb).",
  },
  {
    number: "65536",
    unit: "KB",
    suffix: "",
    label: "Argon2 memory cost",
    desc: "64 MB of memory per hash makes GPU/ASIC brute-force attacks economically infeasible.",
  },
  {
    number: "",
    value: "3",
    unit: "iterations",
    label: "Argon2 time cost",
    desc: "Three passes over memory to further increase the computational cost of each hash attempt.",
  },
  {
    number: "",
    value: "20+",
    unit: "",
    label: "REST API endpoints",
    desc: "Full CRUD for entries, folders, settings, vault export, audit logs, authentication, and health.",
  },
  {
    number: "",
    value: "100",
    unit: "%",
    label: "Client-side encryption",
    desc: "Your master password and encryption keys never leave your device. The server sees only ciphertext.",
  },
]

export default function Stats() {
  const ref = useRef<HTMLElement>(null)
  const [counted, setCounted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((child, i) => {
            setTimeout(() => child.classList.add("visible"), i * 100)
          })
          setCounted(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="stats" ref={ref} className="py-24 px-6 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="reveal text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            By the numbers
          </h2>
          <p className="reveal reveal-delay-1 mt-4 text-lg text-muted max-w-xl mx-auto">
            Built with modern cryptography and a minimal footprint.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.map((item, i) => {
            const animClass =
              i % 4 === 0 ? "reveal-left" : i % 4 === 1 ? "reveal-scale" : i % 4 === 2 ? "reveal-right" : "reveal"
            const displayUnit = item.unit || ""
            return (
              <div
                key={i}
                className={`${animClass} p-5 rounded-xl border border-border bg-paper hover:border-ink/20 hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="text-2xl sm:text-3xl font-bold text-accent font-mono tracking-tight">
                  {item.number ? (
                    counted ? <AnimatedNumber n={parseInt(item.number.replace(/,/g, ""), 10)} /> : "0"
                  ) : (
                    item.value
                  )}
                  {displayUnit && (
                    <span className="text-sm font-normal text-muted ml-1">{displayUnit}</span>
                  )}
                  {item.suffix}
                </div>
                <div className="mt-2 font-semibold text-sm text-ink">{item.label}</div>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
