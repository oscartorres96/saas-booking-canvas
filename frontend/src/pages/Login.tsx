import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useAuth from "@/auth/useAuth";

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const defaultTab = location.pathname === "/register" ? "register" : "login";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const loggedUser = await login(values.email, values.password);
      toast.success("Bienvenido");
      if (loggedUser?.role === "owner") {
        navigate("/admin");
      } else if (loggedUser?.role === "business" && loggedUser.businessId) {
        navigate(`/business/${loggedUser.businessId}/dashboard`);
      } else if (loggedUser?.role === "client" && loggedUser.businessId) {
        navigate(`/business/${loggedUser.businessId}/booking`);
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Credenciales inválidas.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-900/40"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-primary-light">
            <Building2 className="h-8 w-8" />
            <span>BookingCanvas</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight mb-6">Gestiona tu negocio con elegancia y eficiencia</h1>
          <p className="text-lg text-slate-300 mb-8">
            La plataforma todo en uno para nutriólogos, barberías, dentistas y más. Simplifica tus citas y haz crecer tu
            clientela.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-slate-200">Gestión de citas automatizada</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-slate-200">Recordatorios por WhatsApp y Email</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-slate-200">Página de reservas personalizada</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-400">
          © 2024 BookingCanvas Inc. Todos los derechos reservados.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Bienvenido</h2>
            <p className="text-muted-foreground mt-2">Ingresa a tu panel de control para gestionar tu negocio.</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrar Negocio</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-none shadow-none lg:shadow-sm lg:border">
                <CardHeader className="px-0 lg:px-6">
                  <CardTitle>Acceso</CardTitle>
                  <CardDescription>Ingresa tus credenciales para acceder.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 lg:px-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="nombre@empresa.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          "Ingresando..."
                        ) : (
                          <span className="flex items-center gap-2">
                            Ingresar <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-none shadow-none lg:shadow-sm lg:border">
                <CardHeader className="px-0 lg:px-6">
                  <CardTitle>Nuevo Negocio</CardTitle>
                  <CardDescription>Comienza tu prueba gratuita de 14 días.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 lg:px-6 space-y-4">
                  <div className="grid gap-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => toast.info("Funcionalidad de registro próximamente")}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Soy un Negocio (Nutriólogo, Dentista...)
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">O contáctanos</span>
                      </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Para registros empresariales, por favor contacta a ventas@bookingcanvas.com
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;
