import { Calendar, Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  logoUrl?: string;
  businessName: string;
  primaryColor?: string;
}

export const Header = ({
  logoUrl = "/placeholder.svg",
  businessName = "{{business_name}}",
  primaryColor
}: HeaderProps) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-slate-800/50 bg-white/70 dark:bg-black/70 backdrop-blur-2xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl !== "/placeholder.svg" ? (
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={logoUrl}
                alt={`${businessName} logo`}
                className="h-10 w-10 rounded-xl object-cover shadow-2xl shadow-black/10"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-white shadow-xl"
                style={primaryColor ? { backgroundColor: primaryColor } : {}}
              >
                <Calendar className="h-5 w-5 text-white dark:text-slate-900" strokeWidth={2.5} />
              </div>
            )}
            <div>
              <h1 className="text-lg font-black uppercase italic tracking-tighter leading-none dark:text-white">{businessName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('booking.header.system')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              {['services', 'book', 'contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item === 'book' ? 'reservar' : item}`}
                  className="relative text-[11px] font-black uppercase italic tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-all duration-300 group"
                >
                  {t(`booking.nav.${item}`)}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <Button
                className="hidden sm:flex h-10 px-6 rounded-full text-[11px] font-black uppercase italic tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                style={primaryColor ? { backgroundColor: primaryColor } : {}}
              >
                Mi Cuenta <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={toggleMenu}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-50 dark:border-slate-900 bg-white/95 dark:bg-black/95 backdrop-blur-xl"
          >
            <div className="container mx-auto px-6 py-8 space-y-6">
              {['services', 'book', 'contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item === 'book' ? 'reservar' : item}`}
                  className="flex items-center justify-between text-sm font-black uppercase italic tracking-[0.2em] text-slate-600 dark:text-slate-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(`booking.nav.${item}`)}
                  <ArrowRight className="h-4 w-4 opacity-30" />
                </a>
              ))}
              <Button className="w-full h-14 rounded-2xl text-xs font-black uppercase italic tracking-[0.2em]">
                Mi Cuenta
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
