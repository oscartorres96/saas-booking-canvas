import { ServiceCard } from "./ServiceCard";
import { useTranslation } from "react-i18next";

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  description?: string;
}

interface ServicesSectionProps {
  services: Service[];
  primaryColor?: string;
}

export const ServicesSection = ({ services, primaryColor }: ServicesSectionProps) => {
  const { t } = useTranslation();
  const handleBookService = (serviceId: string) => {
    document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="servicios" className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            {t('booking.services.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('booking.services.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              primaryColor={primaryColor}
              onBook={() => handleBookService(service.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
