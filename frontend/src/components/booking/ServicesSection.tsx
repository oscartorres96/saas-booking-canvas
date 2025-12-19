import { ServiceCard } from "./ServiceCard";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
  description?: string;
  requirePayment?: boolean;
  requireResource?: boolean;
  requireProduct?: boolean;
}

interface ServicesSectionProps {
  services: Service[];
  primaryColor?: string;
  selectedServiceId?: string;
  onServiceSelect?: (serviceId: string) => void;
}

export const ServicesSection = ({
  services,
  primaryColor,
  selectedServiceId,
  onServiceSelect
}: ServicesSectionProps) => {
  const { t } = useTranslation();

  const handleBookService = (serviceId: string) => {
    onServiceSelect?.(serviceId);
    // Scroll to next section
    setTimeout(() => {
      document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  return (
    <section id="servicios" className="py-24 md:py-32 bg-white dark:bg-black relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-4 mb-20"
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <span className="text-[12px] font-black tracking-[0.4em] text-primary uppercase italic">
              Paso 01
            </span>
            <div className="h-1 w-12 bg-primary/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] dark:text-white">
            Selecciona tu <br />
            <span className="text-slate-200 dark:text-slate-800 outline-text">Experiencia</span>
          </h2>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto font-medium">
            Diseñamos cada sesión para llevarte al siguiente nivel. Elige el reto que transformará tu día.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1), ease: "easeOut" }}
            >
              <ServiceCard
                service={service}
                primaryColor={primaryColor}
                onBook={() => handleBookService(service.id)}
                isSelected={selectedServiceId === service.id}
              />
            </motion.div>
          ))}
        </motion.div>

        {services.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 space-y-4"
          >
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
              <div className="h-2 w-2 bg-slate-300 rounded-full animate-ping" />
            </div>
            <p className="text-muted-foreground text-sm font-black uppercase tracking-widest italic">
              Preparando nuevas sesiones...
            </p>
          </motion.div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .outline-text {
            -webkit-text-stroke: 1px currentColor;
        }
      `}} />
    </section>
  );
};
