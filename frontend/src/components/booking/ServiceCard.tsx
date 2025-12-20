import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    isOnline?: boolean;
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
        <div className="flex justify-between items-start p-4 pb-0 z-10">
          <div className="flex gap-2">
            {service.isOnline && (
              <Badge variant="outline" className="bg-sky-500/10 text-sky-500 border-sky-500/20 text-[8px] font-black uppercase tracking-widest italic">
                Online
              </Badge>
            )}
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 border-0 text-[8px] font-black uppercase tracking-widest italic px-2">
                <Sparkles className="h-2 w-2 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          {isSelected && (
            <div className="bg-primary p-1 rounded-full">
              <Check className="h-3 w-3 text-white" strokeWidth={4} />
            </div>
          )}
        </div>

        <CardContent className="flex-grow flex flex-col p-6 space-y-4">
          <div className="space-y-2">
            <h4 className="text-2xl font-black uppercase italic tracking-tighter leading-tight group-hover:text-primary transition-colors">
              {service.name}
            </h4>
            {service.description && (
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          <div className="mt-auto pt-6 space-y-6">
            <div className="flex items-center gap-6 border-t border-slate-100 dark:border-slate-800/50 pt-6">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">Minutos</span>
                <div className="flex items-center gap-1.5 font-black italic text-lg leading-none">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {service.duration.replace(/[^0-9]/g, '')}
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 rotate-12" />
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">Inversión</span>
                <div className="flex items-center gap-1.5 font-black italic text-lg text-primary leading-none">
                  <DollarSign className="h-3.5 w-3.5" />
                  {service.price}
                </div>
              </div>
            </div>

            <Button
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "w-full h-12 rounded-2xl text-[10px] font-black uppercase italic tracking-[0.2em] gap-2 transition-all duration-300",
                isSelected
                  ? "shadow-lg shadow-primary/30"
                  : "hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/20"
              )}
            >
              {isSelected ? "Seleccionado" : "Elegir Servicio"}
              {!isSelected && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

