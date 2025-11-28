import { Header } from "@/components/booking/Header";
import { HeroSection } from "@/components/booking/HeroSection";
import { ServicesSection } from "@/components/booking/ServicesSection";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { BookingForm } from "@/components/booking/BookingForm";
import { Footer } from "@/components/booking/Footer";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useBusinessData } from "@/hooks/useBusinessData";

const BookingPage = () => {
    const { businessSlug } = useParams<{ businessSlug: string }>();
    const { data: businessData, isLoading } = useBusinessData(businessSlug);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

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

                <ServicesSection
                    services={businessData.services}
                    primaryColor={businessData.primaryColor}
                />

                <BookingCalendar
                    primaryColor={businessData.primaryColor}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedTime={selectedTime}
                    setSelectedTime={setSelectedTime}
                />

                <BookingForm
                    primaryColor={businessData.primaryColor}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    businessName={businessData.businessName}
                    businessId={businessData._id || businessSlug}
                    services={businessData.services}
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
