import { useTheme } from "./hooks/useTheme"
import Nav from "./components/Nav"
import Hero from "./components/Hero"
import Features from "./components/Features"
import Stats from "./components/Stats"
import HowItWorks from "./components/HowItWorks"
import TechStack from "./components/TechStack"
import Security from "./components/Security"
import CTA from "./components/CTA"
import Footer from "./components/Footer"

export default function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Hero />
        <Features />
        <Stats />
        <HowItWorks />
        <TechStack />
        <Security />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
