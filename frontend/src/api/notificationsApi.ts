import axiosInstance from './axiosConfig';

export interface SendReminderData {
    to: string;
    clientName: string;
    message: string;
    subject?: string;
    ctaUrl?: string;
}

export const notificationsApi = {
    sendReminder: async (data: SendReminderData) => {
        const response = await axiosInstance.post('/notifications/send-reminder', data);
        return response.data;
    }
};
