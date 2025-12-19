import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Check, Sparkles, ArrowRight, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    duration: string;
    price: string;
    description?: string;
    requirePayment?: boolean;
    requireResource?: boolean;
    requireProduct?: boolean;
  };
  primaryColor?: string;
  onBook?: () => void;
  isSelected?: boolean;
}

export const ServiceCard = ({ service, primaryColor, onBook, isSelected }: ServiceCardProps) => {
  const { t } = useTranslation();

  const isPremium = service.requirePayment || service.requireProduct;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-500 cursor-pointer border-0 shadow-none",
          "bg-white dark:bg-slate-900",
          isSelected
            ? "ring-2 ring-primary ring-offset-4 ring-offset-background dark:ring-offset-slate-950"
            : "hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
        )}
        onClick={onBook}
      >
        {/* Luxury Background Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br transition-opacity duration-500",
          isSelected
            ? "from-primary/10 via-background to-background opacity-100"
            : "from-slate-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100"
        )} />

        {/* Top Visual Accent */}
        <div
          className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-primary"
            initial={{ x: "-100%" }}
            animate={isSelected ? { x: "0%" } : { x: "-100%" }}
            transition={{ duration: 0.5 }}
            style={primaryColor ? { backgroundColor: primaryColor } : {}}
          />
        </div>

        <CardHeader className="relative pt-8 pb-4 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <motion.div
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={isSelected ? { scale: [1, 1.5, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase italic">
                  {service.requireResource ? 'Lugar Reservado' : 'Sesión Estándar'}
                </span>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">
                {service.name}
              </CardTitle>
            </div>

            <div className="flex flex-col items-end gap-2">
              {isPremium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-[9px] font-black uppercase italic border-0 shadow-lg px-2 py-0.5">
                  <Sparkles className="h-2 w-2 mr-1" />
                  Premium
                </Badge>
              )}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="bg-primary p-1.5 rounded-full shadow-lg shadow-primary/40"
                >
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                </motion.div>
              )}
            </div>
          </div>

          {service.description && (
            <CardDescription className="text-sm font-medium leading-relaxed dark:text-slate-400">
              {service.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="relative space-y-8 pb-8 pt-4">
          {/* Service Specs - The Peloton Way */}
          <div className="flex items-center gap-6 border-t border-b border-slate-100 dark:border-slate-800 py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Minutos</span>
              </div>
              <p className="text-xl font-black italic tabular-nums leading-none">
                {service.duration.replace(/[^0-9]/g, '') || '45'}
              </p>
            </div>

            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 rotate-12" />

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary" style={primaryColor ? { color: primaryColor } : {}}>
                <DollarSign className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Inversión</span>
              </div>
              <p className="text-xl font-black italic tabular-nums leading-none">
                {service.price}
              </p>
            </div>

            {service.requireResource && (
              <>
                <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 rotate-12" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Zap className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Mapa</span>
                  </div>
                  <p className="text-[10px] font-black italic uppercase text-muted-foreground leading-none">
                    Activo
                  </p>
                </div>
              </>
            )}
          </div>

          <Button
            className={cn(
              "w-full h-14 text-sm font-black uppercase italic tracking-widest transition-all duration-500 rounded-2xl",
              isSelected
                ? "bg-slate-900 border-2 border-primary text-white"
                : "bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
            )}
            style={primaryColor && !isSelected ? { backgroundColor: primaryColor } : {}}
            onClick={(e) => {
              e.stopPropagation();
              onBook?.();
            }}
          >
            {isSelected ? (
              <span className="flex items-center gap-2">
                Seleccionado <Check className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                {t('booking.services.book_btn')} <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </CardContent>

        {/* Background Highlight */}
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      </Card>
    </motion.div>
  );
};
