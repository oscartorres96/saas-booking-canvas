import { useEffect } from 'react';
import { LandingNav } from '../components/landing/LandingNav';
import { HeroSection } from '../components/landing/HeroSection';
import { WhatIsSection } from '../components/landing/WhatIsSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { UseCasesSection } from '../components/landing/UseCasesSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { PricingSection } from '../components/PricingSection';
import { CTASection } from '../components/landing/CTASection';
import { DemoSection } from '../components/landing/DemoSection';
import { LandingFooter } from '../components/landing/LandingFooter';

const Landing = () => {
    useEffect(() => {
        // Scroll to section if hash is present in URL
        const hash = window.location.hash;
        if (hash) {
            // Small delay to ensure the page is fully rendered
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100);
        }
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <LandingNav />
            <main>
                <HeroSection />
                <WhatIsSection />
                <BenefitsSection />
                <HowItWorksSection />
                <UseCasesSection />
                <FeaturesSection />
                <PricingSection />
                <CTASection />
                <DemoSection id="demo" />
            </main>
            <LandingFooter />
        </div>
    );
};

export default Landing;
