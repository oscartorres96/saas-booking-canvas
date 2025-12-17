// --- IMPORTS ---
import { useEffect, useState } from "react";
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
  DialogTrigger
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsPanel } from "@/components/admin/LeadsPanel";

import {
  Search,
  Plus,
  MoreHorizontal,
  Building2,
  Users,
  Activity,
  Calendar,
  Filter,
  Eye,
  ExternalLink,
  CheckCircle,
  Copy
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import useAuth from "@/auth/useAuth";

import {
  createBusiness,
  getAllBusinesses,
  updateBusiness,
  type Business
} from "@/api/businessesApi";

import {
  getAllUsers,
  getUserById
} from "@/api/usersApi";

import { getBookingsByBusiness } from "@/api/bookingsApi";
import { ThemeToggle } from "@/components/ThemeToggle";

// -------------------------------------------------------------------
//                          COMPONENTE PRINCIPAL
// -------------------------------------------------------------------

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successCredentials, setSuccessCredentials] = useState<{ email: string; password?: string; loginUrl: string } | null>(null);

  // ---------- FORMULARIO (CREAR) ----------
  // Captura los datos necesarios para crear un negocio y su administrador.  
  const [formData, setFormData] = useState({
    name: "",
    type: "other",
    phone: "",
    address: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    website: "",
    description: "",
  });

  // ---------- FORMULARIO (EDITAR) ----------
  // Guarda los datos editables del negocio (no incluye correo ni contraseña, ya que estos se manejan por separado).
  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "other",
    phone: "",
    address: "",
    ownerName: "",
    website: "",
    description: "",
    subscriptionStatus: "trial",
  });

  // Datos del usuario administrador en modo edición
  const [editOwnerEmail, setEditOwnerEmail] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editOwnerPassword, setEditOwnerPassword] = useState("");

  // Estadísticas para panel
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalUsers: 0,
    totalBookings: 0,
    activeBusinesses: 0
  });

  // -------------------------------------------------------------------
  //                          LOAD DATA
  // -------------------------------------------------------------------

  useEffect(() => {
    // Restringir acceso solo al Super Admin
    const ALLOWED_ADMINS = ['oscartorres0396@gmail.com', 'owner@bookpro.com'];

    if (user && !ALLOWED_ADMINS.includes(user.email || '')) {
      toast.error('Acceso denegado. Solo administradores.');
      navigate("/dashboard");
      return;
    }

    if (user) {
      loadData();
    }
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
      } catch { }

      let bookingsCount = 0;
      try {
        const bookingPromises = businessesData.map(b =>
          getBookingsByBusiness(b._id).catch(() => [])
        );
        const allBookings = await Promise.all(bookingPromises);
        bookingsCount = allBookings.reduce((acc, curr) => acc + curr.length, 0);
      } catch { }

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

  // -------------------------------------------------------------------
  //                          CREATE BUSINESS
  // -------------------------------------------------------------------

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateBusiness = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre del negocio es obligatorio");
      return;
    }

    if (!formData.ownerName.trim() || !formData.ownerEmail.trim()) {
      toast.error("Email y nombre del administrador son obligatorios");
      return;
    }

    try {
      setCreating(true);

      // --- 100% CORRECTO PARA TU BACKEND ---
      const payload = {
        name: formData.name.trim(),
        businessName: formData.name.trim(),
        type: formData.type,
        email: formData.ownerEmail.trim(),
        ownerPassword: formData.ownerPassword.trim(),
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        ownerName: formData.ownerName.trim(),
        metadata: {
          website: formData.website || undefined,
          description: formData.description || undefined,
        },
        subscriptionStatus: "trial",
      };

      // Backend crea usuario + contraseña temporal + asigna businessId
      const response = await createBusiness(payload);

      setBusinesses(prev => [response.business, ...prev]);

      // Mostrar diálogo de éxito
      setSuccessCredentials({
        email: response.credentials.email,
        password: response.credentials.password || undefined,
        loginUrl: `${window.location.origin}/login`
      });
      setShowSuccessDialog(true);

      // Reset
      setShowCreateModal(false);
      setFormData({
        name: "",
        type: "other",
        phone: "",
        address: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "", // <-- ya no se usa, pero lo dejamos vacío en caso de UI
        website: "",
        description: "",
      });

    } catch (error: any) {
      toast.error(error?.response?.data?.message || "No se pudo crear el negocio");
    } finally {
      setCreating(false);
    }
  };

  // -------------------------------------------------------------------
  //                          EDIT BUSINESS
  // -------------------------------------------------------------------

  const openEditModal = async (business: Business) => {
    setSelectedBusiness(business);

    // Preparar campos del negocio para edición (sin datos de usuario)
    setEditFormData({
      name: business.businessName || business.name || "",
      type: business.type || "other",
      phone: business.phone || "",
      address: business.address || "",
      ownerName: business.ownerName || "",
      website: (business.metadata as any)?.website || "",
      description: (business.metadata as any)?.description || "",
      subscriptionStatus: business.subscriptionStatus || "trial",
    });

    // Cargar datos del usuario administrador
    if (business.ownerUserId) {
      try {
        const u = await getUserById(business.ownerUserId);
        setEditOwnerEmail(u.email);
        setEditOwnerName(u.name);
      } catch { }
    }

    setEditOwnerPassword("");
    setShowEditModal(true);
  };

  const handleUpdateBusiness = async () => {
    if (!selectedBusiness?._id) return;

    try {
      await updateBusiness(selectedBusiness._id, {
        businessName: editFormData.name,
        name: editFormData.name,
        type: editFormData.type,
        email: editOwnerEmail.trim(),
        phone: editFormData.phone,
        address: editFormData.address,
        ownerName: editOwnerName.trim(),
        ownerPassword: editOwnerPassword.trim() || undefined,
        subscriptionStatus: editFormData.subscriptionStatus,
        metadata: {
          website: editFormData.website,
          description: editFormData.description,
        }
      });

      await loadData();
      toast.success("Negocio actualizado");

    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error al actualizar el negocio");
    } finally {
      setShowEditModal(false);
      setSelectedBusiness(null);
    }
  };

  // -------------------------------------------------------------------
  //                          RENDER
  // -------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-black">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Utilidad para obtener el color de estado
  const getStatusColor = (status?: string) => {
    const normalized = status ?? "trial";
    switch (normalized) {
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
      default: return "Otro";
    }
  };

  const handleViewBusiness = (businessId: string) => {
    navigate(`/business/${businessId}/dashboard`);
  };

  // Filtra los negocios según el término de búsqueda
  const filteredBusinesses = businesses.filter(business => {
    const name = (business.businessName || business.name || "").toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      business.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Encabezado principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">Gestiona los negocios registrados y monitorea su actividad.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={logout} className="w-full sm:w-auto">
              Cerrar Sesión
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
                  <DialogDescription>Captura la información para configurar un nuevo negocio y su administrador en BookPro.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Columnas del formulario de creación */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Nombre comercial</Label>
                      <Input
                        placeholder="Clínica Zamora"
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
                          <SelectItem value="barber">Barbería</SelectItem>
                          <SelectItem value="nutritionist">Nutriólogo</SelectItem>
                          <SelectItem value="spa">Spa</SelectItem>
                          <SelectItem value="gym">Gym</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Teléfono</Label>
                      <PhoneInput
                        country="mx"
                        enableSearch
                        countryCodeEditable={false}
                        value={formData.phone}
                        onChange={(value) => handleFieldChange("phone", value)}
                        placeholder="+52 55 1234 5678"
                        containerClass="w-full"
                        inputClass="!w-full !h-10 !text-base !bg-background !border !border-input !rounded-md !pl-14 !text-foreground focus:!ring-2 focus:!ring-ring focus:!ring-offset-2"
                        buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                        dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md"
                        inputStyle={{ paddingLeft: "3.5rem" }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Dirección</Label>
                      <Textarea
                        placeholder="Calle, número, ciudad"
                        value={formData.address}
                        onChange={(e) => handleFieldChange("address", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Nombre del administrador</Label>
                      <Input
                        placeholder="Nombre del administrador"
                        value={formData.ownerName}
                        onChange={(e) => handleFieldChange("ownerName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email del administrador</Label>
                      <Input
                        type="email"
                        placeholder="admin@negocio.com"
                        value={formData.ownerEmail}
                        onChange={(e) => handleFieldChange("ownerEmail", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Contraseña del administrador</Label>
                      <Input
                        type="password"
                        placeholder="Ingresa una contraseña"
                        value={formData.ownerPassword}
                        onChange={(e) => handleFieldChange("ownerPassword", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Descripción breve</Label>
                      <Textarea
                        placeholder="¿Qué ofreces y a quién atiendes?"
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

        <Tabs defaultValue="businesses" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="requests">Solicitudes</TabsTrigger>
            <TabsTrigger value="businesses">Negocios</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <LeadsPanel />
          </TabsContent>

          <TabsContent value="businesses" className="space-y-6">
            {/* Estadísticas */}
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

            {/* Tabla de negocios */}
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
                        <TableHead className="hidden md:table-cell">Dueño</TableHead>
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
                          <TableRow key={business._id || business.businessName}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="font-semibold">{business.businessName || business.name}</span>
                                <span className="text-xs text-muted-foreground">{business.email || "N/A"}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="px-0 h-auto text-primary"
                                    onClick={() => window.open(`/business/${business._id}/booking`, "_blank")}
                                  >
                                    Ver página de reservas
                                  </Button>
                                </div>
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
                                  <DropdownMenuItem onClick={() => handleViewBusiness(business._id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver dashboard
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => window.open(`/business/${business._id}/booking`, "_blank")}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Ver página de reservas
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditModal(business)}>
                                    Editar negocio
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => toast.info("Funcionalidad próximamente")}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Éxito / Bienvenida */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl">¡Negocio Creado Exitosamente!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Se ha enviado un correo de bienvenida al administrador.
              <br />
              Aquí tienes las credenciales de acceso:
            </DialogDescription>
          </DialogHeader>

          {successCredentials && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-4 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Portal de Acceso</span>
                  <div className="flex items-center justify-between gap-2 p-2 bg-background rounded border">
                    <code className="text-sm truncate">{successCredentials.loginUrl}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(successCredentials.loginUrl);
                        toast.success("URL copiada");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Email</span>
                  <div className="flex items-center justify-between gap-2 p-2 bg-background rounded border">
                    <code className="text-sm font-semibold">{successCredentials.email}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(successCredentials.email);
                        toast.success("Email copiado");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {successCredentials.password && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Contraseña Temporal</span>
                    <div className="flex items-center justify-between gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30 rounded border">
                      <code className="text-sm font-bold text-yellow-700 dark:text-yellow-500">
                        {successCredentials.password}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(successCredentials.password || "");
                          toast.success("Contraseña copiada");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Esta contraseña es temporal. Se recomienda cambiarla al ingresar.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    const text = `¡Bienvenido a BookPro!
                    
Accede a tu panel de administración aquí:
${successCredentials.loginUrl}

Tus credenciales:
Usuario: ${successCredentials.email}
Contraseña: ${successCredentials.password || "(Tu contraseña actual)"}
`;
                    navigator.clipboard.writeText(text);
                    toast.success("Mensaje de invitación copiado");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar mensaje de invitación
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button variant="secondary" onClick={() => setShowSuccessDialog(false)} className="w-full sm:w-auto min-w-[100px]">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) {
            setSelectedBusiness(null);
            setEditOwnerPassword("");
          }
        }}
      >
        <DialogContent className="w-full max-w-3xl sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar negocio</DialogTitle>
            <DialogDescription>
              Modifica la información del negocio y su administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Panel izquierdo - negocio */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre comercial</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(val) =>
                    setEditFormData((prev) => ({ ...prev, type: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dentist">Dentista</SelectItem>
                    <SelectItem value="barber">Barbería</SelectItem>
                    <SelectItem value="nutritionist">Nutriólogo</SelectItem>
                    <SelectItem value="spa">Spa</SelectItem>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select
                  value={editFormData.subscriptionStatus}
                  onValueChange={(val) =>
                    setEditFormData((prev) => ({ ...prev, subscriptionStatus: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="trial">Prueba</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <PhoneInput
                  country="mx"
                  enableSearch
                  countryCodeEditable={false}
                  value={editFormData.phone}
                  onChange={(value) =>
                    setEditFormData((prev) => ({ ...prev, phone: value }))
                  }
                  containerClass="w-full"
                  inputClass="!w-full !h-10 !text-base !bg-background !border !border-input !rounded-md !pl-14 !text-foreground"
                  buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                  dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md"
                  inputStyle={{ paddingLeft: '3.5rem' }}
                />
              </div>
              <div className="space-y-1">
                <Label>Dirección</Label>
                <Textarea
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>
            </div>
            {/* Panel derecho - administrador y otros datos */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre del administrador</Label>
                <Input
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Email del administrador</Label>
                <Input
                  value={editOwnerEmail}
                  onChange={(e) => setEditOwnerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Nueva contraseña (opcional)</Label>
                <Input
                  type="password"
                  value={editOwnerPassword}
                  onChange={(e) => setEditOwnerPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Descripción breve</Label>
                <Textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Sitio web</Label>
                <Input
                  value={editFormData.website}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, website: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateBusiness}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
