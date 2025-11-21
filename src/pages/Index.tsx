import { Header } from "@/components/booking/Header";
import { HeroSection } from "@/components/booking/HeroSection";
import { ServicesSection } from "@/components/booking/ServicesSection";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { BookingForm } from "@/components/booking/BookingForm";
import { Footer } from "@/components/booking/Footer";

// Mock data - estos valores serán reemplazados dinámicamente desde tu backend
const mockBusinessData = {
  businessName: "Clínica Dental Sonrisas",
  logoUrl: "/placeholder.svg",
  primaryColor: "#06B6D4", // Cyan/Teal
  services: [
    {
      id: "1",
      name: "Limpieza Dental",
      duration: "45 minutos",
      price: "$800 MXN",
      description: "Limpieza profunda y revisión general"
    },
    {
      id: "2",
      name: "Blanqueamiento",
      duration: "60 minutos",
      price: "$1,500 MXN",
      description: "Tratamiento de blanqueamiento profesional"
    },
    {
      id: "3",
      name: "Ortodoncia",
      duration: "30 minutos",
      price: "$2,500 MXN",
      description: "Consulta y evaluación ortodóntica"
    },
    {
      id: "4",
      name: "Extracción",
      duration: "45 minutos",
      price: "$1,200 MXN",
      description: "Extracción dental simple o compleja"
    },
    {
      id: "5",
      name: "Endodoncia",
      duration: "90 minutos",
      price: "$3,000 MXN",
      description: "Tratamiento de conducto radicular"
    },
    {
      id: "6",
      name: "Corona Dental",
      duration: "60 minutos",
      price: "$4,500 MXN",
      description: "Colocación de corona de porcelana"
    }
  ],
  businessAddress: "Av. Reforma 123, Col. Centro, Ciudad de México, 06000",
  businessPhone: "+52 55 1234 5678",
  businessEmail: "contacto@sonrisas.com",
  businessSocials: {
    facebook: "https://facebook.com/sonrisas",
    instagram: "https://instagram.com/sonrisas"
  }
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header 
        logoUrl={mockBusinessData.logoUrl}
        businessName={mockBusinessData.businessName}
        primaryColor={mockBusinessData.primaryColor}
      />
      
      <main>
        <HeroSection 
          businessName={mockBusinessData.businessName}
          primaryColor={mockBusinessData.primaryColor}
        />
        
        <ServicesSection 
          services={mockBusinessData.services}
          primaryColor={mockBusinessData.primaryColor}
        />
        
        <BookingCalendar 
          primaryColor={mockBusinessData.primaryColor}
        />
        
        <BookingForm 
          primaryColor={mockBusinessData.primaryColor}
        />
      </main>
      
      <Footer
        businessAddress={mockBusinessData.businessAddress}
        businessPhone={mockBusinessData.businessPhone}
        businessEmail={mockBusinessData.businessEmail}
        businessSocials={mockBusinessData.businessSocials}
      />
    </div>
  );
};

export default Index;
