import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Activity, Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";

const businesses = [
    {
        name: "Dental Clinic Zamora",
        description: "Odontología y estética dental.",
        icon: <Calendar className="h-5 w-5 text-cyan-600" />,
        link: "/business/6927a3bbebb8322edcf7a5b0/booking",
        accent: "from-cyan-500/10",
    },
    {
        name: "Gym Titanes",
        description: "Clases de fitness, fuerza y cardio.",
        icon: <Activity className="h-5 w-5 text-emerald-600" />,
        link: "/business/6927a3bbebb8322edcf7a5b1/booking",
        accent: "from-emerald-500/10",
    },
    {
        name: "Barberia El Patron",
        description: "Corte, barba y grooming premium.",
        icon: <Scissors className="h-5 w-5 text-indigo-600" />,
        link: "/business/6927a3bbebb8322edcf7a5b2/booking",
        accent: "from-indigo-500/10",
    },
];

const Home = () => {
    const navigate = useNavigate();

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
                    {businesses.map((biz) => (
                        <Card
                            key={biz.name}
                            className="relative overflow-hidden border-slate-200 hover:shadow-md transition"
                        >
                            <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${biz.accent}`} />
                            <CardHeader className="relative z-10 pb-3">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    {biz.icon}
                                    <span>Reservas abiertas</span>
                                </div>
                                <CardTitle className="text-lg">{biz.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{biz.description}</p>
                            </CardHeader>
                            <CardContent className="relative z-10 flex justify-end">
                                <Button onClick={() => navigate(biz.link)}>Ir a reservas</Button>
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
