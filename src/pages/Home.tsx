import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Por ahora redirigimos automáticamente a "dentista"
        // En el futuro, esto podría ser una página de landing o selección de negocio
        navigate("/dentista");
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted"></div>
                <div className="h-4 w-48 bg-muted rounded"></div>
            </div>
        </div>
    );
};

export default Home;
