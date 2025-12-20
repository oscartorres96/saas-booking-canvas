import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateBusinessResourceConfig } from "@/api/businessesApi";
import { Grid3X3, Save, RefreshCw, MousePointer2, Settings2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ResourceIcon, ICON_REGISTRY, type LayoutType } from "../booking/ResourceIconRegistry";

interface Resource {
    id: string;
    label: string;
    isActive: boolean;
    position: {
        row: number;
        col: number;
    };
}

interface ResourceConfig {
    enabled: boolean;
    resourceType: string;
    resourceLabel: string;
    layoutType?: string;
    rows: number;
    cols: number;
    resources: Resource[];
}

interface ResourceMapEditorProps {
    businessId: string;
    initialConfig?: ResourceConfig;
}

export const ResourceMapEditor = ({ businessId, initialConfig }: ResourceMapEditorProps) => {
    const [config, setConfig] = useState<ResourceConfig>(initialConfig || {
        enabled: false,
        resourceType: "Bici",
        resourceLabel: "B",
        layoutType: "spinning",
        rows: 4,
        cols: 6,
        resources: []
    });

    const [isLoading, setIsLoading] = useState(false);

    const generateResources = useCallback((forceScale: boolean = false) => {
        const newResources: Resource[] = [];
        const currentResources = config.resources;

        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                const id = `${r}-${c}`;
                const existing = forceScale ? null : currentResources.find(res => res.position.row === r && res.position.col === c);

                newResources.push({
                    id,
                    label: `${config.resourceLabel}${r * config.cols + c + 1}`,
                    isActive: existing ? existing.isActive : true,
                    position: { row: r, col: c }
                });
            }
        }
        setConfig(prev => ({ ...prev, resources: newResources }));
    }, [config.rows, config.cols, config.resourceLabel]);

    useEffect(() => {
        const hasDimensionChange = config.resources.length !== (config.rows * config.cols);
        if (hasDimensionChange) {
            generateResources();
        }
    }, [config.rows, config.cols, generateResources]);

    useEffect(() => {
        setConfig(prev => ({
            ...prev,
            resources: prev.resources.map((res, idx) => ({
                ...res,
                label: `${config.resourceLabel}${idx + 1}`
            }))
        }));
    }, [config.resourceLabel]);

    const toggleResource = (id: string) => {
        setConfig(prev => ({
            ...prev,
            resources: prev.resources.map(res =>
                res.id === id ? { ...res, isActive: !res.isActive } : res
            )
        }));
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            await updateBusinessResourceConfig(businessId, config);
            toast.success("Configuración del mapa guardada");
        } catch (error) {
            toast.error("Error al guardar la configuración");
        } finally {
            setIsLoading(false);
        }
    };

    const isSpecialType = config.layoutType && config.layoutType !== 'default';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 pb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Grid3X3 className="h-6 w-6 text-primary" />
                                </div>
                                Personalización de Recursos
                            </CardTitle>
                            <CardDescription className="text-base text-muted-foreground">
                                Elige los iconos y distribuye tus unidades (bicis, tapetes, estaciones) en el mapa.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-background rounded-full border shadow-sm self-start md:self-auto transition-all hover:shadow-md">
                            <Label htmlFor="enabled-switch" className="font-bold cursor-pointer text-sm">Activar mapa</Label>
                            <Switch
                                id="enabled-switch"
                                checked={config.enabled}
                                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-8 space-y-8">
                    {/* Panel de Configuración */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border shadow-inner">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Settings2 className="h-3 w-3" /> Icono Visual
                            </Label>
                            <Select
                                value={config.layoutType || 'default'}
                                onValueChange={(val) => setConfig({ ...config, layoutType: val })}
                            >
                                <SelectTrigger className="bg-background rounded-xl border-slate-200 dark:border-slate-800 h-10">
                                    <SelectValue placeholder="Selecciona un icono" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ICON_REGISTRY.map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            <div className="flex items-center gap-2">
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Singular</Label>
                            <Input
                                value={config.resourceType}
                                onChange={(e) => setConfig({ ...config, resourceType: e.target.value })}
                                placeholder="Ej: Bici, Tapete"
                                className="bg-background rounded-xl border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Etiqueta Base</Label>
                            <Input
                                value={config.resourceLabel}
                                onChange={(e) => setConfig({ ...config, resourceLabel: e.target.value })}
                                placeholder="Ej: B, T"
                                className="bg-background rounded-xl border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary" /> Filas
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                max="20"
                                value={config.rows}
                                onChange={(e) => setConfig({ ...config, rows: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="bg-background border-primary/20 focus:border-primary rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-primary" /> Columnas
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                max="20"
                                value={config.cols}
                                onChange={(e) => setConfig({ ...config, cols: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="bg-background border-primary/20 focus:border-primary rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Área de Visualización */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-primary" />
                                    <h3 className="font-black text-lg uppercase tracking-tight">Vista Previa Interactiva</h3>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest">PERSONALIZA LA DISPOSICIÓN HACIENDO CLIC</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateResources(true)}
                                className="text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all rounded-full h-9 px-4"
                            >
                                <RefreshCw className="h-3 w-3 mr-2" /> Reiniciar
                            </Button>
                        </div>

                        <div className="relative border-2 border-dashed rounded-[2.5rem] p-8 md:p-12 bg-slate-50/30 dark:bg-slate-900/30 min-h-[400px] flex items-center justify-center overflow-auto shadow-inner">
                            <div
                                className="grid gap-4 mx-auto"
                                style={{
                                    gridTemplateColumns: `repeat(${config.cols}, minmax(${isSpecialType ? '60px' : '50px'}, 1fr))`,
                                    width: 'fit-content'
                                }}
                            >
                                {config.resources.map((res) => (
                                    <motion.div
                                        key={res.id}
                                        whileHover={{ y: -3, scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 shadow-sm pointer-events-auto cursor-pointer",
                                            isSpecialType ? "h-20 w-16" : "h-14 w-14",
                                            res.isActive
                                                ? "bg-white dark:bg-slate-800 border-primary shadow-lg shadow-primary/5 text-primary"
                                                : "bg-slate-100 dark:bg-slate-800/20 border-transparent opacity-40 grayscale"
                                        )}
                                        onClick={() => toggleResource(res.id)}
                                    >
                                        <div className="flex flex-col items-center gap-1.5">
                                            <ResourceIcon
                                                type={config.layoutType}
                                                isActive={res.isActive}
                                                className="h-6 w-6"
                                            />
                                            <span className="text-[10px] font-black tracking-tighter leading-none">
                                                {res.label}
                                            </span>
                                        </div>

                                        {/* Status indicator toggle icon */}
                                        <div className={cn(
                                            "absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-md",
                                            res.isActive ? "bg-green-500" : "bg-slate-400"
                                        )}>
                                            <div className="h-1.5 w-1.5 rounded-full bg-white opacity-40" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {config.resources.length === 0 && (
                                <div className="text-center space-y-4">
                                    <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                        <MousePointer2 className="h-8 w-8 text-muted-foreground opacity-20" />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Configura las dimensiones para empezar</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-start gap-4 p-5 bg-primary/5 dark:bg-primary/10 rounded-[1.5rem] border border-primary/10">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <MousePointer2 className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-widest text-primary">TIP PRO</p>
                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                    Haz clic en cada {config.resourceType || "recurso"} para activarlo o desactivarlo.
                                    Esto te permite crear pasillos o espacios vacíos para que la distribución coincida exactamente con tu salón físico.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Botón de Guardado */}
                    <div className="flex justify-end pt-8 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            size="lg"
                            className="px-12 h-16 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.97] rounded-2xl"
                        >
                            {isLoading ? (
                                <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5 mr-3" />
                            )}
                            Guardar Configuración de Sala
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
