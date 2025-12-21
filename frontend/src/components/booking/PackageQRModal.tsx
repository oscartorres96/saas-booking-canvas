import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, ArrowRight, Info, CheckCircle2, Clock } from "lucide-react";
import type { Product } from "@/api/productsApi";
import type { CustomerAsset } from "@/api/customerAssetsApi";
import { motion, AnimatePresence } from "framer-motion";

interface PackageQRModalProps {
    product: Product;
    open: boolean;
    onClose: () => void;
    onBuyOnly: () => void;
    onBuyAndBook: () => void;
    existingAssets?: CustomerAsset[];
}

export const PackageQRModal = ({
    product,
    open,
    onClose,
    onBuyOnly,
    onBuyAndBook,
    existingAssets = []
}: PackageQRModalProps) => {
    const hasSimilarAsset = existingAssets.some(asset => asset.productId?._id === product._id);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[450px] w-[95vw] rounded-[2rem] md:rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-950 max-h-[90vh] overflow-y-auto scrollbar-none">
                <div className="relative">
                    {/* Glassmorphic Background decoration */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px] animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-[60px] animate-pulse" />

                    {/* Header with gradient and icon */}
                    <div className="bg-gradient-to-b from-primary/10 via-background to-background p-6 md:p-8 pb-4 relative">
                        <div className="flex flex-col items-center text-center gap-3">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="p-3 rounded-2xl bg-primary/10 text-primary mb-1 shadow-inner ring-1 ring-primary/20"
                            >
                                <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
                            </motion.div>

                            <Badge variant="outline" className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] border-primary/30 text-primary bg-primary/5 px-4 py-1.5 rounded-full">
                                Oferta Especial QR
                            </Badge>

                            <DialogTitle className="text-2xl md:text-3xl lg:text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-[0.9] mt-2">
                                {product.name}
                            </DialogTitle>

                            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 italic mt-1">
                                Beneficio Exclusivo
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="px-5 md:px-8 pb-8 space-y-6 relative">
                        {/* Info Message for existing assets */}
                        {hasSimilarAsset && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-start gap-4 transition-colors hover:bg-blue-500/10 dark:hover:bg-blue-500/15"
                            >
                                <div className="p-1.5 rounded-full bg-blue-500/20">
                                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Ya tienes este paquete activo</p>
                                    <p className="text-[10px] text-blue-500/80 font-medium italic leading-relaxed">Puedes comprar otro para acumular créditos o extender tu vigencia.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* High-Impact Price & Features Card */}
                        <div className="relative group">
                            {/* Animated Glow Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-[2.6rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 -z-10 animate-pulse" />

                            <div className="relative bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 p-6 md:p-8 rounded-[2.5rem] space-y-6 shadow-xl dark:shadow-none backdrop-blur-xl overflow-hidden ring-1 ring-white/20 dark:ring-white/5">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary italic block">Inversión Especial</span>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                                ${product.price}
                                            </span>
                                            <span className="text-sm font-black text-primary uppercase tracking-tighter italic">MXN</span>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary text-primary-foreground border-none text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 py-1 group-hover:scale-110 transition-transform">
                                        Mejor Opción
                                    </Badge>
                                </div>

                                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                                <div className="grid gap-4">
                                    <motion.div
                                        whileHover={{ x: 5 }}
                                        className="flex items-center gap-4 py-1"
                                    >
                                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                                Acceso Total
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase italic pb-0.5 opacity-80">
                                                {product.isUnlimited ? 'CLASES ILIMITADAS' : `${product.totalUses} CLASES INCLUIDAS`}
                                            </span>
                                        </div>
                                    </motion.div>

                                    {product.validityDays && (
                                        <motion.div
                                            whileHover={{ x: 5 }}
                                            className="flex items-center gap-4 py-1"
                                        >
                                            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                                    Vigencia Premium
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase italic pb-0.5 opacity-80">
                                                    VÁLIDO POR {product.validityDays} DÍAS
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="px-6 relative"
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary/20 rounded-full" />
                                <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed italic font-medium opacity-80 pl-4">
                                    {product.description}
                                </p>
                            </motion.div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col gap-3 pt-2">
                            <Button
                                size="lg"
                                className="w-full h-14 md:h-18 rounded-2xl md:rounded-[1.8rem] gap-4 font-black uppercase italic tracking-widest text-base md:text-xl shadow-[0_15px_30px_-10px_rgba(var(--primary),0.3)] hover:shadow-[0_20px_40px_-12px_rgba(var(--primary),0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground group"
                                onClick={onBuyAndBook}
                            >
                                <Zap className="w-6 h-6 fill-current group-hover:animate-bounce" />
                                Reserve Ahora
                                <ArrowRight className="w-6 h-6 ml-auto group-hover:translate-x-2 transition-transform" />
                            </Button>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold uppercase italic tracking-widest text-[9px] md:text-[10px] border-2 group/btn hover:border-primary/30 transition-all"
                                    onClick={onBuyOnly}
                                >
                                    Comprar para después
                                </Button>

                                <Button
                                    size="lg"
                                    variant="ghost"
                                    className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase italic tracking-widest text-[9px] md:text-[10px] opacity-40 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                                    onClick={onClose}
                                >
                                    Ver otros servicios
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


