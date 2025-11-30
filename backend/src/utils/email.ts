import * as nodemailer from 'nodemailer';

/**
 * Configuración del transporte de email.
 * Usa las variables de entorno para configurar el servicio SMTP.
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

/**
 * Envía un correo electrónico usando nodemailer.
 * @param options - Opciones del correo (destinatario, asunto, HTML, remitente opcional)
 * @returns Promise que se resuelve cuando el correo se envía correctamente
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: options.from || process.env.SMTP_FROM || process.env.SMTP_USER,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email enviado:', info.messageId);
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        // No lanzamos el error para que no rompa el flujo de la aplicación
        // En producción, podrías querer usar un sistema de logs más robusto
    }
};

/**
 * Valida la configuración de email.
 * @returns true si la configuración es válida, false en caso contrario
 */
export const validateEmailConfig = (): boolean => {
    const required = ['SMTP_USER', 'SMTP_PASS'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.warn(
            `⚠️  Configuración de email incompleta. Variables faltantes: ${missing.join(', ')}`
        );
        return false;
    }

    return true;
};
