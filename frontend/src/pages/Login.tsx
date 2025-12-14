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
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
      toast.success(t('login.form.welcome_toast'));
      if (loggedUser?.role === "owner") {
        navigate("/admin");
      } else if (loggedUser?.role === "business" && loggedUser.businessId) {
        if (loggedUser.isOnboardingCompleted === false) {
          navigate("/onboarding");
        } else {
          navigate(`/business/${loggedUser.businessId}/dashboard`);
        }
      } else if (loggedUser?.role === "client" && loggedUser.businessId) {
        navigate(`/business/${loggedUser.businessId}/booking`);
      } else {
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(message || t('login.form.error_toast'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex relative">
      {/* Theme and Language Toggles - Fixed position */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      {/* Left Side - Hero/Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-900/40"></div>

        <div className="relative z-10">
          <img
            src="/brand-full.png"
            alt="BookPro Logo"
            className="h-12 w-auto bg-white/95 p-2 rounded-lg shadow-lg"
          />
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight mb-6">{t('login.hero_title')}</h1>
          <p className="text-lg text-slate-300 mb-8">
            {t('login.hero_subtitle')}
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-slate-200">{t('login.feature_1')}</span>
            </div>
            {/* TODO: Descomentar cuando Meta apruebe los mensajes de WhatsApp 
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-slate-200">{t('login.feature_2')}</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-slate-200">{t('login.feature_3')}</span>
            </div>
            */}
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-400">
          © {new Date().getFullYear()} BookPro. {t('login.copyright')}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">{t('login.welcome')}</h2>
            <p className="text-muted-foreground mt-2">{t('login.subtitle')}</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">{t('login.tabs.login')}</TabsTrigger>
              <TabsTrigger value="register">{t('login.tabs.register')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-none shadow-none lg:shadow-sm lg:border">
                <CardHeader className="px-0 lg:px-6">
                  <CardTitle>{t('login.form.title')}</CardTitle>
                  <CardDescription>{t('login.form.description')}</CardDescription>
                </CardHeader>
                <CardContent className="px-0 lg:px-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('login.form.email_label')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder={t('login.form.email_placeholder')} className="pl-10" {...field} />
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
                            <FormLabel>{t('login.form.password_label')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input type="password" placeholder={t('login.form.password_placeholder')} className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          t('login.form.submitting')
                        ) : (
                          <span className="flex items-center gap-2">
                            {t('login.form.submit_button')} <ArrowRight className="h-4 w-4" />
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
                  <CardTitle>{t('login.register.title')}</CardTitle>
                  <CardDescription>{t('login.register.description')}</CardDescription>
                </CardHeader>
                <CardContent className="px-0 lg:px-6 space-y-4">
                  <div className="grid gap-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => toast.info(t('login.register.coming_soon'))}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      {t('login.register.business_button')}
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">{t('login.register.or_label')}</span>
                      </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {t('login.register.contact_text')}
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
