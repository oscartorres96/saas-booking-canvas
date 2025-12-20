import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardSectionProps {
    children: React.ReactNode;
    className?: string;
    animate?: boolean;
}

/**
 * Main wrapper for a dashboard section. 
 * Provides the consistent outer shadow and background.
 */
export const DashboardSection = ({ children, className, animate = true }: DashboardSectionProps) => {
    return (
        <div className={cn(
            "space-y-6",
            animate && "animate-in fade-in slide-in-from-bottom-4 duration-500",
            className
        )}>
            <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm overflow-hidden">
                {children}
            </Card>
        </div>
    );
};

interface SectionHeaderProps {
    title: string;
    description?: string;
    icon: LucideIcon;
    rightElement?: React.ReactNode;
    className?: string;
}

/**
 * Standard header for a dashboard section.
 */
export const SectionHeader = ({ title, description, icon: Icon, rightElement, className }: SectionHeaderProps) => {
    return (
        <CardHeader className={cn("border-b bg-slate-50/50 dark:bg-slate-900/50 p-4 md:p-8 md:pb-8", className)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        {title}
                    </CardTitle>
                    {description && (
                        <CardDescription className="text-sm md:text-base text-muted-foreground">
                            {description}
                        </CardDescription>
                    )}
                </div>
                {rightElement && (
                    <div className="w-full md:w-auto">
                        {rightElement}
                    </div>
                )}
            </div>
        </CardHeader>
    );
};

interface ConfigPanelProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Inner container for controls and forms.
 */
export const ConfigPanel = ({ children, className }: ConfigPanelProps) => {
    return (
        <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border shadow-inner",
            className
        )}>
            {children}
        </div>
    );
};

interface AdminLabelProps {
    children: React.ReactNode;
    className?: string;
    icon?: LucideIcon;
}

/**
 * Styled label for admin fields.
 */
export const AdminLabel = ({ children, className, icon: Icon }: AdminLabelProps) => {
    return (
        <Label className={cn(
            "text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2",
            className
        )}>
            {Icon && <Icon className="h-3 w-3" />}
            {children}
        </Label>
    );
};

interface DashboardCardProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Reusable small card for items within a section.
 */
export const InnerCard = ({ children, className }: DashboardCardProps) => {
    return (
        <div className={cn(
            "bg-background/50 dark:bg-card rounded-2xl p-3 md:p-4 border border-border/50 shadow-sm transition-all hover:shadow-md",
            className
        )}>
            {children}
        </div>
    );
};
