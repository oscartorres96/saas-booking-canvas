import React, { useState, useEffect } from "react";
import { getProductsByBusiness, createProductCheckout, Product, ProductType } from "@/api/productsApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Check, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ProductsStoreProps {
    businessId: string;
    primaryColor?: string;
}

export const ProductsStore = ({ businessId, primaryColor }: ProductsStoreProps) => {
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [purchaseEmail, setPurchaseEmail] = useState("");
    const [purchaseName, setPurchaseName] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await getProductsByBusiness(businessId);
                setProducts(data.filter(p => p.active));
            } catch (error) {
                console.error("Error loading products", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProducts();
    }, [businessId]);

    const handlePurchase = async () => {
        if (!purchaseEmail || !selectedProduct) return;
        try {
            setIsSubmitting(true);
            const { url } = await createProductCheckout({
                productId: selectedProduct._id,
                businessId,
                clientEmail: purchaseEmail,
                clientName: purchaseName,
                successUrl: window.location.href + "?success=true",
                cancelUrl: window.location.href,
            });
            window.location.href = url;
        } catch (error) {
            toast.error("Error al iniciar la compra");
            setIsSubmitting(false);
        }
    };

    if (isLoading || products.length === 0) return null;

    return (
        <section className="py-12 bg-slate-50 dark:bg-slate-900/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-4">{t('booking.products.section_title')}</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {t('booking.products.section_subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {products.map((product) => (
                        <Card key={product._id} className="relative overflow-hidden border-2 hover:border-primary transition-all group">
                            {product.type === ProductType.Package && (
                                <div className="absolute top-0 right-0 p-2">
                                    <Badge className="bg-primary hover:bg-primary">{t('booking.products.badge_popular')}</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle>{product.name}</CardTitle>
                                <CardDescription>{product.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">${product.price}</span>
                                    <span className="text-muted-foreground">{t('booking.products.price_currency')}</span>
                                </div>

                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {product.type === ProductType.Package
                                            ? (product.isUnlimited ? t('booking.products.feature_unlimited') : t('booking.products.feature_sessions', { count: product.totalUses }))
                                            : t('booking.products.feature_single_use')
                                        }
                                    </li>
                                    {product.validityDays && (
                                        <li className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            {t('booking.products.feature_validity', { days: product.validityDays })}
                                        </li>
                                    )}
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {t('booking.products.feature_no_hidden')}
                                    </li>
                                </ul>

                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setIsPurchaseDialogOpen(true);
                                    }}
                                    style={primaryColor ? { backgroundColor: primaryColor } : {}}
                                >
                                    {t('booking.products.btn_buy')}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('booking.products.dialog_title')}</DialogTitle>
                        <DialogDescription>
                            {t('booking.products.dialog_description')} <strong>{selectedProduct?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('booking.products.name_label')}</Label>
                            <Input
                                value={purchaseName}
                                onChange={(e) => setPurchaseName(e.target.value)}
                                placeholder={t('booking.products.name_placeholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('booking.products.email_label')}</Label>
                            <Input
                                type="email"
                                value={purchaseEmail}
                                onChange={(e) => setPurchaseEmail(e.target.value)}
                                placeholder={t('booking.products.email_placeholder')}
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {t('booking.products.email_hint')}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full"
                            onClick={handlePurchase}
                            disabled={!purchaseEmail || isSubmitting}
                        >
                            {isSubmitting ? t('booking.products.btn_loading') : t('booking.products.btn_proceed')}
                            <CreditCard className="ml-2 h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
};
