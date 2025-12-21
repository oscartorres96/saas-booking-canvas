import { Header } from "../components/booking/Header";
import { HeroSection } from "../components/booking/HeroSection";
import { ServicesSection } from "../components/booking/ServicesSection";
import { BookingCalendar } from "../components/booking/BookingCalendar";
import { BookingForm } from "../components/booking/BookingForm";
import { ProductsStore } from "../components/booking/ProductsStore";
import { Footer } from "../components/booking/Footer";
import { BookingStepper } from "../components/booking/BookingStepper";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useBusinessData } from "../hooks/useBusinessData";
import { useTranslation } from "react-i18next";

const BookingPage = () => {
    const { businessSlug } = useParams<{ businessSlug: string }>();
    const { data: businessData, isLoading } = useBusinessData(businessSlug);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const { i18n } = useTranslation();

    useEffect(() => {
        if (businessData?.language) {
            i18n.changeLanguage(businessData.language);
        }
    }, [businessData, i18n]);

    if (isLoading || !businessData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted"></div>
                    <div className="h-4 w-48 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    // Determine current step based on selections
    const getCurrentStep = () => {
        if (!selectedServiceId) return 1;
        if (!selectedDate || !selectedTime) return 2;
        return 3;
    };

    const steps = [
        {
            id: 1,
            title: "Servicio",
            description: "Elige tu opción"
        },
        {
            id: 2,
            title: "Fecha y Hora",
            description: "Selecciona el momento"
        },
        {
            id: 3,
            title: "Confirma",
            description: "Completa tu reserva"
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header
                logoUrl={businessData.logoUrl}
                businessName={businessData.businessName}
                primaryColor={businessData.primaryColor}
            />

            <main>
                <HeroSection
                    businessName={businessData.businessName}
                    primaryColor={businessData.primaryColor}
                />

                <BookingStepper
                    steps={steps}
                    currentStep={getCurrentStep()}
                />

                <ServicesSection
                    services={businessData.services}
                    primaryColor={businessData.primaryColor}
                    selectedServiceId={selectedServiceId || undefined}
                    onServiceSelect={setSelectedServiceId}
                />

                <BookingCalendar
                    primaryColor={businessData.primaryColor}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedTime={selectedTime}
                    setSelectedTime={setSelectedTime}
                    isEnabled={!!selectedServiceId}
                />

                <ProductsStore
                    businessId={businessData._id || businessSlug || ""}
                    primaryColor={businessData.primaryColor}
                />

                <BookingForm
                    primaryColor={businessData.primaryColor}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    businessName={businessData.businessName}
                    businessId={businessData._id || businessSlug}
                    services={businessData.services}
                    paymentConfig={businessData.paymentConfig}
                    paymentMode={businessData.paymentMode}
                />
            </main>

            <Footer
                businessAddress={businessData.businessAddress}
                businessPhone={businessData.businessPhone}
                businessEmail={businessData.businessEmail}
                businessSocials={businessData.businessSocials}
            />
        </div>
    );
};

export default BookingPage;
