import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { ShieldCheck, Mail, Loader2, RefreshCcw } from "lucide-react";
import { requestOtp, verifyOtp, OtpPurpose } from "@/api/otpApi";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface OtpVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (token: string) => void;
    email: string;
    businessId: string;
    purpose: OtpPurpose;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    email,
    businessId,
    purpose,
}) => {
    const [otp, setOtp] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const { t } = useTranslation();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // Reset OTP when modal opens
    useEffect(() => {
        if (isOpen) {
            setOtp("");
        }
    }, [isOpen]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            toast.error("Por favor ingresa el código de 6 dígitos");
            return;
        }

        try {
            setIsVerifying(true);
            const response = await verifyOtp(email, otp, purpose);
            if (response.verified && response.verificationToken) {
                toast.success("Verificación exitosa");
                onSuccess(response.verificationToken);
                onClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al verificar el código");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        try {
            setIsResending(true);
            await requestOtp(email, businessId, purpose);
            toast.success("Código reenviado con éxito");
            setCountdown(60); // 1 minute cooldown
        } catch (error: any) {
            toast.error("Error al reenviar el código");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-width-[425px]">
                <DialogHeader className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-xl text-center">
                        Verifica tu correo
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Hemos enviado un código de seguridad a <strong>{email}</strong> para {
                            purpose === 'ASSET_USAGE'
                                ? 'autorizar el uso de tus créditos.'
                                : 'verificar tu identidad y proceder con el pago seguro.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>Ingresa el código de 6 dígitos</span>
                    </div>

                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        disabled={isVerifying}
                        className="gap-2 sm:gap-4"
                    >
                        <InputOTPGroup className="gap-2">
                            <InputOTPSlot index={0} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl font-black rounded-xl border-2 italic" />
                            <InputOTPSlot index={1} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl font-black rounded-xl border-2 italic" />
                            <InputOTPSlot index={2} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl font-black rounded-xl border-2 italic" />
                            <InputOTPSlot index={3} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl font-black rounded-xl border-2 italic" />
                            <InputOTPSlot index={4} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl font-black rounded-xl border-2 italic" />
                            <InputOTPSlot index={5} className="w-10 h-12 sm:w-14 sm:h-16 text-lg sm:text-2xl font-black rounded-xl border-2 italic" />
                        </InputOTPGroup>
                    </InputOTP>

                    <div className="flex flex-col items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResend}
                            disabled={countdown > 0 || isResending}
                            className="text-xs"
                        >
                            {isResending ? (
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            ) : (
                                <RefreshCcw className="w-3 h-3 mr-2" />
                            )}
                            {countdown > 0
                                ? `Reenviar código en ${countdown}s`
                                : "No recibí el código. Reenviar"}
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        className="w-full"
                        onClick={handleVerify}
                        disabled={otp.length !== 6 || isVerifying}
                    >
                        {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar y continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
