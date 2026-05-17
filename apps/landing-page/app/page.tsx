import { Navbar } from '../src/components/organisms/Navbar'
import { HeroSection } from '../src/components/organisms/HeroSection'
import { ClientsBar } from '../src/components/organisms/ClientsBar'
import { FeaturesSection } from '../src/components/organisms/FeaturesSection'
import { HowItWorks } from '../src/components/organisms/HowItWorks'
import { PricingSection } from '../src/components/organisms/PricingSection'
import { CtaSection } from '../src/components/organisms/CtaSection'
import { SiteFooter } from '../src/components/organisms/SiteFooter'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ClientsBar />
        <FeaturesSection />
        <HowItWorks />
        <PricingSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}
