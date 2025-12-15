import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BookOpen,
    Rocket,
    LayoutDashboard,
    Package,
    Calendar,
    Settings,
    Share2,
    Users,
    HelpCircle,
    CheckCircle2,
    ArrowLeft,
    ChevronUp,
    AlertCircle,
    Info,
    Lightbulb,
    ExternalLink,
    Menu,
    QrCode,
    MessageCircle
} from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import useAuth from '@/auth/useAuth';

const UserManual = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Get businessId from authenticated user
    const businessId = user?.businessId || '';

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);

            const sections = document.querySelectorAll('section[id]');
            const scrollPosition = window.scrollY + 100;

            sections.forEach((section) => {
                const sectionTop = (section as HTMLElement).offsetTop;
                const sectionHeight = (section as HTMLElement).offsetHeight;
                const sectionId = section.getAttribute('id') || '';

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    setActiveSection(sectionId);
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleMobileNav = (id: string) => {
        scrollToSection(id);
        setIsMobileOpen(false);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const tableOfContents = [
        { id: 'introduccion', label: t('manual.toc.introduction'), icon: BookOpen },
        { id: 'primeros-pasos', label: t('manual.toc.getting_started'), icon: Rocket },
        { id: 'panel-control', label: t('manual.toc.dashboard'), icon: LayoutDashboard },
        { id: 'servicios', label: t('manual.toc.services'), icon: Package },
        { id: 'reservas', label: t('manual.toc.bookings'), icon: Calendar },
        { id: 'configuracion', label: t('manual.toc.settings'), icon: Settings },
        { id: 'compartir', label: t('manual.toc.sharing'), icon: Share2 },
        { id: 'qr', label: t('manual.toc.qr'), icon: QrCode },
        { id: 'whatsapp', label: t('manual.toc.whatsapp'), icon: MessageCircle },
        { id: 'clientes', label: t('manual.toc.clients'), icon: Users },
        { id: 'faq', label: t('manual.toc.faq'), icon: HelpCircle },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[80%] sm:w-[300px] p-0">
                                <SheetHeader className="p-4 border-b">
                                    <SheetTitle className="text-left">{t('manual.toc.title')}</SheetTitle>
                                </SheetHeader>
                                <ScrollArea className="h-[calc(100vh-5rem)]">
                                    <nav className="space-y-1 p-2">
                                        {tableOfContents.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleMobileNav(item.id)}
                                                    className={`w-full flex items-center gap-2 px-3 py-3 text-sm rounded-md transition-colors ${activeSection === item.id
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                                    <span className="truncate text-left">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </ScrollArea>
                            </SheetContent>
                        </Sheet>

                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="shrink-0">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">{t('manual.header.back')}</span>
                        </Button>
                        <div className="h-6 w-px bg-border shrink-0" />
                        <div className="flex items-center gap-2 overflow-hidden">
                            <BookOpen className="h-5 w-5 text-primary shrink-0" />
                            <h1 className="text-lg sm:text-xl font-bold truncate">{t('manual.header.title')}</h1>
                        </div>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex shrink-0 ml-2">{t('manual.header.version')}</Badge>
                </div>
            </div>

            <div className="container py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                    {/* Sidebar - Table of Contents */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">{t('manual.toc.title')}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <nav className="space-y-1 p-2">
                                        {tableOfContents.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => scrollToSection(item.id)}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeSection === item.id
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                                    <span className="truncate text-left">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="space-y-12">
                        {/* Mobile Table of Contents */}
                        <div className="lg:hidden">
                            <Accordion type="single" collapsible className="w-full bg-card rounded-lg border shadow-sm px-4">
                                <AccordionItem value="toc" className="border-b-0">
                                    <AccordionTrigger className="hover:no-underline py-4">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            <span className="font-semibold">{t('manual.toc.title')}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <nav className="flex flex-col space-y-1 pb-4">
                                            {tableOfContents.map((item) => {
                                                const Icon = item.icon;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => scrollToSection(item.id)}
                                                        className={`w-full flex items-center gap-2 px-3 py-3 text-sm rounded-md transition-colors ${activeSection === item.id
                                                            ? 'bg-primary/10 text-primary font-medium'
                                                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                                            }`}
                                                    >
                                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                                        <span className="truncate text-left">{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </nav>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                        {/* Introduction */}
                        <section id="introduccion">
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight mb-2">{t('manual.introduction.title')}</h2>
                                    <p className="text-muted-foreground">{t('manual.introduction.subtitle')}</p>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('manual.introduction.welcome_title')}</CardTitle>
                                        <CardDescription>{t('manual.introduction.welcome_desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-3">{t('manual.introduction.what_can_do')}</h4>
                                            <div className="grid gap-2">
                                                {Object.keys(t('manual.introduction.features', { returnObjects: true }) as Record<string, string>).map((key) => (
                                                    <div key={key} className="flex items-start gap-2">
                                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span className="text-sm">{t(`manual.introduction.features.${key}`)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Getting Started - Simplified for brevity */}
                        <section id="primeros-pasos">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.getting_started.title')}</h2>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('manual.getting_started.access_title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <ol className="list-decimal list-inside space-y-2 text-sm">
                                            {['step1', 'step2', 'step3', 'step4'].map(step => (
                                                <li key={step}>{t(`manual.getting_started.access_steps.${step}`)}</li>
                                            ))}
                                        </ol>
                                        <Alert>
                                            <Lightbulb className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Tip:</strong> {t('manual.getting_started.tip_password')}
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Dashboard */}
                        <section id="panel-control">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.dashboard.title')}</h2>
                                <p className="text-muted-foreground">{t('manual.dashboard.subtitle')}</p>
                                <Card>
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <CardTitle>Dashboard</CardTitle>
                                            {businessId && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/business/${businessId}/dashboard`)}
                                                    className="w-full sm:w-auto"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Ir al Dashboard
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {t('manual.dashboard.subtitle')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Services */}
                        <section id="servicios">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.services.title')}</h2>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('manual.services.create_title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ol className="list-decimal list-inside space-y-2 text-sm">
                                            <li>{t('manual.services.create_steps.step1')}</li>
                                            <li>
                                                {t('manual.services.create_steps.step2')}
                                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-muted-foreground">
                                                    <li>{t('manual.services.create_steps.step2_items.name')}</li>
                                                    <li>{t('manual.services.create_steps.step2_items.description')}</li>
                                                    <li>{t('manual.services.create_steps.step2_items.price')}</li>
                                                    <li>{t('manual.services.create_steps.step2_items.duration')}</li>
                                                </ul>
                                            </li>
                                            <li>{t('manual.services.create_steps.step3')}</li>
                                        </ol>
                                    </CardContent>
                                </Card>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">{t('manual.services.edit_title')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <div>1. {t('manual.services.edit_steps.step1')}</div>
                                            <div>2. {t('manual.services.edit_steps.step2')}</div>
                                            <div>3. {t('manual.services.edit_steps.step3')}</div>
                                            <div>4. {t('manual.services.edit_steps.step4')}</div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">{t('manual.services.delete_title')}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <div>1. {t('manual.services.delete_steps.step1')}</div>
                                            <div>2. {t('manual.services.delete_steps.step2')}</div>
                                            <div>3. {t('manual.services.delete_steps.step3')}</div>
                                            <Alert className="mt-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-xs">
                                                    {t('manual.services.delete_warning')}
                                                </AlertDescription>
                                            </Alert>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </section>

                        {/* Bookings */}
                        <section id="reservas">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.bookings.title')}</h2>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('manual.bookings.states_title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Estado</TableHead>
                                                        <TableHead>Descripción</TableHead>
                                                        <TableHead>Color</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="font-medium">🟡 {t('manual.bookings.states.pending.name')}</TableCell>
                                                        <TableCell>{t('manual.bookings.states.pending.desc')}</TableCell>
                                                        <TableCell><Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t('manual.bookings.states.pending.color')}</Badge></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">🟢 {t('manual.bookings.states.confirmed.name')}</TableCell>
                                                        <TableCell>{t('manual.bookings.states.confirmed.desc')}</TableCell>
                                                        <TableCell><Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t('manual.bookings.states.confirmed.color')}</Badge></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">🔵 {t('manual.bookings.states.completed.name')}</TableCell>
                                                        <TableCell>{t('manual.bookings.states.completed.desc')}</TableCell>
                                                        <TableCell><Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t('manual.bookings.states.completed.color')}</Badge></TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">🔴 {t('manual.bookings.states.cancelled.name')}</TableCell>
                                                        <TableCell>{t('manual.bookings.states.cancelled.desc')}</TableCell>
                                                        <TableCell><Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t('manual.bookings.states.cancelled.color')}</Badge></TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('manual.bookings.view_title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm">{t('manual.bookings.view_desc')}</p>
                                        <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                                            <li>{t('manual.bookings.view_options.option1')}</li>
                                            <li>{t('manual.bookings.view_options.option2')}</li>
                                        </ul>

                                        <div className="bg-muted p-4 rounded-lg text-sm">
                                            <p className="font-semibold mb-2">{t('manual.bookings.modal_shows')}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {['client', 'service', 'datetime', 'notes', 'status'].map(item => (
                                                    <div key={item} className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                                        <span>{t(`manual.bookings.modal_items.${item}`)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">{t('manual.bookings.confirm_booking.title')}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{t('manual.bookings.confirm_booking.desc')}</p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">{t('manual.bookings.cancel_booking.title')}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-2">{t('manual.bookings.cancel_booking.info')}</p>
                                            <ol className="list-decimal list-inside text-sm space-y-1">
                                                <li>{t('manual.bookings.cancel_booking.steps.step1')}</li>
                                                <li>{t('manual.bookings.cancel_booking.steps.step4')}</li>
                                            </ol>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </section>

                        {/* Settings */}
                        <section id="configuracion">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.settings.title')}</h2>
                                <p className="text-muted-foreground">{t('manual.settings.subtitle')}</p>

                                <Card>
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <CardTitle>{t('manual.settings.title')}</CardTitle>
                                            {businessId && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/business/${businessId}/dashboard?tab=settings`)}
                                                    className="w-full sm:w-auto"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Abrir Configuración
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-6">
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                {t('manual.settings.general.title')}
                                            </h4>
                                            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground ml-4">
                                                <li>{t('manual.settings.general.basic_info')}</li>
                                                <li>{t('manual.settings.general.business_name')}</li>
                                                <li>{t('manual.settings.general.description')}</li>
                                                <li>{t('manual.settings.general.duration')}</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                {t('manual.settings.branding.title')}
                                            </h4>
                                            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground ml-4">
                                                <li>{t('manual.settings.branding.comm_language')}</li>
                                                <li>{t('manual.settings.branding.logo.title')}</li>
                                                <li>{t('manual.settings.branding.colors.title')}</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {t('manual.settings.hours.title')}
                                            </h4>
                                            <p className="text-sm text-muted-foreground ml-4">{t('manual.settings.hours.subtitle')}</p>
                                        </div>

                                        <Alert>
                                            <Info className="h-4 w-4" />
                                            <AlertDescription>
                                                {t('manual.settings.save_warning')}
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Sharing */}
                        <section id="compartir">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.sharing.title')}</h2>
                                <Card>
                                    <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <CardTitle>{t('manual.sharing.title')}</CardTitle>
                                            {businessId && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(`/business/${businessId}/booking`, '_blank')}
                                                    className="w-full sm:w-auto"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Ver Página de Reservas
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold mb-2 text-sm">{t('manual.sharing.option1.title')}</h4>
                                            <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                                                <li>{t('manual.sharing.option1.steps.step1')}</li>
                                                <li>{t('manual.sharing.option1.steps.step2')}</li>
                                                <li>{t('manual.sharing.option1.steps.step3')}</li>
                                            </ol>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2 text-sm">{t('manual.sharing.option2.title')}</h4>
                                            <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                                                <li>{t('manual.sharing.option2.steps.step1')}</li>
                                                <li>{t('manual.sharing.option2.steps.step2')}</li>
                                                <li>{t('manual.sharing.option2.steps.step3')}</li>
                                            </ol>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* QR Code */}
                        <section id="qr">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.qr.title')}</h2>
                                <p className="text-muted-foreground">{t('manual.qr.subtitle')}</p>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('manual.qr.title')}</CardTitle>
                                        <CardDescription>{t('manual.qr.desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold mb-3">{t('manual.qr.uses.access')}</h4>
                                            <div className="grid gap-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    {t('manual.qr.uses.print')}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    {t('manual.qr.uses.digital')}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-3">{t('manual.qr.how_to.title')}</h4>
                                            <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                                                <li>{t('manual.qr.how_to.steps.step1')}</li>
                                                <li>{t('manual.qr.how_to.steps.step2')}</li>
                                                <li>{t('manual.qr.how_to.steps.step3')}</li>
                                            </ol>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* WhatsApp */}
                        <section id="whatsapp">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.whatsapp.title')}</h2>
                                <p className="text-muted-foreground">{t('manual.whatsapp.subtitle')}</p>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MessageCircle className="h-5 w-5 text-green-600" />
                                            {t('manual.whatsapp.title')}
                                        </CardTitle>
                                        <CardDescription>{t('manual.whatsapp.desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold mb-3">{t('manual.whatsapp.features_title')}</h4>
                                            <div className="grid gap-2 text-sm">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                                    <span>{t('manual.whatsapp.features.confirmation')}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                                    <span>{t('manual.whatsapp.features.reminder')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-muted/50 p-4 rounded-lg">
                                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {t('manual.whatsapp.requirements_title')}
                                                </h4>
                                                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                                    <li>{t('manual.whatsapp.requirements.phone')}</li>
                                                    <li>{t('manual.whatsapp.requirements.optin')}</li>
                                                </ul>
                                            </div>

                                            <div className="bg-muted/50 p-4 rounded-lg">
                                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                    <HelpCircle className="h-4 w-4" />
                                                    {t('manual.whatsapp.troubleshooting_title')}
                                                </h4>
                                                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                                    <li>{t('manual.whatsapp.troubleshooting_steps.step1')}</li>
                                                    <li>{t('manual.whatsapp.troubleshooting_steps.step2')}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Clients */}
                        <section id="clientes">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.clients.title')}</h2>
                                <p className="text-muted-foreground">{t('manual.clients.subtitle')}</p>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('manual.clients.title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="relative border-l border-muted ml-3 space-y-8 pb-2">
                                            {['step1', 'step2', 'step3', 'step4', 'step5'].map((step, index) => (
                                                <div key={step} className="pl-6 relative">
                                                    <span className="absolute -left-[13px] top-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="font-semibold">{t(`manual.clients.steps.${step}.title`)}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {t(`manual.clients.steps.${step}.desc`)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section id="faq">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold tracking-tight">{t('manual.faq.title')}</h2>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('manual.faq.title')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 md:grid-cols-2">
                                        {['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'].map((item) => (
                                            <div key={item} className="space-y-2 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                                <h4 className="font-semibold text-sm flex items-start gap-2">
                                                    <HelpCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                                    {t(`manual.faq.items.${item}.q`)}
                                                </h4>
                                                <p className="text-sm text-muted-foreground pl-6">
                                                    {t(`manual.faq.items.${item}.a`)}
                                                </p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Checklist */}
                        <Card className="border-primary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                    {t('manual.checklist.title')}
                                </CardTitle>
                                <CardDescription>{t('manual.checklist.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8'].map((item) => (
                                        <div key={item} className="flex items-center gap-2 text-sm">
                                            <div className="h-4 w-4 rounded border-2 border-muted-foreground" />
                                            {t(`manual.checklist.items.${item}`)}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Footer */}
                        <div className="text-center text-sm text-muted-foreground py-8 border-t">
                            <p>{t('manual.footer.congrats')}</p>
                            <p className="mt-2">{t('manual.footer.updated')}</p>
                        </div>
                    </main>
                </div>
            </div>

            {/* Back to Top Button */}
            {showBackToTop && (
                <Button
                    onClick={scrollToTop}
                    size="icon"
                    className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg"
                >
                    <ChevronUp className="h-5 w-5" />
                </Button>
            )}
        </div>
    );
};

export default UserManual;
