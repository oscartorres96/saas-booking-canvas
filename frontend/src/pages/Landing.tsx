import { useEffect } from 'react';
import { LandingNav } from '../components/landing/LandingNav';
import { HeroSection } from '../components/landing/HeroSection';
import { WhatIsSection } from '../components/landing/WhatIsSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { UseCasesSection } from '../components/landing/UseCasesSection';
import { ProductEcosystemSection } from '../components/landing/ProductEcosystemSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { PricingSection } from '../components/PricingSection';
import { CTASection } from '../components/landing/CTASection';
import { DemoSection } from '../components/landing/DemoSection';
import { LandingFooter } from '../components/landing/LandingFooter';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { ComparisonSection } from '../components/landing/ComparisonSection';
import { Button } from '../components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

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

    const MidCTA = () => (
        <div className="py-12 flex justify-center bg-background">
            <Button
                size="lg"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="group px-8 sm:px-12 py-6 sm:py-7 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-blue-500/20 transition-all font-bold rounded-xl"
            >
                Empieza hoy mismo gratis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <LandingNav />
            <main>
                <HeroSection />
                <WhatIsSection />
                <BenefitsSection />
                <ComparisonSection />
                {/* <ProductEcosystemSection /> */}
                <HowItWorksSection />
                <UseCasesSection />
                {/* <TestimonialsSection /> */}
                <MidCTA />
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
