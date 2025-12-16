import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { activateAccount } from '@/api/authApi';
import { useAuthContext } from '@/auth/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ActivateAccount() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { setSession } = useAuthContext(); // Changed from login to setSession
    const { t } = useTranslation();
    const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid' | 'success'>('valid');
    const [loading, setLoading] = useState(false);

    const activateSchema = useMemo(() => z.object({
        password: z.string().min(6, t('activate.errors.password_min')),
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: t('activate.errors.password_match'),
        path: ["confirmPassword"],
    }), [t]);

    const form = useForm<z.infer<typeof activateSchema>>({
        resolver: zodResolver(activateSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof activateSchema>) => {
        if (!token) return;

        try {
            setLoading(true);
            const response = await activateAccount(token, values.password);

            setStatus('success');
            toast.success(t('activate.success_title'));

            // Auto login
            setTimeout(() => {
                setSession(response.accessToken, response.refreshToken, response.user); // Using setSession
                navigate('/onboarding');
            }, 2000);

        } catch (error: any) {
            console.error('Activation error:', error);
            toast.error(error.response?.data?.message || t('activate.errors.generic'));
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <CardTitle>{t('activate.success_title')}</CardTitle>
                        <CardDescription>
                            {t('activate.success_subtitle')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">{t('activate.title')}</CardTitle>
                    <CardDescription className="text-center">
                        {t('activate.subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('activate.password_label')}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('activate.confirm_password_label')}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('activate.submitting')}
                                    </>
                                ) : (
                                    t('activate.submit_button')
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
