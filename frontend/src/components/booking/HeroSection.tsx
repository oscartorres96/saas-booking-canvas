import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HeroSectionProps {
  businessName: string;
  primaryColor?: string;
}

export const HeroSection = ({
  businessName = "{{business_name}}",
  primaryColor
}: HeroSectionProps) => {
  const { t } = useTranslation();
  const scrollToBooking = () => {
    document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden gradient-hero py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {t('booking.hero.title_pre')}{" "}
                <span
                  className="text-primary"
                  style={primaryColor ? { color: primaryColor } : {}}
                >
                  {businessName}
                </span>{" "}
                {t('booking.hero.title_post')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                {t('booking.hero.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-base h-12 px-8 shadow-elevated"
                style={primaryColor ? { backgroundColor: primaryColor } : {}}
                onClick={scrollToBooking}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {t('booking.hero.book_btn')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base h-12 px-8"
              >
                {t('booking.hero.services_btn')}
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" style={primaryColor ? { color: primaryColor } : {}} />
                <span className="text-sm text-muted-foreground">{t('booking.hero.features.confirm')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" style={primaryColor ? { color: primaryColor } : {}} />
                <span className="text-sm text-muted-foreground">{t('booking.hero.features.flexible')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" style={primaryColor ? { color: primaryColor } : {}} />
                <span className="text-sm text-muted-foreground">{t('booking.hero.features.realtime')}</span>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 to-accent shadow-elevated overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="h-48 w-48 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
