import React, { useState, useEffect } from "react";
import {
    getProductsByBusiness,
    createProduct,
    updateProduct,
    deleteProduct,
    Product,
    ProductType
} from "@/api/productsApi";
import { getServicesByBusiness, Service } from "@/api/servicesApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package, Tag, Clock, Repeat } from "lucide-react";
import { toast } from "sonner";

interface ProductsManagerProps {
    businessId: string;
}

export const ProductsManager = ({ businessId }: ProductsManagerProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [productsData, servicesData] = await Promise.all([
                getProductsByBusiness(businessId),
                getServicesByBusiness(businessId)
            ]);
            setProducts(productsData);
            setServices(servicesData);
        } catch (error) {
            toast.error("Error al cargar productos");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [businessId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct?._id) {
                await updateProduct(editingProduct._id, editingProduct);
                toast.success("Producto actualizado");
            } else {
                await createProduct({ ...editingProduct, businessId });
                toast.success("Producto creado");
            }
            setIsDialogOpen(false);
            setEditingProduct(null);
            loadData();
        } catch (error) {
            toast.error("Error al guardar producto");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;
        try {
            await deleteProduct(id);
            toast.success("Producto eliminado");
            loadData();
        } catch (error) {
            toast.error("Error al eliminar producto");
        }
    };

    const getProductTypeLabel = (type: ProductType) => {
        switch (type) {
            case ProductType.Pass: return "Pase Único";
            case ProductType.Package: return "Paquete de Sesiones";
            case ProductType.Single: return "Servicio Individual";
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Package className="h-6 w-6 text-primary" />
                            Gestión de Productos
                        </CardTitle>
                        <CardDescription>
                            Configura pases y paquetes de sesiones para tus clientes.
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingProduct({ type: ProductType.Package, active: true, allowedServiceIds: [] })}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Producto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>{editingProduct?._id ? "Editar Producto" : "Crear Nuevo Producto"}</DialogTitle>
                                    <DialogDescription>
                                        Define cómo se venderán tus servicios.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Nombre del Producto</Label>
                                        <Input
                                            value={editingProduct?.name || ""}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                            placeholder="Ej: Paquete 10 Clases"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tipo</Label>
                                            <Select
                                                value={editingProduct?.type}
                                                onValueChange={(val) => setEditingProduct({ ...editingProduct, type: val as ProductType })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={ProductType.Pass}>Pase Único</SelectItem>
                                                    <SelectItem value={ProductType.Package}>Paquete</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Precio (MXN)</Label>
                                            <Input
                                                type="number"
                                                value={editingProduct?.price || ""}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {(editingProduct?.type === ProductType.Package || editingProduct?.type === ProductType.Pass) && (
                                        <div className="flex items-center space-x-2 py-2">
                                            <Checkbox
                                                id="isUnlimited"
                                                checked={editingProduct?.isUnlimited || false}
                                                onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, isUnlimited: !!checked })}
                                            />
                                            <Label htmlFor="isUnlimited" className="cursor-pointer">Usos Ilimitados (Suscripción o Mensualidad)</Label>
                                        </div>
                                    )}

                                    {(editingProduct?.type === ProductType.Package || editingProduct?.type === ProductType.Pass) && !editingProduct?.isUnlimited && (
                                        <div className="space-y-2">
                                            <Label>Número de Usos</Label>
                                            <Input
                                                type="number"
                                                value={editingProduct?.totalUses || (editingProduct?.type === ProductType.Pass ? 1 : "")}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, totalUses: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Vigencia (Días)</Label>
                                        <Input
                                            type="number"
                                            value={editingProduct?.validityDays || ""}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, validityDays: parseInt(e.target.value) })}
                                            placeholder="Sin límite si está vacío"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Servicios Incluidos</Label>
                                        <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                                            {services.map((service) => (
                                                <div key={service._id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`svc-${service._id}`}
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
                                                    />
                                                    <label htmlFor={`svc-${service._id}`} className="text-sm cursor-pointer">
                                                        {service.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">
                                        {editingProduct?._id ? "Actualizar" : "Crear"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">Cargando...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Configuración</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No hay productos configurados. Comienza creando uno.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product._id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.type === ProductType.Package ? "default" : (product.type === ProductType.Pass ? "secondary" : "outline")}>
                                                    {product.type === ProductType.Package ? "Paquete" : (product.type === ProductType.Pass ? "Pase" : "Unico")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>${product.price}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                    {product.isUnlimited ? (
                                                        <span className="flex items-center gap-1 text-primary font-medium">
                                                            <Repeat className="h-3 w-3" /> Usos Ilimitados
                                                        </span>
                                                    ) : product.totalUses ? (
                                                        <span className="flex items-center gap-1">
                                                            <Repeat className="h-3 w-3" /> {product.totalUses} usos
                                                        </span>
                                                    ) : null}
                                                    {product.validityDays && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {product.validityDays} días
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Tag className="h-3 w-3" /> {product.allowedServiceIds.length || "Todos los"} servicios
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        setEditingProduct(product);
                                                        setIsDialogOpen(true);
                                                    }}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product._id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
