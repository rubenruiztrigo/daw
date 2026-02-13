
import { supabase } from '../supabaseClient';

export const sendEmail = async (to: string, subject: string, body: string) => {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Body: ${body}`);
    // In a real implementation with backend, this would call Supabase Edge Function
    // await supabase.functions.invoke('send-email', { body: { to, subject, body } });

    // For now, simulate success
    return { success: true };
};

export const notifyAdminNewUser = async (username: string, fullName: string, targetEmail: string = 'info@novagob.org') => {
    const subject = `Solicitud de registro en la red - ${username}`;
    const body = `${fullName} solicita registrarse en la red.\n\nPor favor, revisa la sección de notificaciones dentro de la red social para gestionar esta solicitud.`;
    await sendEmail(targetEmail, subject, body);
};

export const notifyUserApproved = async (userEmail: string) => {
    const subject = 'Bienvenido a Red Social NovaGob - Solicitud Aceptada';
    const body = 'Tu solicitud de registro ha sido aceptada. Ya puedes iniciar sesión y disfrutar de la comunidad.';
    await sendEmail(userEmail, subject, body);
};

export const notifyUserRejected = async (userEmail: string) => {
    const subject = 'Estado de tu solicitud en Red Social NovaGob';
    const body = 'Lo sentimos, tu solicitud de registro ha sido rechazada. No podrás acceder a la plataforma.';
    await sendEmail(userEmail, subject, body);
};
