import React from 'react';
import {
    Bed,
    Armchair as Chair,
    Dumbbell,
    MapPin,
    CircleSlash2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Stationary Bike Icon for Spinning
export const SpinningIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Base Support */}
        <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Flywheel (Front) */}
        <circle cx="16" cy="15" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" />
        <circle cx="16" cy="15" r="1" fill="currentColor" />
        {/* Main Frame */}
        <path d="M6 20l4-12 6 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Seat / Saddle */}
        <path d="M9 8h3M10.5 8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Handlebars */}
        <path d="M14 11l2-5h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Pedals Area */}
        <path d="M10 16l1-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// Custom Mat Icon for Yoga/Pilates mats
export const MatIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="4" y="2" width="16" height="20" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
        <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
        <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
    </svg>
);

// SPA/Stretcher Icon (Modified Bed or custom)
export const StretcherIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M3 13h18l-2 4H5l-2-4z" fill="currentColor" fillOpacity="0.2" />
        <path d="M2 13h20M2 17h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 13v-4a2 2 0 012-2h8a2 2 0 012 2v4M4 17v2M20 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export type LayoutType =
    | 'spinning'
    | 'yoga'
    | 'pilates'
    | 'classroom'
    | 'fitness'
    | 'spa'
    | 'default';

export interface IconConfig {
    id: LayoutType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}

export const ICON_REGISTRY: IconConfig[] = [
    {
        id: 'spinning',
        label: 'Spinning',
        icon: SpinningIcon,
        description: 'Bici estática para clases de ciclo'
    },
    {
        id: 'yoga',
        label: 'Yoga / Pilates Mat',
        icon: MatIcon,
        description: 'Tapete o colchoneta de yoga'
    },
    {
        id: 'pilates',
        label: 'Pilates Reformer',
        icon: Bed,
        description: 'Cama de reformer o pilates studio'
    },
    {
        id: 'classroom',
        label: 'Clase / Asiento',
        icon: Chair,
        description: 'Silla o asiento para capacitaciones'
    },
    {
        id: 'fitness',
        label: 'Fitness / Estación',
        icon: Dumbbell,
        description: 'Estación de pesas o entrenamiento'
    },
    {
        id: 'spa',
        label: 'Spa / Camilla',
        icon: StretcherIcon,
        description: 'Camilla de masajes o tratamiento'
    },
    {
        id: 'default',
        label: 'Genérico',
        icon: MapPin,
        description: 'Pin de ubicación estándar'
    }
];

interface ResourceIconProps {
    type?: LayoutType | string;
    isSelected?: boolean;
    isOccupied?: boolean;
    isActive?: boolean;
    className?: string;
}

export const ResourceIcon = ({
    type = 'default',
    isSelected = false,
    isOccupied = false,
    isActive = true,
    className
}: ResourceIconProps) => {
    // Find the icon in the registry
    const config = ICON_REGISTRY.find(i => i.id === type) || ICON_REGISTRY.find(i => i.id === 'default')!;
    const IconComponent = config.icon;

    const iconClass = cn(
        "h-7 w-7 transition-all duration-300",
        isSelected
            ? "text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
            : !isActive
                ? "text-slate-300 dark:text-slate-700"
                : isOccupied
                    ? "text-slate-300 dark:text-slate-700"
                    : "text-slate-400 dark:text-slate-600 group-hover:text-primary group-hover:scale-110",
        className
    );

    return <IconComponent className={iconClass} />;
};
