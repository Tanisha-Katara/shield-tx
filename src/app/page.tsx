"use client";

import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { ExposureChecker } from "@/components/sections/ExposureChecker";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { TrustSection } from "@/components/sections/TrustSection";
import { SocialProof } from "@/components/sections/SocialProof";
import { PricingSection } from "@/components/sections/PricingSection";
import { CTASection } from "@/components/sections/CTASection";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ExposureChecker />
        <ProblemSection />
        <HowItWorks />
        <TrustSection />
        <SocialProof />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
