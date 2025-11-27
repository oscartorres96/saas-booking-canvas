export interface BusinessSeedDefinition {
  name: string;
  slug: string;
  address?: string;
  type: string;
}

export const businessSeeds: BusinessSeedDefinition[] = [
  { name: 'Dental Clinic Zamora', slug: 'dental-clinic-zamora', address: 'Av. Universidad 123, CDMX', type: 'dentist' },
  { name: 'Gym Titanes', slug: 'gym-titanes', address: 'Blvd. Reforma 456, CDMX', type: 'gym' },
  { name: 'Barberia El Patron', slug: 'barberia-el-patron', address: 'Calle Hidalgo 789, CDMX', type: 'barber' },
];

export const serviceTemplatesByType: Record<string, { name: string; durationMinutes: number; price: number; description: string }[]> = {
  gym: [
    { name: 'Clase de Yoga', durationMinutes: 60, price: 12, description: 'Sesion grupal para flexibilidad y respiracion.' },
    { name: 'Clase de Zumba', durationMinutes: 45, price: 10, description: 'Cardio con baile de alta energia.' },
    { name: 'Clase de Box', durationMinutes: 45, price: 14, description: 'Entrenamiento de golpes y acondicionamiento.' },
    { name: 'Spinning', durationMinutes: 50, price: 12, description: 'Ciclismo indoor con intervalos.' },
    { name: 'Entrenamiento Personal', durationMinutes: 60, price: 25, description: 'Sesion 1 a 1 con coach.' },
    { name: 'Evaluacion Fisica', durationMinutes: 30, price: 8, description: 'Mediciones y plan de metas.' },
  ],
  barber: [
    { name: 'Corte Clasico', durationMinutes: 40, price: 15, description: 'Corte tradicional con acabado limpio.' },
    { name: 'Fade', durationMinutes: 45, price: 18, description: 'Degradado preciso con navaja.' },
    { name: 'Barba y Perfilado', durationMinutes: 30, price: 12, description: 'Afeitado, recorte y contornos.' },
    { name: 'Paquete Corte + Barba', durationMinutes: 60, price: 25, description: 'Servicio completo para cabello y barba.' },
    { name: 'Facial Express', durationMinutes: 25, price: 10, description: 'Limpieza rapida y masaje facial.' },
  ],
  dentist: [
    { name: 'Consulta Inicial', durationMinutes: 30, price: 30, description: 'Valoracion y plan de tratamiento.' },
    { name: 'Limpieza Dental', durationMinutes: 45, price: 45, description: 'Profilaxis y pulido profesional.' },
    { name: 'Blanqueamiento', durationMinutes: 60, price: 120, description: 'Tratamiento estetico con peroxido.' },
    { name: 'Control de Ortodoncia', durationMinutes: 30, price: 35, description: 'Ajuste y revision de brackets o alineadores.' },
    { name: 'Urgencias', durationMinutes: 30, price: 50, description: 'Atencion prioritaria para dolor o fracturas.' },
  ],
  nutritionist: [
    { name: 'Consulta Inicial', durationMinutes: 45, price: 35, description: 'Evaluacion y objetivos nutricionales.' },
    { name: 'Seguimiento Mensual', durationMinutes: 30, price: 25, description: 'Revision de avances y ajustes.' },
    { name: 'Plan Personalizado', durationMinutes: 60, price: 45, description: 'Menus y plan semanal.' },
    { name: 'Consulta Online', durationMinutes: 30, price: 20, description: 'Sesion remota por videollamada.' },
  ],
  spa: [
    { name: 'Masaje Relajante', durationMinutes: 60, price: 50, description: 'Aceites y tecnica sueca.' },
    { name: 'Masaje Descontracturante', durationMinutes: 50, price: 55, description: 'Trabajo focalizado en tensiones.' },
    { name: 'Facial Hidratante', durationMinutes: 45, price: 40, description: 'Limpieza, exfoliacion e hidratacion.' },
    { name: 'Circuito Spa', durationMinutes: 90, price: 90, description: 'Sauna, masaje y mascarilla.' },
    { name: 'Manicure/Pedicure', durationMinutes: 60, price: 30, description: 'Cuidado de manos y pies.' },
  ],
  other: [
    { name: 'Sesion Principal', durationMinutes: 45, price: 40, description: 'Servicio principal del negocio.' },
    { name: 'Consulta/Asesoria', durationMinutes: 30, price: 30, description: 'Revision inicial y plan.' },
    { name: 'Sesion Personalizada', durationMinutes: 60, price: 60, description: 'Adaptado al cliente.' },
    { name: 'Paquete Mensual', durationMinutes: 90, price: 120, description: 'Plan con seguimiento.' },
    { name: 'Express', durationMinutes: 25, price: 25, description: 'Atencion rapida.' },
  ],
};

export const clientFirstNames = [
  'Maria', 'Luis', 'Ana', 'Carlos', 'Fernanda', 'Jorge', 'Lucia', 'Miguel', 'Valeria', 'Diego',
  'Sofia', 'Andres', 'Camila', 'Ricardo', 'Daniela', 'Emilio', 'Paola', 'Hugo', 'Jimena', 'Raul',
];

export const clientLastNames = [
  'Zamora', 'Hernandez', 'Ramirez', 'Perez', 'Lopez', 'Flores', 'Gomez', 'Martinez', 'Sanchez', 'Vargas',
  'Silva', 'Mendoza', 'Castro', 'Rios', 'Delgado', 'Moreno', 'Aguilar', 'Torres', 'Reyes', 'Navarro',
];

export const clientDomains = ['clients.bookpro.test', 'example.com'];
