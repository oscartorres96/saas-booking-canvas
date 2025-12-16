import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Activity,
  Scissors,
  Stethoscope,
  Dumbbell,
  Sparkles,
  LogIn,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getAllBusinesses, type Business } from "@/api/businessesApi";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PricingSection } from "@/components/PricingSection";

type HomeCard = {
  id: string;
  name: string;
  description: string;
  link: string;
  icon: JSX.Element;
  accent: string;
  isSkeleton?: boolean;
};

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await getAllBusinesses();
        setBusinesses(list);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
        toast.error(errorMessage || t('home.errors.load_businesses'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const cards: HomeCard[] = useMemo(() => {
    const pickIcon = (type?: string) => {
      switch (type) {
        case "dentist":
          return <Stethoscope className="h-5 w-5 text-cyan-600" />;
        case "barber":
          return <Scissors className="h-5 w-5 text-indigo-600" />;
        case "gym":
          return <Dumbbell className="h-5 w-5 text-emerald-600" />;
        case "nutritionist":
          return <Activity className="h-5 w-5 text-amber-600" />;
        default:
          return <Sparkles className="h-5 w-5 text-slate-600" />;
      }
    };
    const pickAccent = (type?: string) => {
      switch (type) {
        case "dentist":
          return "from-cyan-500/10";
        case "barber":
          return "from-indigo-500/10";
        case "gym":
          return "from-emerald-500/10";
        case "nutritionist":
          return "from-amber-500/10";
        default:
          return "from-slate-500/10";
      }
    };
    return (businesses || [])
      .filter((b) => (b.subscriptionStatus ?? "trial") !== "inactive")
      .map<HomeCard>((b) => ({
        id: b._id,
        name: b.businessName || b.name,
        description: typeof (b.metadata as Record<string, unknown> | undefined)?.description === "string"
          ? String((b.metadata as Record<string, unknown>).description)
          : t('home.cards.default_description'),
        link: `/business/${b._id}/booking`,
        icon: pickIcon(b.type),
        accent: pickAccent(b.type),
      }));
  }, [businesses, t]);

  const skeletonCards: HomeCard[] = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, idx) => ({
        id: `skeleton-${idx}`,
        name: t('home.cards.skeleton_name'),
        description: t('home.cards.skeleton_description'),
        link: "",
        icon: <Calendar className="h-5 w-5 text-slate-500" />,
        accent: "from-slate-500/10",
        isSkeleton: true,
      })),
    [t],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10 relative">
        {/* Header with controls */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/login")}
            className="gap-2"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">{t('home.header.login')}</span>
          </Button>
        </div>

        {/* Hero section */}
        <div className="text-center space-y-2">
          <img
            src="/brand-full.png"
            alt="BookPro Logo"
            className="h-12 mx-auto"
          />
          <h1 className="text-3xl sm:text-4xl font-bold">
            {t('home.hero.title')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('home.hero.subtitle')}
          </p>
        </div>

        {/* Business cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(loading ? skeletonCards : cards).map((biz) => (
            <Card
              key={biz.id}
              className="relative overflow-hidden border border-border bg-card text-card-foreground hover:shadow-md transition"
            >
              <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${biz.accent}`} />
              <CardHeader className="relative z-10 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {biz.icon}
                  <span>{biz.isSkeleton ? t('home.cards.loading') : t('home.cards.open')}</span>
                </div>
                <CardTitle className="text-lg">
                  {biz.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {biz.description}
                </p>
              </CardHeader>
              <CardContent className="relative z-10 flex justify-end">
                <Button
                  disabled={biz.isSkeleton || !biz.link}
                  onClick={() => biz.link && navigate(biz.link)}
                >
                  {t('home.cards.button')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* My bookings card */}
        <Card className="border-dashed border-border bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-lg">{t('home.my_bookings.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('home.my_bookings.description')}</p>
          </CardHeader>
          <CardContent className="flex justify-between items-center flex-col sm:flex-row gap-3">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              {t('home.my_bookings.info')} <span className="font-semibold">{t('home.my_bookings.link_text')}</span> {t('home.my_bookings.info_suffix')}
            </div>
            <Button variant="outline" onClick={() => navigate("/my-bookings")}>
              {t('home.my_bookings.button')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  );
};

export default Home;
