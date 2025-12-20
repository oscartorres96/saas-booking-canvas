import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
    BookOpen,
    Rocket,
    Settings,
    Package,
    Calendar,
    Globe,
    CreditCard,
    ShieldCheck,
    Users,
    Zap,
    HelpCircle,
    Mail,
    MessageSquare,
    ArrowLeft,
    ChevronRight,
    Menu,
    ChevronUp,
    CheckCircle2,
    Info,
    Store,
    QrCode
} from 'lucide-react';

const UserManual = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState('introduccion');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const menuItems = [
        { id: 'introduccion', label: t('manual.intro.title'), icon: BookOpen },
        { id: 'primeros-pasos', label: t('manual.sections.getting_started.title'), icon: Rocket },
        { id: 'configuracion', label: t('manual.sections.config.title'), icon: Settings },
        { id: 'servicios', label: t('manual.sections.services.title'), icon: Package },
        { id: 'reservas', label: t('manual.sections.bookings.title'), icon: Calendar },
        { id: 'pagina-publica', label: t('manual.sections.public_page.title'), icon: Store },
        { id: 'estrategia-qr', label: t('manual.sections.qr_marketing.title'), icon: QrCode },
        { id: 'pagos', label: t('manual.sections.payments.title'), icon: CreditCard },
        { id: 'cumplimiento', label: t('manual.sections.compliance.title'), icon: ShieldCheck },
        { id: 'clientes', label: t('manual.sections.clients.title'), icon: Users },
        { id: 'practicas', label: t('manual.sections.best_practices.title'), icon: Zap },
        { id: 'faq', label: t('manual.faq.title'), icon: HelpCircle },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-foreground transition-colors duration-300">
            {/* Elegant Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-white/70 dark:bg-black/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full group">
                            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                            {t('manual.header.back')}
                        </Button>
                        <div className="h-4 w-px bg-border hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black italic tracking-tighter uppercase">Book<span className="text-primary">Pro</span></span>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-widest px-2 py-0 h-5">
                                {t('manual.header.version')}
                            </Badge>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">
                    {/* Navigation Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-28 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4 mb-2">
                                Navegación
                            </h3>
                            <nav className="space-y-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeSection === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => scrollToSection(item.id)}
                                            className={`
                                                w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200
                                                ${isActive
                                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }
                                            `}
                                        >
                                            <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="space-y-24 pb-24">
                        {/* Section: Introduction */}
                        <section id="introduccion" className="scroll-mt-32">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest">
                                        Manual Oficial
                                    </Badge>
                                    <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">
                                        {t('manual.intro.title')}
                                    </h1>
                                    <p className="text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
                                        {t('manual.intro.subtitle')}
                                    </p>
                                </div>

                                <Card className="overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
                                    <CardContent className="p-12 space-y-8">
                                        <p className="text-lg leading-relaxed text-muted-foreground">
                                            {t('manual.intro.description')}
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 space-y-4">
                                                <h3 className="text-lg font-black uppercase italic tracking-tighter">
                                                    {t('manual.intro.ideal_for')}
                                                </h3>
                                                <ul className="space-y-3">
                                                    {['Estudios de Bienestar', 'Clínicas de Salud', 'Centros de Enseñanza', 'Consultorías'].map((type) => (
                                                        <li key={type} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                            {type}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-8 rounded-[2rem] bg-primary/5 space-y-4 border border-primary/10">
                                                <h3 className="text-lg font-black uppercase italic tracking-tighter">
                                                    {t('manual.intro.problems_solved')}
                                                </h3>
                                                <ul className="space-y-3">
                                                    {['Caos en agendas manuales', 'Cancelaciones de último minuto', 'Falta de imagen profesional'].map((prob) => (
                                                        <li key={prob} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                                            {prob}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </section>

                        {/* Section: Getting Started */}
                        <section id="primeros-pasos" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.sections.getting_started.title')}
                                desc={t('manual.sections.getting_started.desc')}
                                icon={Rocket}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                {(t('manual.sections.getting_started.steps', { returnObjects: true }) as string[]).map((step, idx) => (
                                    <StepCard key={idx} number={idx + 1} content={step} />
                                ))}
                            </div>
                        </section>

                        {/* Section: Config */}
                        <section id="configuracion" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.sections.config.title')}
                                desc={t('manual.sections.config.desc')}
                                icon={Settings}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                {(t('manual.sections.config.items', { returnObjects: true }) as string[]).map((item, idx) => (
                                    <FeatureCard key={idx} content={item} />
                                ))}
                            </div>
                        </section>

                        {/* Section: Services */}
                        <section id="servicios" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.sections.services.title')}
                                desc={t('manual.sections.services.desc')}
                                icon={Package}
                                color="bg-blue-500"
                            />
                            <div className="mt-8 p-12 rounded-[3rem] bg-blue-500/5 border border-blue-500/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {(t('manual.sections.services.features', { returnObjects: true }) as string[]).map((feat, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <p className="font-bold text-sm leading-snug">{feat}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section: Bookings */}
                        <section id="reservas" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.sections.bookings.title')}
                                desc={t('manual.sections.bookings.desc')}
                                icon={Calendar}
                                color="bg-amber-500"
                            />
                            <div className="mt-8 space-y-6">
                                {(t('manual.sections.bookings.types', { returnObjects: true }) as string[]).map((type, idx) => (
                                    <div key={idx} className="flex items-center gap-6 p-6 rounded-[2rem] bg-white dark:bg-slate-900 border hover:border-amber-500/30 transition-all group">
                                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-black text-xl group-hover:scale-110 transition-transform">
                                            {idx + 1}
                                        </div>
                                        <p className="font-bold">{type}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section: Public Page */}
                        <section id="pagina-publica" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.sections.public_page.title')}
                                desc={t('manual.sections.public_page.desc')}
                                icon={Store}
                                color="bg-emerald-500"
                            />
                            <div className="mt-8 p-1 rounded-[3.5rem] bg-gradient-to-br from-emerald-500/20 to-transparent">
                                <div className="p-12 rounded-[3rem] bg-white dark:bg-slate-950 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                                        {/* Connector lines for desktop */}
                                        <div className="hidden md:block absolute top-6 left-[20%] right-[20%] h-px bg-slate-100 dark:bg-slate-800" />

                                        {(t('manual.sections.public_page.steps', { returnObjects: true }) as string[]).map((step, idx) => (
                                            <div key={idx} className="relative space-y-6 text-center">
                                                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black relative z-10 shadow-lg shadow-emerald-500/20">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-sm font-bold text-muted-foreground px-4 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: QR Marketing */}
                        <section id="estrategia-qr" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.sections.qr_marketing.title')}
                                desc={t('manual.sections.qr_marketing.desc')}
                                icon={QrCode}
                                color="bg-rose-500"
                            />
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    {(t('manual.sections.qr_marketing.features', { returnObjects: true }) as string[]).map((feat, idx) => {
                                        const [title, description] = feat.split(':');
                                        return (
                                            <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors">
                                                <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-xs uppercase tracking-tighter text-rose-600">{title}</p>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-rose-500/20 to-orange-500/20 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all opacity-50" />
                                    <Card className="relative overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem] h-full flex flex-col justify-center items-center p-12 text-center space-y-8">
                                        <div className="h-24 w-24 rounded-3xl bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/20 rotate-3 group-hover:rotate-6 transition-transform">
                                            <QrCode className="h-12 w-12" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-tight">
                                                Impulsa tu Presencia Física
                                            </h3>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                Cada código QR que generas es una puerta abierta. Úsalos con estrategia y observa cómo crece tu base de clientes.
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </section>

                        {/* Section: Payments */}
                        <section id="pagos" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.sections.payments.title')}
                                desc={t('manual.sections.payments.desc')}
                                icon={CreditCard}
                                color="bg-indigo-600"
                            />
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(t('manual.sections.payments.items', { returnObjects: true }) as string[]).map((item, idx) => (
                                    <div key={idx} className="p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-600/10 space-y-4 group hover:bg-indigo-600 leading-tight transition-all duration-300">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white">
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                        <p className="font-bold text-lg group-hover:text-white transition-colors">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section: Compliance */}
                        <section id="cumplimiento" className="scroll-mt-32">
                            <div className="p-12 rounded-[3.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                                <div className="relative z-10 space-y-12">
                                    <div className="space-y-4">
                                        <div className="h-16 w-16 rounded-[2rem] bg-white/10 flex items-center justify-center">
                                            <ShieldCheck className="h-8 w-8 text-primary" />
                                        </div>
                                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">{t('manual.sections.compliance.title')}</h2>
                                        <p className="text-slate-400 font-medium max-w-xl">{t('manual.sections.compliance.desc')}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {(t('manual.sections.compliance.features', { returnObjects: true }) as string[]).map((feat, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <div className="h-1 w-8 bg-primary rounded-full" />
                                                <p className="font-bold leading-snug">{feat}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Clients */}
                        <section id="clientes" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.sections.clients.title')}
                                desc={t('manual.sections.clients.desc')}
                                icon={Users}
                                color="bg-purple-500"
                            />
                            <div className="mt-8 space-y-6">
                                {(t('manual.sections.clients.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                    <div key={idx} className="p-8 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 transition-all group">
                                        <div className="flex items-start gap-6">
                                            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-110 transition-transform">
                                                <CheckCircle2 className="h-6 w-6" />
                                            </div>
                                            <p className="font-bold text-sm leading-relaxed pt-2">{feature}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section: Best Practices */}
                        <section id="practicas" className="scroll-mt-32">
                            <div className="relative p-12 rounded-[3.5rem] bg-gradient-to-br from-primary to-orange-500 text-white shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                    <div className="space-y-6">
                                        <div className="h-16 w-16 rounded-[2rem] bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                                            <Zap className="h-8 w-8 fill-white" />
                                        </div>
                                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">{t('manual.sections.best_practices.title')}</h2>
                                        <p className="text-white/80 font-medium">{t('manual.sections.best_practices.desc')}</p>
                                    </div>
                                    <div className="space-y-4">
                                        {(t('manual.sections.best_practices.tips', { returnObjects: true }) as string[]).map((tip, idx) => (
                                            <div key={idx} className="p-6 rounded-[2rem] bg-white/10 border border-white/20 backdrop-blur-md flex items-center gap-4">
                                                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-black shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <p className="font-bold text-sm">{tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* FAQ */}
                        <section id="faq" className="scroll-mt-32">
                            <SectionHeader
                                title={t('manual.faq.title')}
                                desc="Resolución de dudas comunes y problemas técnicos."
                                icon={HelpCircle}
                                color="bg-slate-400"
                            />
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FAQCard q={t('manual.faq.items.q1')} a={t('manual.faq.items.a1')} />
                                <FAQCard q={t('manual.faq.items.q2')} a={t('manual.faq.items.a2')} />
                            </div>
                        </section>

                        {/* Support */}
                        <section id="soporte">
                            <Card className="rounded-[3rem] border-none shadow-xl bg-slate-50 dark:bg-slate-900 p-12 text-center space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">{t('manual.support.title')}</h2>
                                    <p className="text-muted-foreground font-medium max-w-lg mx-auto">
                                        ¿Dudas adicionales? Nuestro equipo de expertos está a un clic de distancia.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <div className="flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        <span className="font-bold text-sm">{t('manual.support.chat')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                                        <Mail className="h-5 w-5 text-primary" />
                                        <span className="font-bold text-sm tracking-tight">{t('manual.support.email')}</span>
                                    </div>
                                </div>
                            </Card>
                        </section>

                        <div className="text-center pt-12 text-muted-foreground/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            BookPro Official User Guide &bull; {new Date().getFullYear()}
                        </div>
                    </main>
                </div>
            </div>

            {/* Back to top button */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={scrollToTop}
                        className="fixed bottom-12 right-12 h-14 w-14 rounded-[1.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center z-[100] active:scale-90 transition-transform"
                        aria-label="Back to top"
                    >
                        <ChevronUp className="h-6 w-6 stroke-[3px]" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Mobile Sheet Nav */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side="left" className="w-[300px] border-r-none rounded-r-[3rem] p-0">
                    <SheetHeader className="p-8 border-b">
                        <SheetTitle className="text-2xl font-black italic tracking-tighter uppercase">Menú</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-8rem)] p-4">
                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        scrollToSection(item.id);
                                        setIsMobileOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-4 px-4 py-4 text-sm font-bold rounded-2xl transition-all
                                        ${activeSection === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-muted'}
                                    `}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    );
};

// UI Components
const SectionHeader = ({ title, desc, icon: Icon, color = "bg-primary" }: { title: string, desc: string, icon: any, color?: string }) => (
    <div className="space-y-4">
        <div className={`h-14 w-14 rounded-[1.5rem] ${color} flex items-center justify-center text-white shadow-xl`}>
            <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-1">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">{title}</h2>
            <p className="text-muted-foreground font-medium max-w-xl">{desc}</p>
        </div>
    </div>
);

const StepCard = ({ number, content }: { number: number, content: string }) => (
    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-sm mb-6">
            0{number}
        </div>
        <p className="font-bold text-sm leading-relaxed">{content}</p>
    </div>
);

const FeatureCard = ({ content }: { content: string }) => (
    <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-primary/20 transition-all group">
        <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-all">
                <ChevronRight className="h-4 w-4 text-primary group-hover:text-white" />
            </div>
            <p className="font-bold text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors italic uppercase tracking-tighter">{content}</p>
        </div>
    </div>
);

const FAQCard = ({ q, a }: { q: string, a: string }) => (
    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border space-y-4 shadow-sm hover:shadow-lg transition-all">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <HelpCircle className="h-4 w-4" />
            </div>
            <h4 className="font-black italic uppercase tracking-tighter text-sm">{q}</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed font-medium pl-11">{a}</p>
    </div>
);

export default UserManual;
