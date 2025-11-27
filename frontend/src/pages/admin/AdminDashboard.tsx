import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Search,
    Plus,
    MoreHorizontal,
    Building2,
    Users,
    Activity,
    Calendar,
    Filter,
    Eye
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import useAuth from "@/auth/useAuth";
import { createBusiness, getAllBusinesses, type Business } from "@/api/businessesApi";
import { getAllUsers } from "@/api/usersApi";
import { getBookingsByBusiness } from "@/api/bookingsApi";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "other",
        email: "",
        phone: "",
        address: "",
        ownerName: "",
        website: "",
        description: "",
        timezone: "America/Mexico_City",
        currency: "MXN",
        subscriptionStatus: "trial"
    });
    const [stats, setStats] = useState({
        totalBusinesses: 0,
        totalUsers: 0,
        totalBookings: 0,
        activeBusinesses: 0
    });

    useEffect(() => {
        if (user?.role !== "owner") {
            navigate("/");
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        try {
            setLoading(true);

            const businessesData = await getAllBusinesses();
            setBusinesses(businessesData);

            let usersCount = 0;
            try {
                const usersData = await getAllUsers();
                usersCount = usersData.length;
            } catch {
                console.log("Users endpoint not available");
            }

            let bookingsCount = 0;
            try {
                const bookingPromises = businessesData.map(b =>
                    getBookingsByBusiness(b._id).catch(() => [])
                );
                const allBookings = await Promise.all(bookingPromises);
                bookingsCount = allBookings.reduce((acc, curr) => acc + curr.length, 0);
            } catch {
                console.log("Bookings endpoint not available");
            }

            setStats({
                totalBusinesses: businessesData.length,
                totalUsers: usersCount,
                totalBookings: bookingsCount,
                activeBusinesses: businessesData.filter(b => b.subscriptionStatus === 'active').length
            });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    const filteredBusinesses = businesses.filter(business => {
        const name = (business.businessName || business.name || "").toLowerCase();
        return (
            name.includes(searchTerm.toLowerCase()) ||
            business.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            business.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            business.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const getStatusColor = (status?: string) => {
        const normalized = status ?? "trial";
        switch (normalized) {
            case "active": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "inactive": return "bg-slate-100 text-slate-800 hover:bg-slate-100";
            case "trial": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getTypeLabel = (type?: string) => {
        switch (type) {
            case "dentist": return "Dentista";
            case "barber": return "Barberia";
            case "nutritionist": return "Nutr\u00f3logo";
            default: return "Otro";
        }
    };

    const handleViewBusiness = (businessId: string) => {
        navigate(`/business/${businessId}/dashboard`);
    };

    const schemaSummary = useMemo(
        () => [
            { title: "Identidad", fields: ["Nombre comercial", "Tipo", "Logo URL", "Descripcion breve"] },
            { title: "Contacto", fields: ["Email", "Telefono", "Direccion", "Sitio web"] },
            { title: "Operacion", fields: ["Zona horaria", "Moneda", "Estado de suscripcion"] },
        ],
        [],
    );

    const handleFieldChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateBusiness = async () => {
        if (!formData.name.trim()) {
            toast.error("El nombre del negocio es obligatorio");
            return;
        }
        const ownerUserId = (user as any)?._id || (user as any)?.userId;
        if (!ownerUserId) {
            toast.error("No se pudo obtener el ID del propietario. Inicia sesi\u00f3n nuevamente.");
            return;
        }

        try {
            setCreating(true);
            const payload = {
                name: formData.name.trim(),
                businessName: formData.name.trim(),
                type: formData.type,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                address: formData.address || undefined,
                ownerName: formData.ownerName || undefined,
                ownerUserId,
                subscriptionStatus: formData.subscriptionStatus,
                metadata: {
                    website: formData.website || undefined,
                    description: formData.description || undefined,
                    timezone: formData.timezone || undefined,
                    currency: formData.currency || undefined,
                },
            };

            const created = await createBusiness(payload);
            setBusinesses((prev) => [created, ...prev]);
            toast.success("Negocio creado");
            setShowCreateModal(false);
            setFormData({
                name: "",
                type: "other",
                email: "",
                phone: "",
                address: "",
                ownerName: "",
                website: "",
                description: "",
                timezone: "America/Mexico_City",
                currency: "MXN",
                subscriptionStatus: "trial"
            });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "No se pudo crear el negocio");
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Panel de Administracion</h1>
                        <p className="text-sm text-muted-foreground">Gestiona los negocios registrados y monitorea su actividad.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button variant="outline" onClick={logout} className="w-full sm:w-auto">
                            Cerrar Sesion
                        </Button>
                        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo Negocio
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-full max-w-3xl sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Nuevo negocio</DialogTitle>
                                    <DialogDescription>Captura el esquema principal para configurarlo en BookPro.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label>Nombre comercial</Label>
                                            <Input
                                                placeholder="Clinica Zamora"
                                                value={formData.name}
                                                onChange={(e) => handleFieldChange("name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Tipo</Label>
                                            <Select value={formData.type} onValueChange={(val) => handleFieldChange("type", val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dentist">Dentista</SelectItem>
                                                    <SelectItem value="barber">Barberia</SelectItem>
                                                    <SelectItem value="nutritionist">Nutriologo</SelectItem>
                                                    <SelectItem value="spa">Spa</SelectItem>
                                                    <SelectItem value="gym">Gym</SelectItem>
                                                    <SelectItem value="other">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Email de contacto</Label>
                                            <Input
                                                type="email"
                                                placeholder="contacto@negocio.com"
                                                value={formData.email}
                                                onChange={(e) => handleFieldChange("email", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Telefono</Label>
                                            <PhoneInput
                                                country="mx"
                                                enableSearch
                                                countryCodeEditable={false}
                                                value={formData.phone}
                                                onChange={(value) => handleFieldChange("phone", value)}
                                                placeholder="+52 55 1234 5678"
                                                containerClass="w-full"
                                                inputClass="!w-full !h-10 !text-base !bg-background !border !border-input !rounded-md !pl-12 focus:!ring-2 focus:!ring-ring focus:!ring-offset-2"
                                                buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                                                dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Direccion</Label>
                                            <Textarea
                                                placeholder="Calle, numero, ciudad"
                                                value={formData.address}
                                                onChange={(e) => handleFieldChange("address", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label>Nombre del dueno</Label>
                                            <Input
                                                placeholder="Nombre del administrador"
                                                value={formData.ownerName}
                                                onChange={(e) => handleFieldChange("ownerName", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Descripcion breve</Label>
                                            <Textarea
                                                placeholder="Que ofreces y a quien atiendes"
                                                value={formData.description}
                                                onChange={(e) => handleFieldChange("description", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Sitio web</Label>
                                            <Input
                                                placeholder="https://"
                                                value={formData.website}
                                                onChange={(e) => handleFieldChange("website", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label>Zona horaria</Label>
                                                <Input
                                                    placeholder="America/Mexico_City"
                                                    value={formData.timezone}
                                                    onChange={(e) => handleFieldChange("timezone", e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Moneda</Label>
                                                <Input
                                                    placeholder="MXN"
                                                    value={formData.currency}
                                                    onChange={(e) => handleFieldChange("currency", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Estado de suscripcion</Label>
                                            <Select
                                                value={formData.subscriptionStatus}
                                                onValueChange={(val) => handleFieldChange("subscriptionStatus", val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="trial">Prueba</SelectItem>
                                                    <SelectItem value="active">Activo</SelectItem>
                                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="rounded-lg border bg-slate-50 p-3">
                                            <p className="text-sm font-semibold mb-2">Esquema principal recomendado</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {schemaSummary.map((group) => (
                                                    <div key={group.title} className="space-y-1">
                                                        <p className="text-xs font-medium text-muted-foreground">{group.title}</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {group.fields.map((field) => (
                                                                <span key={field} className="rounded-full bg-white px-2 py-1 text-[11px] border text-slate-700">
                                                                    {field}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="flex flex-row gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={creating}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleCreateBusiness} disabled={creating}>
                                        {creating ? "Creando..." : "Crear negocio"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Negocios</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                            <p className="text-xs text-muted-foreground">Registrados en la plataforma</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeBusinesses}</div>
                            <p className="text-xs text-muted-foreground">Negocios activos</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers || "N/A"}</div>
                            <p className="text-xs text-muted-foreground">En toda la plataforma</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalBookings || "N/A"}</div>
                            <p className="text-xs text-muted-foreground">Citas agendadas</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle>Negocios Registrados</CardTitle>
                                <CardDescription className="text-sm">Lista de todos los clientes y sus detalles.</CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="relative flex-1 sm:max-w-xs">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar negocio..."
                                        className="pl-8 w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="sm:w-auto">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                        <div className="overflow-x-auto">
                            <Table className="min-w-[720px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[180px]">Negocio</TableHead>
                                        <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                                        <TableHead className="hidden md:table-cell">Dueno</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="hidden lg:table-cell">Registro</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBusinesses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                No se encontraron negocios
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBusinesses.map((business) => (
                                            <TableRow key={business._id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{business.businessName || business.name}</span>
                                                        <span className="text-xs text-muted-foreground">{business.email || "N/A"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {getTypeLabel(business.type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{business.ownerName || business.ownerUserId || "N/A"}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(business.subscriptionStatus)} variant="secondary">
                                                        {(business.subscriptionStatus ?? 'trial') === 'active' ? 'Activo' :
                                                            (business.subscriptionStatus ?? 'trial') === 'trial' ? 'Prueba' :
                                                                (business.subscriptionStatus ?? 'inactive') === 'inactive' ? 'Inactivo' : 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : "N/A"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(business._id)}>
                                                                Copiar ID
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleViewBusiness(business._id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Ver dashboard
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toast.info("Funcionalidad proximamente")}>
                                                                Editar suscripcion
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => toast.info("Funcionalidad proximamente")}
                                                            >
                                                                Desactivar cuenta
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
