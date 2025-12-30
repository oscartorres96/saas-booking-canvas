import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
    {
        name: 'Dra. Ana García',
        role: 'Clínica Dental',
        content: 'Desde que usamos BookPro, mis pacientes agendan solos y hemos reducido las cancelaciones en un 50% gracias a los avisos automáticos.',
        rating: 5,
        avatar: 'AG'
    },
    {
        name: 'Carlos Mendoza',
        role: 'Dueño de Gym & Fitness',
        content: 'La mejor inversión para mi estudio. Los paquetes de clases se venden solos y el control de asistencia es sencillísimo.',
        rating: 5,
        avatar: 'CM'
    },
    {
        name: 'Lucía Fernández',
        role: 'Estudio de Belleza',
        content: 'Amamos la página personalizada. Mis clientas dicen que es súper fácil reservar por WhatsApp sin tener que llamarme.',
        rating: 5,
        avatar: 'LF'
    }
];

export const TestimonialsSection = () => {
    const { t } = useTranslation();

    return (
        <section id="testimonials" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        Confiado por negocios como el tuyo
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        Únete a clínicas, gimnasios y estudios que ya están automatizando su crecimiento.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="h-full border-none shadow-xl bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Quote size={40} />
                                </div>
                                <CardContent className="p-6 sm:p-8">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                                        ))}
                                    </div>
                                    <p className="text-base sm:text-lg italic mb-6 text-foreground/90 leading-relaxed">
                                        "{testimonial.content}"
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center font-bold text-white shadow-md">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base sm:text-lg">{testimonial.name}</h4>
                                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
