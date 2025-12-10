import { useState, useEffect } from "react";
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
import {
    Search,
    Plus,
    MoreHorizontal,
    Building2,
    Users,
    Activity,
    DollarSign,
    Filter,
    Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAllBusinesses, Business } from "@/api/businessesApi";
import { useToast } from "@/components/ui/use-toast";

const Admin = () => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const data = await getAllBusinesses();
                setBusinesses(data);
            } catch (error) {
                console.error("Error fetching businesses:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los negocios.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchBusinesses();
    }, [toast]);

    const filteredBusinesses = businesses.filter(business =>
        (business.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (business.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (business.type || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40";
            case "inactive": return "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70";
            case "trial": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40";
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
        }
    };

    const getTypeLabel = (type?: string) => {
        switch (type) {
            case "dentist": return "Dentista";
            case "barber": return "Barbería";
            case "nutritionist": return "Nutriólogo";
            default: return type || "Otro";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-black p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
                        <p className="text-muted-foreground">Gestiona los negocios registrados y monitorea su actividad.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="outline" onClick={() => window.location.href = '/login'}>
                            Cerrar Sesión
                        </Button>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Negocio
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Negocios</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{businesses.length}</div>
                            {/* <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p> */}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {businesses.filter(b => b.subscriptionStatus === 'active').length}
                            </div>
                            {/* <p className="text-xs text-muted-foreground">+12% vs mes anterior</p> */}
                        </CardContent>
                    </Card>
                    {/* Placeholder Stats */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">-</div>
                            <p className="text-xs text-muted-foreground">No disponible</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">-</div>
                            <p className="text-xs text-muted-foreground">No disponible</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content - Table */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Negocios Registrados</CardTitle>
                                <CardDescription>Lista de todos los clientes y sus detalles.</CardDescription>
                            </div>
                            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar negocio..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="self-start sm:self-auto"
                                >
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table className="min-w-[640px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Negocio</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Dueño</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Registro</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBusinesses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No se encontraron negocios.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredBusinesses.map((business) => (
                                            <TableRow key={business._id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{business.businessName || business.name}</span>
                                                        <span className="text-xs text-muted-foreground">{business.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {getTypeLabel(business.type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{business.ownerName || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(business.subscriptionStatus)} variant="secondary">
                                                        {business.subscriptionStatus === 'active' ? 'Activo' :
                                                            business.subscriptionStatus === 'trial' ? 'Prueba' : 'Inactivo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(business._id)}>
                                                                Copiar ID
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                                                            <DropdownMenuItem>Editar suscripción</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600">Desactivar cuenta</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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
        </div>
    );
};

export default Admin;
