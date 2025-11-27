import { useState } from "react";
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
    Filter
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data based on the new schema
const mockBusinesses = [
    {
        id: "1",
        businessName: "Clínica Dental Sonrisas",
        type: "dentist",
        ownerName: "Dr. Roberto Martínez",
        email: "contacto@sonrisas.com",
        phone: "+52 55 1234 5678",
        subscriptionStatus: "active",
        createdAt: "2024-01-15",
        metadata: { specialty: "Ortodoncia", chairs: "3" }
    },
    {
        id: "2",
        businessName: "Barbería El Caballero",
        type: "barber",
        ownerName: "Carlos Ruiz",
        email: "carlos@elcaballero.com",
        phone: "+52 55 8765 4321",
        subscriptionStatus: "active",
        createdAt: "2024-02-10",
        metadata: { chairs: "5", parking: "yes" }
    },
    {
        id: "3",
        businessName: "Nutrición Balanceada",
        type: "nutritionist",
        ownerName: "Lic. Ana Gómez",
        email: "ana@nutricion.com",
        phone: "+52 55 1122 3344",
        subscriptionStatus: "trial",
        createdAt: "2024-03-05",
        metadata: { consultationType: "online/presencial" }
    },
    {
        id: "4",
        businessName: "Spa Relajación Total",
        type: "other",
        ownerName: "Sofia López",
        email: "sofia@sparelax.com",
        phone: "+52 55 9988 7766",
        subscriptionStatus: "inactive",
        createdAt: "2023-11-20",
        metadata: { rooms: "4" }
    },
    {
        id: "5",
        businessName: "Gimnasio PowerFit",
        type: "other",
        ownerName: "Miguel Ángel",
        email: "info@powerfit.mx",
        phone: "+52 55 4455 6677",
        subscriptionStatus: "active",
        createdAt: "2024-01-01",
        metadata: { members: "150" }
    }
];

const Admin = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredBusinesses = mockBusinesses.filter(business =>
        business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "inactive": return "bg-slate-100 text-slate-800 hover:bg-slate-100";
            case "trial": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "dentist": return "Dentista";
            case "barber": return "Barbería";
            case "nutritionist": return "Nutriólogo";
            default: return "Otro";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Administración</h1>
                        <p className="text-muted-foreground">Gestiona los negocios registrados y monitorea su actividad.</p>
                    </div>
                    <div className="flex items-center gap-2">
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
                            <div className="text-2xl font-bold">{mockBusinesses.length}</div>
                            <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {mockBusinesses.filter(b => b.subscriptionStatus === 'active').length}
                            </div>
                            <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1,234</div>
                            <p className="text-xs text-muted-foreground">+54 nuevos usuarios</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">$45,231</div>
                            <p className="text-xs text-muted-foreground">+20.1% vs mes anterior</p>
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
                                {filteredBusinesses.map((business) => (
                                    <TableRow key={business.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{business.businessName}</span>
                                                <span className="text-xs text-muted-foreground">{business.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {getTypeLabel(business.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{business.ownerName}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(business.subscriptionStatus)} variant="secondary">
                                                {business.subscriptionStatus === 'active' ? 'Activo' :
                                                    business.subscriptionStatus === 'trial' ? 'Prueba' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(business.createdAt).toLocaleDateString()}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(business.id)}>
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
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Admin;
