import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

// Tipo de datos para el negocio
export interface Service {
    id: string;
    name: string;
    duration: string;
    price: string;
    description: string;
}

export interface BusinessData {
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

// Función para obtener datos de la API
const fetchBusinessData = async (businessSlug?: string): Promise<BusinessData> => {
    try {
        // Si hay un slug, lo usamos en la URL, sino usamos el endpoint genérico
        const endpoint = businessSlug ? `/business/${businessSlug}` : '/business';
        const response = await api.get(endpoint);
        return response.data;
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
