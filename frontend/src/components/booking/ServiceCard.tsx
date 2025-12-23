import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Check, Sparkles, ArrowRight, Zap, Package } from "lucide-react";
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
    isOnline?: boolean;
  };
  primaryColor?: string;
  onBook?: () => void;
  isSelected?: boolean;
  applicablePackages?: { id: string; name: string }[];
}

export const ServiceCard = ({ service, primaryColor, onBook, isSelected, applicablePackages }: ServiceCardProps) => {
  const { t } = useTranslation();
  const isPremium = service.requirePayment || service.requireProduct;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="h-full"
    >
      <Card
        className={cn(
          "group relative overflow-hidden h-full flex flex-col transition-all duration-500 border-2",
          isSelected
            ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10"
            : "border-slate-100 dark:border-slate-800/50 hover:border-primary/30 bg-card"
        )}
        onClick={onBook}
      >
        {/* Quick Indicators */}
        <div className="flex justify-between items-start p-3 sm:p-4 pb-0 z-10">
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {service.isOnline && (
              <Badge variant="outline" className="bg-sky-500/10 text-sky-500 border-sky-500/20 text-[7px] sm:text-[8px] font-black uppercase tracking-wider sm:tracking-widest italic">
                Online
              </Badge>
            )}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 border-0 text-[7px] sm:text-[8px] font-black uppercase tracking-wider sm:tracking-widest italic px-1.5 sm:px-2">
                <Sparkles className="h-2 w-2 mr-0.5 sm:mr-1" />
                Premium
              </Badge>
            )}
          </div>
          {isSelected && (
            <div className="bg-primary p-1 rounded-full shrink-0">
              <Check className="h-3 w-3 text-white" strokeWidth={4} />
            </div>
          )}
        </div>

        <CardContent className="flex-grow flex flex-col p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <h4 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter leading-tight group-hover:text-primary transition-colors">
              {service.name}
            </h4>
            {service.description && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium leading-relaxed line-clamp-2">
                {service.description}
              </p>
            )}
          </div>


          {applicablePackages && applicablePackages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <div className="w-full flex items-center gap-1 mb-1">
                <Package className="h-3 w-3 text-purple-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Disponible en paquetes:</span>
              </div>
              {applicablePackages.map(pkg => (
                <Badge
                  key={pkg.id}
                  variant="secondary"
                  className="bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 text-[8px] font-bold uppercase tracking-wide h-5 px-1.5"
                >
                  {pkg.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-auto pt-4 sm:pt-6 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-4 sm:gap-6 border-t border-slate-100 dark:border-slate-800/50 pt-4 sm:pt-6">
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground/60 leading-none">Minutos</span>
                <div className="flex items-center gap-1 sm:gap-1.5 font-black italic text-base sm:text-lg leading-none">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                  {service.duration.replace(/[^0-9]/g, '')}
                </div>
              </div>
              <div className="h-6 sm:h-8 w-[1px] bg-slate-200 dark:bg-slate-800 rotate-12" />
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground/60 leading-none">Inversión</span>
                <div className="flex items-center gap-1 sm:gap-1.5 font-black italic text-base sm:text-lg text-primary leading-none">
                  <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {service.price}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "w-full h-10 sm:h-12 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase italic tracking-[0.15em] sm:tracking-[0.2em] gap-1.5 sm:gap-2 transition-all duration-300",
                isSelected
                  ? "shadow-lg shadow-primary/30"
                  : "hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/20"
              )}
            >
              {isSelected ? "Seleccionado" : "Elegir Servicio"}
              {!isSelected && <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

