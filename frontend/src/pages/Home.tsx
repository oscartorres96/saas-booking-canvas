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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllBusinesses, type Business } from "@/api/businessesApi";
import { toast } from "sonner";

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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await getAllBusinesses();
        setBusinesses(list);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "No se pudieron cargar los negocios");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          : "Servicios disponibles.",
        link: `/business/${b._id}/booking`,
        icon: pickIcon(b.type),
        accent: pickAccent(b.type),
      }));
  }, [businesses]);

  const skeletonCards: HomeCard[] = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, idx) => ({
        id: `skeleton-${idx}`,
        name: "Cargando negocio...",
        description: "Preparando catálogo de reservas.",
        link: "",
        icon: <Calendar className="h-5 w-5 text-slate-500" />,
        accent: "from-slate-500/10",
        isSkeleton: true,
      })),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            BookPro
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Reserva rápido en tu negocio favorito
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Elige un negocio para ver servicios disponibles y agendar en segundos. Si ya reservaste, revisa tus citas con tu código de acceso.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(loading ? skeletonCards : cards).map((biz) => (
            <Card
              key={biz.id}
              className="relative overflow-hidden border-slate-200 hover:shadow-md transition"
            >
              <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${biz.accent}`} />
              <CardHeader className="relative z-10 pb-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  {biz.icon}
                  <span>{biz.isSkeleton ? "Cargando..." : "Reservas abiertas"}</span>
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
                  Ir a reservas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">¿Ya reservaste?</CardTitle>
            <p className="text-sm text-muted-foreground">Consulta tus citas con tu correo y código de acceso.</p>
          </CardHeader>
          <CardContent className="flex justify-between items-center flex-col sm:flex-row gap-3">
            <div className="text-sm text-slate-600 text-center sm:text-left">
              Ve a <span className="font-semibold">Mis reservas</span> para ver, confirmar o cancelar.
            </div>
            <Button variant="outline" onClick={() => navigate("/my-bookings")}>
              Ver mis reservas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
