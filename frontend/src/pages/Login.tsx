import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { User, Lock, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useAuth from "@/auth/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [trialExpiredModalOpen, setTrialExpiredModalOpen] = useState(false);
  const [expiredEndsAt, setExpiredEndsAt] = useState<Date | undefined>();
  const [isTrialExpiration, setIsTrialExpiration] = useState(true);
  // const defaultTab = location.pathname === "/demo" ? "demo" : "login"; // Removed
  const { t, i18n } = useTranslation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true);
      const loggedUser = await login(values.email, values.password);

      // Check if trial expired
      if (loggedUser?.trialExpired) {
        setExpiredEndsAt(loggedUser.trialEndsAt);
        setIsTrialExpiration(true);
        setTrialExpiredModalOpen(true);
        return;
      }

      // Check if subscription expired
      if (loggedUser?.subscriptionExpired) {
        setExpiredEndsAt(loggedUser.subscriptionEndsAt);
        setIsTrialExpiration(false);
        setTrialExpiredModalOpen(true);
        return;
      }

      toast.success(t('login.form.welcome_toast'));

      const ALLOWED_ADMINS = ['oscartorres0396@gmail.com', 'owner@bookpro.com'];
      const isPlatformAdmin = loggedUser?.role === "owner" && ALLOWED_ADMINS.includes(loggedUser.email || '');

      if (isPlatformAdmin) {
        navigate("/admin");
      } else if ((loggedUser?.role === "owner" || loggedUser?.role === "business") && loggedUser?.businessId) {
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

  // Removed demo form and handler

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 -z-10" />

      {/* Animated Decorative Blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      {/* Theme and Language Toggles - Fixed position */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Login Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md sm:max-w-lg mx-4 sm:mx-6 relative z-10"
      >
        {/* Logo and Branding */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-block"
          >
            <img
              src="/brand-full.png"
              alt="BookPro Logo"
              className="h-12 sm:h-14 w-auto mx-auto bg-white dark:bg-white dark:ring-2 dark:ring-white/20 p-2 sm:p-3 rounded-xl shadow-lg"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold mt-4 sm:mt-6 mb-2"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {t('login.welcome')}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-sm sm:text-base"
          >
            {t('login.subtitle')}
          </motion.p>
        </div>

        {/* Main Card with Glassmorphism */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 shadow-2xl">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold mb-1">{t('login.form.title')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('login.form.description')}</p>
              </div>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 sm:space-y-5">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t('login.form.email_label')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={t('login.form.email_placeholder')}
                              className="pl-10 bg-white/50 dark:bg-gray-800/50 border-white/20 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t('login.form.password_label')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder={t('login.form.password_placeholder')}
                              className="pl-10 bg-white/50 dark:bg-gray-800/50 border-white/20 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                    size="lg"
                  >
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

              <div className="text-center mt-4">
                <Button variant="link" onClick={() => navigate('/')} className="text-sm text-muted-foreground">
                  ← {t('common.back_to_home')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground"
        >
          © {new Date().getFullYear()} BookPro. {t('login.copyright')}
        </motion.div>
      </motion.div>

      {/* Trial Expired Modal */}
      <TrialExpiredModal
        open={trialExpiredModalOpen}
        onOpenChange={setTrialExpiredModalOpen}
        endsAt={expiredEndsAt}
        isTrial={isTrialExpiration}
      />
    </div>
  );
};

export default Login;
