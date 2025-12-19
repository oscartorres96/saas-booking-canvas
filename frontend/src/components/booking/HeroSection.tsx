import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, ChevronRight, Sparkles, Zap, ArrowDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

  const scrollToServices = () => {
    document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white dark:bg-black pt-20 pb-32">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-10"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Vive la Experiencia</span>
              </motion.div>

              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase italic leading-[0.8] dark:text-white">
                {t('booking.hero.title_pre')}<br />
                <span
                  className="text-primary block mt-2"
                  style={primaryColor ? { color: primaryColor } : {}}
                >
                  {businessName}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl font-medium leading-relaxed italic border-l-4 border-primary pl-6 py-2">
                {t('booking.hero.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Button
                size="lg"
                className="group relative text-sm font-black uppercase italic tracking-widest h-16 px-10 rounded-2xl overflow-hidden shadow-2xl shadow-primary/20"
                style={primaryColor ? { backgroundColor: primaryColor } : {}}
                onClick={scrollToBooking}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Calendar className="mr-3 h-5 w-5 relative z-10" />
                <span className="relative z-10">{t('booking.hero.book_btn')}</span>
                <ChevronRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-16 px-10 rounded-2xl text-sm font-black uppercase italic tracking-widest border-2 hover:bg-slate-50 dark:hover:bg-slate-900 dark:text-white transition-all duration-500"
                onClick={scrollToServices}
              >
                {t('booking.hero.services_btn')}
              </Button>
            </div>

            <div className="flex flex-wrap gap-8 pt-8">
              {[
                { icon: CheckCircle2, text: 'booking.hero.features.confirm' },
                { icon: Zap, text: 'booking.hero.features.flexible', color: 'text-amber-500' },
                { icon: Calendar, text: 'booking.hero.features.realtime' }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="flex items-center gap-3"
                >
                  <feature.icon className={cn("h-5 w-5", feature.color || "text-primary")} style={!feature.color && primaryColor ? { color: primaryColor } : {}} />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">{t(feature.text)}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual Asset */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            <div className="relative z-10 aspect-[4/5] rounded-[3rem] bg-slate-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-black/60" />
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <div className="text-center space-y-8">
                  <div className="inline-block p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
                    <Calendar className="h-20 w-20 text-white opacity-80" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter">Tu Lugar <br />Te Espera</h3>
                    <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-12 -left-12 p-6 rounded-[2rem] bg-white dark:bg-slate-800 shadow-2xl z-20 border border-slate-100 dark:border-slate-700 max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase italic">Confirmado</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-tight">Tu próxima sesión está lista.</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-8 -right-8 p-6 rounded-[2rem] bg-slate-900 text-white shadow-2xl z-20 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xl font-black italic">08:00 AM</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Prime Time</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
        onClick={scrollToServices}
      >
        <span className="text-[9px] font-black uppercase tracking-[0.3em] vertical-text">Scroll</span>
        <ArrowDown className="h-4 w-4" />
      </motion.div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .vertical-text {
            writing-mode: vertical-rl;
        }
      `}} />
    </section>
  );
};
