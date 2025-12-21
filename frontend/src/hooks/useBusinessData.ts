import { useQuery } from "@tanstack/react-query";
import api from "@/services/api"; // Keep using this or switch to apiClient
import { getServicesByBusiness } from "@/api/servicesApi";

// Tipo de datos para el negocio
export interface Service {
    id: string;
    name: string;
    duration: string;
    price: string;
    description: string;
    requirePayment?: boolean;
    requireResource?: boolean;
    requireProduct?: boolean;
}

export interface BusinessData {
    _id?: string;
    businessName: string;
    logoUrl: string;
    primaryColor: string;
    services: Service[];
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    businessSocials: {
        facebook: string;
        instagram: string;
    };
    language: string;
    paymentConfig?: {
        method: string;
        bank?: string;
        clabe?: string;
        holderName?: string;
        instructions?: string;
    };
    paymentMode?: 'BOOKPRO_COLLECTS' | 'DIRECT_TO_BUSINESS';
}

// Mock data inicial (fallback)
const defaultBusinessData: BusinessData = {
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
        // ... more mock data
    ],
    businessAddress: "Av. Reforma 123, Col. Centro, Ciudad de México, 06000",
    businessPhone: "+52 55 1234 5678",
    businessEmail: "contacto@sonrisas.com",
    businessSocials: {
        facebook: "https://facebook.com/sonrisas",
        instagram: "https://instagram.com/sonrisas"
    },
    language: "es" // Default fallback language
};

// Función para obtener datos de la API
const fetchBusinessData = async (businessSlug?: string): Promise<BusinessData> => {
    try {
        // Si hay un slug, lo usamos en la URL, sino usamos el endpoint genérico
        const endpoint = businessSlug ? `/businesses/slug/${businessSlug}` : '/businesses';
        const response = await api.get(endpoint);
        const business = response.data;

        let servicesData: any[] = [];
        if (business._id) {
            try {
                servicesData = await getServicesByBusiness(business._id);
            } catch (err) {
                console.warn("Could not fetch services", err);
            }
        }

        return {
            _id: business._id,
            businessName: business.businessName || business.name,
            logoUrl: business.logoUrl || business.settings?.logoUrl || "",
            primaryColor: business.settings?.primaryColor || business.primaryColor || "#000000",
            services: servicesData.map((s: any) => ({
                id: s._id,
                name: s.name,
                duration: `${s.durationMinutes} minutos`,
                price: `$${s.price}`,
                description: s.description || "",
                requirePayment: s.requirePayment,
                requireResource: s.requireResource,
                requireProduct: s.requireProduct
            })),
            businessAddress: business.address || "",
            businessPhone: business.phone || business.settings?.phone || "",
            businessEmail: business.email || "",
            businessSocials: {
                facebook: "", // Not yet in backend
                instagram: ""
            },
            language: business.language || "es", // Provide a default if undefined
            paymentConfig: business.paymentConfig,
            paymentMode: business.paymentMode
        };
    } catch (error) {
        console.error("Error fetching business data:", error);
        // Fallback a datos default si hay error (ej. servidor apagado)
        return defaultBusinessData;
    }
};

export const useBusinessData = (businessSlug?: string) => {
    return useQuery({
        queryKey: ["businessData", businessSlug],
        queryFn: () => fetchBusinessData(businessSlug),
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
};
