import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Copy, Package, Sparkles, QrCode as QrIcon, Instagram, Printer, CreditCard, Store } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Service } from "@/api/servicesApi";

export interface Product {
    _id: string;
    name: string;
    description?: string;
    type: 'PASS' | 'PACKAGE' | 'SINGLE';
}

type QRType = 'general' | 'service' | 'package';
type QRContext = 'instagram' | 'flyer' | 'card' | 'reception';

interface QRGeneratorProps {
    businessId: string;
    businessName: string;
    services?: Service[];
    packages?: Product[];
}

export function QRGenerator({ businessId, businessName, services = [], packages = [] }: QRGeneratorProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [qrType, setQrType] = useState<QRType>('general');
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');
    const [context, setContext] = useState<QRContext>('instagram');
    const { t } = useTranslation();

    // Generate URL based on QR type
    const getQRUrl = (): string => {
        const baseUrl = `${window.location.origin}/business/${businessId}/booking`;

        switch (qrType) {
            case 'service':
                return selectedServiceId ? `${baseUrl}?serviceId=${selectedServiceId}` : baseUrl;
            case 'package':
                return selectedPackageId ? `${baseUrl}?packageId=${selectedPackageId}` : baseUrl;
            case 'general':
            default:
                return baseUrl;
        }
    };

    useEffect(() => {
        const generateQR = async () => {
            const url = getQRUrl();
            try {
                const dataUrl = await QRCode.toDataURL(url, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });
                setQrDataUrl(dataUrl);
            } catch (err) {
                console.error(err);
                toast.error(t('dashboard.qr.toast_error'));
            }
        };

        generateQR();
    }, [qrType, selectedServiceId, selectedPackageId, businessId, t]);

    const handleDownload = () => {
        if (!qrDataUrl) return;

        const link = document.createElement("a");
        link.href = qrDataUrl;

        // Generate contextual filename
        let filename = `qr-${businessName.toLowerCase().replace(/\s+/g, '-')}`;
        if (qrType === 'service' && selectedServiceId) {
            const service = services.find(s => s._id === selectedServiceId);
            filename = `qr-${service?.name.toLowerCase().replace(/\s+/g, '-') || 'servicio'}`;
        } else if (qrType === 'package' && selectedPackageId) {
            const pkg = packages.find(p => p._id === selectedPackageId);
            filename = `qr-${pkg?.name.toLowerCase().replace(/\s+/g, '-') || 'paquete'}`;
        }
        filename += `-${context}.png`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('dashboard.qr.toast_download'));
    };

    const handleCopyLink = () => {
        const url = getQRUrl();
        navigator.clipboard.writeText(url);
        toast.success(t('dashboard.qr.toast_copy'));
    };

    const getContextIcon = () => {
        switch (context) {
            case 'instagram': return Instagram;
            case 'flyer': return Printer;
            case 'card': return CreditCard;
            case 'reception': return Store;
            default: return Instagram;
        }
    };

    const ContextIcon = getContextIcon();

    return (
        <div className="flex flex-col space-y-6 p-6">
            {/* Header with Value Proposition */}
            <div className="text-center space-y-2 pb-4 border-b border-border/50">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                </div>
                <h3 className="text-xl font-bold tracking-tight">{t('dashboard.qr.title')}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t('dashboard.qr.subtitle')}
                </p>
            </div>

            {/* Step 1: QR Type Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                    {t('dashboard.qr.type_label')}
                </Label>
                <Select value={qrType} onValueChange={(value) => setQrType(value as QRType)}>
                    <SelectTrigger className="w-full h-12 rounded-xl border-2 bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">
                            <div className="flex items-center gap-3 py-1">
                                <QrIcon className="h-4 w-4 text-blue-500" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">{t('dashboard.qr.type_general')}</span>
                                    <span className="text-xs text-muted-foreground">{t('dashboard.qr.type_general_desc')}</span>
                                </div>
                            </div>
                        </SelectItem>
                        <SelectItem value="service" disabled={services.length === 0}>
                            <div className="flex items-center gap-3 py-1">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">{t('dashboard.qr.type_service')}</span>
                                    <span className="text-xs text-muted-foreground">{t('dashboard.qr.type_service_desc')}</span>
                                </div>
                            </div>
                        </SelectItem>
                        <SelectItem value="package" disabled={packages.length === 0}>
                            <div className="flex items-center gap-3 py-1">
                                <Package className="h-4 w-4 text-green-500" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold">{t('dashboard.qr.type_package')}</span>
                                    <span className="text-xs text-muted-foreground">{t('dashboard.qr.type_package_desc')}</span>
                                </div>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* Service Selection (conditional) */}
                {qrType === 'service' && services.length > 0 && (
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                        <SelectTrigger className="w-full rounded-xl bg-background/50">
                            <SelectValue placeholder={t('dashboard.qr.select_service')} />
                        </SelectTrigger>
                        <SelectContent>
                            {services.filter(s => s.active).map((service) => (
                                <SelectItem key={service._id} value={service._id}>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium">{service.name}</span>
                                        <span className="text-xs text-muted-foreground">${service.price}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Package Selection (conditional) */}
                {qrType === 'package' && packages.length > 0 && (
                    <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                        <SelectTrigger className="w-full rounded-xl bg-background/50">
                            <SelectValue placeholder={t('dashboard.qr.select_package')} />
                        </SelectTrigger>
                        <SelectContent>
                            {packages.filter(p => p.type === 'PACKAGE' || p.type === 'PASS').map((pkg) => (
                                <SelectItem key={pkg._id} value={pkg._id}>
                                    <span className="font-medium">{pkg.name}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Step 2: Context Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                    {t('dashboard.qr.context_label')}
                </Label>
                <Select value={context} onValueChange={(value) => setContext(value as QRContext)}>
                    <SelectTrigger className="w-full h-12 rounded-xl border-2 bg-background">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="instagram">
                            <div className="flex items-center gap-3 py-1">
                                <Instagram className="h-4 w-4 text-pink-500" />
                                <span className="font-medium">{t('dashboard.qr.context_instagram')}</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="flyer">
                            <div className="flex items-center gap-3 py-1">
                                <Printer className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{t('dashboard.qr.context_flyer')}</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="card">
                            <div className="flex items-center gap-3 py-1">
                                <CreditCard className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">{t('dashboard.qr.context_card')}</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="reception">
                            <div className="flex items-center gap-3 py-1">
                                <Store className="h-4 w-4 text-orange-500" />
                                <span className="font-medium">{t('dashboard.qr.context_reception')}</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center space-y-4 p-6 bg-gradient-to-br from-background/80 to-background/40 border-2 border-border/50 rounded-2xl">
                {qrDataUrl ? (
                    <div className="bg-white p-5 rounded-2xl shadow-xl ring-4 ring-primary/10">
                        <img src={qrDataUrl} alt={`Código QR para ${businessName}`} className="w-56 h-56" />
                    </div>
                ) : (
                    <div className="w-56 h-56 bg-muted animate-pulse rounded-2xl" />
                )}

                {/* Context-based message */}
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                    <ContextIcon className="h-3.5 w-3.5" />
                    <span>{t(`dashboard.qr.context_tip_${context}`)}</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full">
                <Button onClick={handleDownload} className="gap-2 w-full h-12 rounded-xl font-semibold shadow-md text-white">
                    <Download className="h-4 w-4" />
                    {t('dashboard.qr.download')}
                </Button>

                <Button onClick={handleCopyLink} variant="outline" className="gap-2 w-full h-12 rounded-xl font-medium">
                    <Copy className="h-4 w-4" />
                    {t('dashboard.qr.copy_link')}
                </Button>
            </div>

            {/* Tips Section */}
            <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    💡 {t('dashboard.qr.final_tip')}
                </p>
            </div>
        </div>

    );
}
