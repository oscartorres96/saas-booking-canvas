import { Calendar } from "lucide-react";

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
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl !== "/placeholder.svg" ? (
              <img 
                src={logoUrl} 
                alt={`${businessName} logo`} 
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"
                style={primaryColor ? { backgroundColor: primaryColor } : {}}
              >
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight">{businessName}</h1>
              <p className="text-xs text-muted-foreground">Sistema de Reservas</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#servicios" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Servicios
            </a>
            <a href="#reservar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Reservar
            </a>
            <a href="#contacto" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contacto
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
