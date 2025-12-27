import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getProductsByBusiness,
    createProduct,
    updateProduct,
    deleteProduct,
    Product,
    ProductType,
    retryProductSync
} from "@/api/productsApi";
import { getServicesByBusiness, updateService, deleteService, Service, retryServiceSync } from "@/api/servicesApi";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    MoreHorizontal,
    Plus,
    Pencil,
    Trash2,
    Package,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    ShieldCheck,
    Repeat,
    Calendar,
    Settings2,
    CheckCircle2,
    AlertCircle,
    Grid3X3,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CatalogManagerProps {
    businessId: string;
    services: Service[];
    products: Product[];
    onDataUpdate?: () => void;
}

export const CatalogManager = ({ businessId, services, products, onDataUpdate }: CatalogManagerProps) => {
    const { t } = useTranslation();

    const SyncBadge = ({ status, error, onRetry }: {
        status?: 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR',
        error?: string,
        onRetry: () => void
    }) => {
        if (!status) return null;

        const config: Record<string, { color: string; label: string; icon?: React.ReactNode }> = {
            PENDING: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: t('dashboard.stripe.status.pending', 'Preparando...') },
            SYNCING: { color: 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse', label: t('dashboard.stripe.status.syncing', 'Sincronizando...') },
            SYNCED: { color: 'bg-green-50 text-green-700 border-green-100', label: t('dashboard.stripe.status.synced', 'Listo para vender'), icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
            ERROR: { color: 'bg-red-50 text-red-700 border-red-100', label: t('dashboard.stripe.status.error', 'Error de pagos'), icon: <AlertCircle className="h-3 w-3 mr-1" /> },
        };

        const current = config[status];

        return (
            <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className={cn("text-[9px] uppercase font-bold px-1.5 h-5", current.color)}>
                    {current.icon}
                    {current.label}
                </Badge>
                {status === 'ERROR' && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5 rounded-full text-red-700 border-red-200 hover:bg-red-100"
                        onClick={(e) => { e.stopPropagation(); onRetry(); }}
                        title={error || t('dashboard.stripe.error_tooltip', "Hubo un problema al sincronizar con Stripe")}
                    >
                        <Repeat className="h-2.5 w-2.5" />
                    </Button>
                )}
            </div>
        );
    };

    const [expandedServices, setExpandedServices] = useState<string[]>([]);

    // Modals state
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isDeletingProduct, setIsDeletingProduct] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeletingService, setIsDeletingService] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

    // Initial expansion logic - we can do this in a useEffect monitoring services prop
    useEffect(() => {
        if (services.length > 0 && expandedServices.length === 0) {
            setExpandedServices([services[0]._id]);
        }
    }, [services]); // Only run when services change


    const toggleExpand = (serviceId: string) => {
        setExpandedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleToggleServiceStatus = async (service: Service) => {
        try {
            const updated = await updateService(service._id, { active: !service.active });
            toast.success(updated.active ? t('common.active') : t('common.inactive'));
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            toast.error(t('dashboard.services.toasts.error_update'));
        }
    };

    const handleToggleProductStatus = async (product: Product) => {
        try {
            const updated = await updateProduct(product._id, { active: !product.active });
            toast.success(updated.active ? t('common.active') : t('common.inactive'));
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            toast.error(t('dashboard.products.toasts.error_update', 'Error al actualizar producto'));
        }
    };

    const handleRetryServiceSync = async (serviceId: string) => {
        try {
            await retryServiceSync(serviceId);
            toast.success(t('dashboard.stripe.retry_initiated', "Reintento de sincronización iniciado"));
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            toast.error(t('dashboard.stripe.retry_error', "Error al iniciar el reintento"));
        }
    };

    const handleRetryProductSync = async (productId: string) => {
        try {
            await retryProductSync(productId);
            toast.success(t('dashboard.stripe.retry_initiated', "Reintento de sincronización iniciado"));
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            toast.error(t('dashboard.stripe.retry_error', "Error al iniciar el reintento"));
        }
    };

    const handleToggleProductRelationship = async (product: Product, serviceId: string) => {
        try {
            const isLinked = product.allowedServiceIds.includes(serviceId);
            const newAllowedIds = isLinked
                ? product.allowedServiceIds.filter(id => id !== serviceId)
                : [...product.allowedServiceIds, serviceId];

            await updateProduct(product._id, { allowedServiceIds: newAllowedIds });
            toast.success(isLinked ? "Paquete desvinculado de este servicio" : "Paquete vinculado a este servicio");
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            toast.error("Error al actualizar la relación");
        }
    };

    const openAddProduct = (serviceId: string) => {
        setEditingProduct({
            businessId,
            type: ProductType.Package,
            active: true,
            allowedServiceIds: [serviceId],
            name: "",
            price: 0,
            totalUses: 10,
            isUnlimited: false,
            validityDays: 30
        });
        setIsProductDialogOpen(true);
    };

    const openEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsProductDialogOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            if (editingProduct._id) {
                await updateProduct(editingProduct._id, editingProduct);
                toast.success(t('dashboard.products.toasts.updated', 'Producto actualizado'));
            } else {
                await createProduct(editingProduct);
                toast.success(t('dashboard.products.toasts.created', 'Producto creado'));
            }
            setIsProductDialogOpen(false);
            setEditingProduct(null);
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            toast.error(t('dashboard.products.toasts.error_save', 'Error al guardar producto'));
        }
    };

    const openDeleteProduct = (product: Product) => {
        setProductToDelete(product);
        setIsDeletingProduct(true);
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;
        try {
            await deleteProduct(productToDelete._id);
            toast.success(t('dashboard.products.toasts.deleted', 'Producto eliminado'));
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            toast.error(t('dashboard.products.toasts.error_delete', 'Error al eliminar producto'));
        } finally {
            setIsDeletingProduct(false);
            setProductToDelete(null);
        }
    };

    const openDeleteService = (service: Service) => {
        setServiceToDelete(service);
        setIsDeletingService(true);
    };

    const confirmDeleteService = async () => {
        if (!serviceToDelete) return;
        try {
            await deleteService(serviceToDelete._id);
            toast.success(t('dashboard.services.toasts.deleted', 'Servicio eliminado'));
            if (onDataUpdate) onDataUpdate();
        } catch (error) {
            toast.error(t('dashboard.services.toasts.error_delete', 'Error al eliminar servicio'));
        } finally {
            setIsDeletingService(false);
            setServiceToDelete(null);
        }
    };

    const [linkingServiceId, setLinkingServiceId] = useState<string | null>(null);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);

    const openLinkDialog = (serviceId: string) => {
        setLinkingServiceId(serviceId);
        setIsLinkDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="services" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 p-1 bg-muted/50 rounded-2xl border">
                    <TabsTrigger value="services" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Servicios
                    </TabsTrigger>
                    <TabsTrigger value="packages" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Package className="h-4 w-4 mr-2" />
                        Gestionar Paquetes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="space-y-6">
                    <div className="grid gap-6">
                        {services.length === 0 ? (
                            <Card className="border-dashed border-2 bg-muted/30">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                                        <Package className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{t('dashboard.services.empty')}</h3>
                                    <p className="text-muted-foreground max-w-xs mb-6">
                                        Comienza creando tus servicios para que tus clientes puedan reservar.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            services.map((service) => {
                                const isExpanded = expandedServices.includes(service._id);
                                const associatedProducts = products.filter(p => p.allowedServiceIds.includes(service._id));

                                return (
                                    <Card key={service._id} className={cn(
                                        "overflow-hidden transition-all duration-300 border shadow-sm hover:shadow-md",
                                        isExpanded ? "ring-2 ring-primary/10 border-primary/20" : "bg-card"
                                    )}>
                                        {/* Nivel 1 - Header del Servicio */}
                                        <div
                                            className={cn(
                                                "p-3 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer",
                                                isExpanded ? "bg-primary/5" : "hover:bg-muted/30"
                                            )}
                                            onClick={() => toggleExpand(service._id)}
                                        >
                                            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                                                <div className={cn(
                                                    "h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                                                    isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                                )}>
                                                    <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                                                </div>
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-base sm:text-lg font-bold tracking-tight truncate max-w-[150px] sm:max-w-none">{service.name}</h3>

                                                        <Badge variant={service.active ? "default" : "secondary"} className="text-[10px] h-5 px-1.5 uppercase font-bold tracking-wider">
                                                            {service.active ? t('common.active') : t('common.inactive')}
                                                        </Badge>

                                                        <SyncBadge
                                                            status={service.stripe?.syncStatus}
                                                            error={service.stripe?.lastSyncError}
                                                            onRetry={() => handleRetryServiceSync(service._id)}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {service.durationMinutes} min
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-foreground/80">
                                                            <DollarSign className="h-3.5 w-3.5 text-primary" />
                                                            ${service.price} <span className="text-[10px] text-muted-foreground ml-1">por sesión</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-none">
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Switch
                                                        checked={service.active}
                                                        onCheckedChange={() => handleToggleServiceStatus(service)}
                                                        className="scale-90 sm:scale-100"
                                                    />
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground sm:hidden">
                                                        {service.active ? t('common.active') : t('common.inactive')}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="outline" size="sm" className="h-9 px-3 border-muted-foreground/20 hover:bg-background" onClick={() => {
                                                        window.dispatchEvent(new CustomEvent('edit-service', { detail: service }));
                                                    }}>
                                                        <Pencil className="h-3.5 w-3.5 mr-2" />
                                                        {t('common.edit')}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-destructive hover:bg-destructive/5"
                                                        onClick={() => openDeleteService(service)}
                                                        title="Eliminar servicio"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => toggleExpand(service._id)}>
                                                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nivel 2 - Detalles Expandibles */}
                                        {isExpanded && (
                                            <div className="border-t bg-card animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="p-3 sm:p-6 space-y-6">

                                                    {/* Formas de Venta Section */}
                                                    <div className="space-y-4">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                            <div className="space-y-1">
                                                                <h4 className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                                    <DollarSign className="h-3.5 w-3.5 sm:h-4 w-4" />
                                                                    Relacionar Paquetes
                                                                </h4>
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground">Activa los paquetes que quieres ofrecer para este servicio.</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-primary/20 text-primary hover:bg-primary/5 font-bold text-[11px] h-8"
                                                                    onClick={() => openLinkDialog(service._id)}
                                                                >
                                                                    <Settings2 className="h-3.5 w-3.5 mr-1" />
                                                                    Vincular Existente
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="font-bold text-[11px] h-8"
                                                                    onClick={() => openAddProduct(service._id)}
                                                                >
                                                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                                                    Crear Nuevo
                                                                </Button>
                                                            </div>
                                                        </div>


                                                        <div className="grid gap-3">
                                                            {/* Opción 1: Pago por sesión */}
                                                            <div className={cn(
                                                                "flex items-center justify-between p-4 rounded-xl border transition-all",
                                                                !service.requireProduct ? "bg-primary/[0.02] border-primary/20 ring-1 ring-primary/5" : "bg-muted/10 border-transparent grayscale-[0.5]"
                                                            )}>
                                                                <div className="flex items-center gap-4">
                                                                    <div className={cn(
                                                                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                                                        !service.requireProduct ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"
                                                                    )}>
                                                                        <ShieldCheck className="h-5 w-5" />
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-bold">Pago por Sesión Individual</p>
                                                                            {!service.requireProduct && <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] h-4 uppercase">Activo</Badge>}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                                                                            Habilita esta opción para permitir compras de una sola sesión sin paquete.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                                                                    <div className="text-left xs:text-right sm:mr-2">
                                                                        <p className="text-xs font-black text-foreground">${service.price}</p>
                                                                        <p className="text-[10px] text-muted-foreground">por uso</p>
                                                                    </div>
                                                                    <Switch
                                                                        checked={!service.requireProduct}
                                                                        onCheckedChange={async (checked) => {
                                                                            try {
                                                                                const updated = await updateService(service._id, { requireProduct: !checked });
                                                                                toast.success(checked ? "Pago por sesión habilitado" : "Pago por sesión deshabilitado");
                                                                                if (onDataUpdate) onDataUpdate();
                                                                            } catch (err) {
                                                                                toast.error("Error al actualizar configuración");
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Opción 2: Paquetes Vinculados */}
                                                            {associatedProducts.length > 0 ? (
                                                                <div className="space-y-3 pt-2">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-muted-foreground/20">
                                                                            PAQUETES VINCULADOS ({associatedProducts.length})
                                                                        </Badge>
                                                                    </div>
                                                                    {associatedProducts.map((product) => (
                                                                        <div key={product._id} className={cn(
                                                                            "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border group transition-all duration-200",
                                                                            product.active ? "bg-background border-muted hover:border-primary/30" : "bg-muted/5 border-dashed border-muted/50 opacity-60"
                                                                        )}>
                                                                            <div className="flex items-center gap-3 sm:gap-4">
                                                                                <div className={cn(
                                                                                    "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                                                                    product.active ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-muted text-muted-foreground border-transparent"
                                                                                )}>
                                                                                    <Repeat className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                                </div>
                                                                                <div className="space-y-0.5 min-w-0 flex-1">
                                                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                                        <p className="text-sm font-bold group-hover:text-primary transition-colors truncate">{product.name}</p>
                                                                                        {!product.active && (
                                                                                            <Badge variant="secondary" className="text-[9px] h-4 uppercase">Inactivo Global</Badge>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] font-medium text-muted-foreground">
                                                                                        <span className="flex items-center gap-1 shrink-0">
                                                                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                                                            {product.isUnlimited ? "Ilimitado" : `${product.totalUses} usos`}
                                                                                        </span>
                                                                                        <span className="text-foreground/80 font-bold ml-auto sm:ml-0">${product.price}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center justify-end gap-2 sm:gap-3 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-none border-muted/30">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Vincular</span>
                                                                                    <Switch
                                                                                        checked={true}
                                                                                        onCheckedChange={() => handleToggleProductRelationship(product, service._id)}
                                                                                        className="scale-75 sm:scale-90"
                                                                                    />
                                                                                </div>
                                                                                <div className="h-4 w-[1px] bg-muted mx-1" />
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                                                    onClick={() => openEditProduct(product)}
                                                                                    title="Ver/Editar Global"
                                                                                >
                                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="p-8 rounded-xl border border-dashed border-muted flex flex-col items-center justify-center text-center space-y-2 bg-muted/10">
                                                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center opacity-60">
                                                                        <AlertCircle className="h-5 w-5" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-xs font-bold text-muted-foreground uppercase">Sin Paquetes Relacionados</p>
                                                                        <p className="text-[11px] text-muted-foreground/80 max-w-[200px]">Este servicio no tiene paquetes activos.</p>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="mt-2 text-[10px] h-7 px-3 font-bold"
                                                                            onClick={() => openLinkDialog(service._id)}
                                                                        >
                                                                            <Settings2 className="h-3 w-3 mr-1" />
                                                                            Vincular uno
                                                                        </Button>
                                                                        <Button
                                                                            variant="default"
                                                                            size="sm"
                                                                            className="mt-2 text-[10px] h-7 px-3 font-bold"
                                                                            onClick={() => openAddProduct(service._id)}
                                                                        >
                                                                            <Plus className="h-3 w-3 mr-1" />
                                                                            Crear nuevo
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="packages" className="space-y-6">
                    <Card className="border-none shadow-none bg-transparent">
                        <div className="flex items-center justify-between mb-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold">Gestión Global de Paquetes</h3>
                                <p className="text-sm text-muted-foreground">Crea y administra todos tus paquetes y pases aquí. Luego, elige a qué servicios aplicarlos.</p>
                            </div>
                            <Button onClick={() => {
                                setEditingProduct({
                                    businessId,
                                    type: ProductType.Package,
                                    active: true,
                                    allowedServiceIds: [],
                                    name: "",
                                    price: 0,
                                    totalUses: 10,
                                    isUnlimited: false,
                                    validityDays: 30
                                });
                                setIsProductDialogOpen(true);
                            }} className="rounded-xl font-bold">
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Paquete
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {products.length === 0 ? (
                                <div className="p-12 border-2 border-dashed rounded-3xl text-center bg-muted/20">
                                    <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h4 className="font-bold text-muted-foreground">No has creado ningún paquete todavía</h4>
                                    <p className="text-sm text-muted-foreground/60 mt-2">Los paquetes permiten ofrecer descuentos por volumen o membresías.</p>
                                </div>
                            ) : (
                                products.map((product) => (
                                    <Card key={product._id} className="p-4 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                                    product.active ? "bg-primary/5 text-primary border-primary/10" : "bg-muted text-muted-foreground border-transparent"
                                                )}>
                                                    <Repeat className="h-6 w-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold">{product.name}</h4>
                                                        <Badge variant={product.active ? "default" : "secondary"}>
                                                            {product.active ? "Activo" : "Inactivo"}
                                                        </Badge>

                                                        <SyncBadge
                                                            status={product.stripe?.syncStatus}
                                                            error={product.stripe?.lastSyncError}
                                                            onRetry={() => handleRetryProductSync(product._id)}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-medium">
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="h-3 w-3" />
                                                            ${product.price}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            {product.isUnlimited ? "Ilimitado" : `${product.totalUses} usos`}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Grid3X3 className="h-3 w-3" />
                                                            {product.allowedServiceIds.length} servicios vinculados
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-auto">
                                                <div className="flex items-center gap-2 mr-4 border-r pr-4">
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Estado Global</span>
                                                    <Switch
                                                        checked={product.active}
                                                        onCheckedChange={() => handleToggleProductStatus(product)}
                                                    />
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => openEditProduct(product)}>
                                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                                    Editar
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5" onClick={() => openDeleteProduct(product)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Product Dialog */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSaveProduct}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-primary" />
                                {editingProduct?._id ? "Editar Paquete / Pase" : "Nuevo Paquete / Pase"}
                            </DialogTitle>
                            <DialogDescription>
                                Configura una oferta especial para este servicio.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre de la oferta</Label>
                                <Input
                                    value={editingProduct?.name || ""}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    placeholder="Ej: Paquete 10 Sesiones, Pase Mensual..."
                                    className="rounded-lg h-10 ring-offset-background focus-visible:ring-primary/20"
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground">Este nombre es el que verá el cliente al comprar.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</Label>
                                    <Select
                                        value={editingProduct?.type}
                                        onValueChange={(val) => setEditingProduct({ ...editingProduct, type: val as ProductType })}
                                    >
                                        <SelectTrigger className="rounded-lg h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ProductType.Pass}>Pase (Visita única)</SelectItem>
                                            <SelectItem value={ProductType.Package}>Paquete (Varias sesiones)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Precio (MXN)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                        <Input
                                            type="number"
                                            value={editingProduct?.price || ""}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                            className="pl-7 rounded-lg h-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isUnlimited" className="text-sm font-bold">Usos Ilimitados</Label>
                                        <p className="text-[10px] text-muted-foreground">Ideal para membresías o suscripciones mensuales.</p>
                                    </div>
                                    <Switch
                                        id="isUnlimited"
                                        checked={editingProduct?.isUnlimited || false}
                                        onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, isUnlimited: !!checked })}
                                    />
                                </div>

                                {!editingProduct?.isUnlimited && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Número de Usos</Label>
                                        <div className="relative">
                                            <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                value={editingProduct?.totalUses || ""}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, totalUses: parseInt(e.target.value) })}
                                                className="pl-10 rounded-lg h-10"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Vigencia (Días)</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            value={editingProduct?.validityDays || ""}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, validityDays: parseInt(e.target.value) })}
                                            placeholder="Sin límite si está vacío"
                                            className="pl-10 rounded-lg h-10"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Días que tiene el cliente para usar sus sesiones desde la compra.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Servicios que pueden usar esta oferta</Label>
                                <div className="border rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto bg-background">
                                    {services.map((service) => (
                                        <div key={service._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                            <Checkbox
                                                id={`svc-dlg-${service._id}`}
                                                checked={editingProduct?.allowedServiceIds?.includes(service._id)}
                                                onCheckedChange={(checked) => {
                                                    const ids = editingProduct?.allowedServiceIds || [];
                                                    setEditingProduct({
                                                        ...editingProduct,
                                                        allowedServiceIds: checked
                                                            ? [...ids, service._id]
                                                            : ids.filter(id => id !== service._id)
                                                    });
                                                }}
                                                className="rounded-sm border-muted-foreground/30 data-[state=checked]:bg-primary"
                                            />
                                            <label htmlFor={`svc-dlg-${service._id}`} className="text-sm font-medium cursor-pointer flex-1">
                                                {service.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-muted-foreground">Un mismo paquete puede usarse para múltiples servicios.</p>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsProductDialogOpen(false)}
                                className="font-semibold text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" className="rounded-lg px-6 font-bold shadow-sm h-10">
                                {editingProduct?._id ? "Actualizar Oferta" : "Crear Oferta"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Product Confirmation */}
            <Dialog open={isDeletingProduct} onOpenChange={setIsDeletingProduct}>
                <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Eliminar Producto
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar <strong>{productToDelete?.name}</strong>?
                            Esta acción eliminará el producto de <strong>TODOS</strong> los servicios vinculados y no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsDeletingProduct(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDeleteProduct}>Eliminar permanentemente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Link Existing Product Dialog */}
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                            Vincular Paquetes Existentes
                        </DialogTitle>
                        <DialogDescription>
                            Selecciona los paquetes que quieres ofrecer para este servicio.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="border rounded-2xl overflow-hidden divide-y bg-background">
                            {products.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    No hay paquetes creados todavía.
                                </div>
                            ) : (
                                products.map((product) => (
                                    <div key={product._id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`link-pkg-${product._id}`}
                                                checked={linkingServiceId ? product.allowedServiceIds.includes(linkingServiceId) : false}
                                                onCheckedChange={() => linkingServiceId && handleToggleProductRelationship(product, linkingServiceId)}
                                            />
                                            <div className="space-y-0.5">
                                                <label htmlFor={`link-pkg-${product._id}`} className="text-sm font-bold cursor-pointer">
                                                    {product.name}
                                                </label>
                                                <p className="text-[10px] text-muted-foreground">
                                                    ${product.price} • {product.isUnlimited ? "Ilimitado" : `${product.totalUses} usos`}
                                                </p>
                                            </div>
                                        </div>
                                        {product.active ? (
                                            <Badge variant="outline" className="text-[9px] bg-green-50 text-green-600 border-green-100">Activo</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[9px]">Inactivo Global</Badge>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsLinkDialogOpen(false)} className="w-full font-bold">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Service Confirmation */}
            <Dialog open={isDeletingService} onOpenChange={setIsDeletingService}>
                <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <span>Eliminar Servicio</span>
                        </DialogTitle>
                        <DialogDescription className="space-y-3 pt-2">
                            <p className="text-base">
                                ¿Estás seguro de que deseas eliminar <strong className="text-foreground">{serviceToDelete?.name}</strong>?
                            </p>
                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-2">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-destructive">Esta acción no se puede deshacer</p>
                                        <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                                            <li>Se eliminarán todas las reservas futuras asociadas</li>
                                            <li>Los paquetes vinculados perderán la relación con este servicio</li>
                                            <li>El servicio desaparecerá de tu catálogo público</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeletingService(false)}
                            className="font-semibold"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteService}
                            className="font-bold shadow-sm"
                        >
                            Eliminar permanentemente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
