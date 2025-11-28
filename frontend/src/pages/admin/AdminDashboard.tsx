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
      } catch {}

      let bookingsCount = 0;
      try {
        const bookingPromises = businessesData.map(b =>
          getBookingsByBusiness(b._id).catch(() => [])
        );
        const allBookings = await Promise.all(bookingPromises);
        bookingsCount = allBookings.reduce((acc, curr) => acc + curr.length, 0);
      } catch {}

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

        toast.success(
            `Negocio creado exitosamente 🎉

            Administrador: ${response.credentials.email}
            Contraseña: ${response.credentials.password ?? "ya existente"}`,
            { duration: 6000 }
        );

        setBusinesses(prev => [response.business, ...prev]);

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
    });

    // Cargar datos del usuario administrador
    if (business.ownerUserId) {
      try {
        const u = await getUserById(business.ownerUserId);
        setEditOwnerEmail(u.email);
        setEditOwnerName(u.name);
      } catch {}
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-200"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Utilidad para obtener el color de estado
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
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Encabezado principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">Gestiona los negocios registrados y monitorea su actividad.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                        inputClass="!w-full !h-10 !text-base !bg-background !border !border-input !rounded-md !pl-12 focus:!ring-2 focus:!ring-ring focus:!ring-offset-2"
                        buttonClass="!h-10 !bg-background !border !border-input !rounded-l-md !px-3"
                        dropdownClass="!bg-popover !text-foreground !shadow-lg !border !rounded-md"
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
      </div>

      {/* Modal de edición */}
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
                  inputClass="!w-full !h-10 !text-base !bg-background !border !border-input !rounded-md !pl-12"
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
