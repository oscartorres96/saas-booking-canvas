import { Calendar, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/60 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-black/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl !== "/placeholder.svg" ? (
              <img
                src={logoUrl}
                alt={`${businessName} logo`}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm"
                style={primaryColor ? { backgroundColor: primaryColor } : {}}
              >
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{businessName}</h1>
              <p className="text-xs text-muted-foreground">{t('booking.header.system')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
/* Desktop Navigation */
            <nav className="hidden md:flex items-center gap-8">
              <a href="#servicios" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                {t('booking.nav.services')}
              </a>
              <a href="#reservar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                {t('booking.nav.book')}
              </a>
              <a href="#contacto" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
                {t('booking.nav.contact')}
              </a>
            </nav>



            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <a
              href="#servicios"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('booking.nav.services')}
            </a>
            <a
              href="#reservar"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('booking.nav.book')}
            </a>
            <a
              href="#contacto"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('booking.nav.contact')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
