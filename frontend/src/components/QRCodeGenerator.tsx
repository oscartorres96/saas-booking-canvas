import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface QRCodeGeneratorProps {
    url: string;
    businessName: string;
}

export function QRCodeGenerator({ url, businessName }: QRCodeGeneratorProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const { t } = useTranslation();

    useEffect(() => {
        const generateQR = async () => {
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
    }, [url, t]);

    const handleDownload = () => {
        if (!qrDataUrl) return;

        const link = document.createElement("a");
        link.href = qrDataUrl;
        link.download = `qr-reservas-${businessName.toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('dashboard.qr.toast_download'));
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url);
        toast.success(t('dashboard.qr.toast_copy'));
    };

    return (
        <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg bg-white/5">
            <h3 className="text-lg font-semibold">{t('dashboard.qr.title')}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
                {t('dashboard.qr.description')}
            </p>

            {qrDataUrl ? (
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <img src={qrDataUrl} alt={`Código QR para ${businessName}`} className="w-48 h-48" />
                </div>
            ) : (
                <div className="w-48 h-48 bg-muted animate-pulse rounded-xl" />
            )}

            <div className="flex flex-col gap-2 w-full max-w-xs">
                <Button onClick={handleDownload} variant="outline" className="gap-2 w-full">
                    <Download className="h-4 w-4" />
                    {t('dashboard.qr.download')}
                </Button>

                <Button onClick={handleCopyLink} variant="secondary" className="gap-2 w-full">
                    <Copy className="h-4 w-4" />
                    {t('dashboard.qr.copy_link')}
                </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                {t('dashboard.qr.tip')}
            </p>
        </div>
    );
}
