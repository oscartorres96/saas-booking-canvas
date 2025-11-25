import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Search,
    Plus,
    MoreHorizontal,
    Users,
    Calendar as CalendarIcon,
    DollarSign,
    Clock,
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
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Mock data for clients/appointments
const initialClients = [
    {
        id: "1",
        name: "María González",
        email: "maria@email.com",
        phone: "55 1234 5678",
        service: "Limpieza Dental",
        date: new Date("2024-05-15T10:00:00"),
        status: "confirmed",
        amount: 800
    },
    {
        id: "2",
        name: "Juan Pérez",
        email: "juan@email.com",
        phone: "55 8765 4321",
        service: "Consulta General",
        date: new Date("2024-05-15T11:30:00"),
        status: "pending",
        amount: 500
    },
    {
        id: "3",
        name: "Lucía Fernández",
        email: "lucia@email.com",
        phone: "55 1122 3344",
        service: "Blanqueamiento",
        date: new Date("2024-05-16T09:00:00"),
        status: "confirmed",
        amount: 2500
    },
    {
        id: "4",
        name: "Pedro Ramírez",
        email: "pedro@email.com",
        phone: "55 4455 6677",
        service: "Ortodoncia",
        date: new Date("2024-05-16T16:00:00"),
        status: "completed",
        amount: 1200
    },
    {
        id: "5",
        name: "Ana Torres",
        email: "ana@email.com",
        phone: "55 9988 7766",
        service: "Limpieza Dental",
        date: new Date("2024-05-17T12:00:00"),
        status: "cancelled",
        amount: 800
    }
];

const formSchema = z.object({
    name: z.string().min(2, { message: "El nombre es requerido" }),
    email: z.string().email({ message: "Email inválido" }),
    phone: z.string().min(10, { message: "Teléfono inválido" }),
    service: z.string().min(2, { message: "Servicio requerido" }),
    date: z.date({ required_error: "Fecha requerida" }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Hora inválida (HH:MM)" }),
    amount: z.coerce.number().min(0, { message: "Monto inválido" }),
});

const BusinessDashboard = () => {
    const [clients, setClients] = useState(initialClients);
    const [searchTerm, setSearchTerm] = useState("");
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            service: "",
            time: "09:00",
            amount: 0,
        },
    });

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.service.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            case "completed": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-100";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "confirmed": return "Confirmada";
            case "pending": return "Pendiente";
            case "completed": return "Completada";
            case "cancelled": return "Cancelada";
            default: return status;
        }
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Combine date and time
        const [hours, minutes] = values.time.split(':').map(Number);
        const appointmentDate = new Date(values.date);
        appointmentDate.setHours(hours, minutes);

        const newClient = {
            id: Math.random().toString(36).substr(2, 9),
            name: values.name,
            email: values.email,
            phone: values.phone,
            service: values.service,
            date: appointmentDate,
            status: "pending",
            amount: values.amount
        };

        // Simulate API call
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Agendando cita...',
                success: () => {
                    setClients([newClient, ...clients]);
                    setIsNewAppointmentOpen(false);
                    form.reset();
                    return 'Cita agendada exitosamente';
                },
                error: 'Error al agendar cita',
            }
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Negocio</h1>
                        <p className="text-muted-foreground">Bienvenido, aquí puedes gestionar tus citas y clientes.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => window.location.href = '/login'}>
                            Cerrar Sesión
                        </Button>

                        <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Nueva Cita
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Nueva Cita</DialogTitle>
                                    <DialogDescription>
                                        Ingresa los detalles del cliente y la cita.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre del Cliente</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej. Juan Pérez" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="juan@email.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Teléfono</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="55 1234 5678" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="service"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Servicio</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona un servicio" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Consulta General">Consulta General</SelectItem>
                                                            <SelectItem value="Limpieza Dental">Limpieza Dental</SelectItem>
                                                            <SelectItem value="Blanqueamiento">Blanqueamiento</SelectItem>
                                                            <SelectItem value="Ortodoncia">Ortodoncia</SelectItem>
                                                            <SelectItem value="Otro">Otro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="date"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Fecha</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-full pl-3 text-left font-normal",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(field.value, "PPP", { locale: es })
                                                                        ) : (
                                                                            <span>Seleccionar fecha</span>
                                                                        )}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) =>
                                                                        date < new Date()
                                                                    }
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="time"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Hora</FormLabel>
                                                        <FormControl>
                                                            <Input type="time" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Costo Estimado ($)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button type="submit">Agendar Cita</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {clients.filter(c => new Date(c.date).getDate() === new Date().getDate()).length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {clients.filter(c => new Date(c.date).getDate() === new Date().getDate() && c.status === 'pending').length} pendientes de confirmar
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${clients.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">+15% vs mes anterior</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{clients.length}</div>
                            <p className="text-xs text-muted-foreground">+8 nuevos esta semana</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {clients.filter(c => c.date > new Date()).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Agendadas a futuro</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content - Table */}
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Agenda de Citas</CardTitle>
                                <CardDescription>Gestiona tus próximas citas y el estado de tus clientes.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar cliente..."
                                        className="pl-8 w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Servicio</TableHead>
                                        <TableHead>Fecha y Hora</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{client.name}</span>
                                                    <span className="text-xs text-muted-foreground">{client.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{client.service}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{format(client.date, "PPP", { locale: es })}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(client.date, "p", { locale: es })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(client.status)} variant="secondary">
                                                    {getStatusLabel(client.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">${client.amount}</TableCell>
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
                                                        <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                                                        <DropdownMenuItem>Editar cita</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-green-600">Confirmar</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">Cancelar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BusinessDashboard;
