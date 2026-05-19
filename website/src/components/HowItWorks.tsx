import { useEffect, useRef } from "react"

const steps = [
  {
    num: "01",
    title: "Download & Install",
    desc: "Get VaultLock for macOS, Windows, or Linux via GitHub Releases. Packages are signed and verified — no telemetry, no ads, no fuss.",
    detail: "Supports AppImage, deb, dmg, and NSIS installer formats.",
  },
  {
    num: "02",
    title: "Create Your Vault",
    desc: "Set a strong master password. Your encryption keys are derived client-side via PBKDF2 — never transmitted or stored on any server.",
    detail: "Password strength is evaluated in real-time using zxcvbn.",
  },
  {
    num: "03",
    title: "Add Your Credentials",
    desc: "Store passwords, TOTP seeds, secure notes, and more. Every entry is encrypted with AES-256-GCM before it ever leaves your device.",
    detail: "Organize entries into folders, mark favorites, and search globally with Ctrl+K.",
  },
  {
    num: "04",
    title: "Access Anywhere",
    desc: "Your vault syncs seamlessly when connectivity is available. Use the REST API for automation or the desktop app for daily password management.",
    detail: "Optional auto-lock, clipboard auto-clear, and system tray integration included.",
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".reveal-left, .reveal-right").forEach((child, i) => {
            setTimeout(() => child.classList.add("visible"), i * 150)
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
    <section id="how-it-works" ref={ref} className="py-24 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="reveal text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            How it works
          </h2>
          <p className="reveal reveal-delay-1 mt-4 text-lg text-muted max-w-xl mx-auto">
            Four steps to better password security.
          </p>
        </div>
        <div className="space-y-12">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`${i % 2 === 0 ? "reveal-left" : "reveal-right"} flex gap-6 sm:gap-10`}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-border flex items-center justify-center text-muted font-mono text-sm font-semibold">
                {step.num}
              </div>
              <div className="pt-1">
                <h3 className="font-semibold text-xl text-ink mb-2">{step.title}</h3>
                <p className="text-muted leading-relaxed mb-2">{step.desc}</p>
                <p className="text-sm text-muted/70 font-mono">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
