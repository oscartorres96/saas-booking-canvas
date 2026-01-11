import apiClient from './axiosConfig';

export interface AvailabilityInterval {
    startTime: string;
    endTime: string;
}

export interface DayAvailability {
    enabled: boolean;
    intervals: AvailabilityInterval[];
}

export interface AvailabilityTemplate {
    businessId: string;
    slotDuration: number;
    bufferBetweenSlots: number;
    weeklyRules: {
        day: string;
        enabled: boolean;
        intervals: AvailabilityInterval[];
    }[];
}

export interface AvailabilityWeekOverride {
    businessId: string;
    weekStartDate: string;
    dailyOverrides: Record<string, DayAvailability>;
    notes?: string;
}

export const availabilityApi = {
    getTemplate: (businessId: string) =>
        apiClient.get<AvailabilityTemplate>(`/availability/template/${businessId}`),

    upsertTemplate: (businessId: string, data: Partial<AvailabilityTemplate>) =>
        apiClient.post<AvailabilityTemplate>(`/availability/template/${businessId}`, data),

    getOverride: (businessId: string, weekStart: string) =>
        apiClient.get<AvailabilityWeekOverride>(`/availability/override/${businessId}?weekStart=${weekStart}`),

    upsertOverride: (businessId: string, weekStart: string, data: Partial<AvailabilityWeekOverride>) =>
        apiClient.post<AvailabilityWeekOverride>(`/availability/override/${businessId}`, { weekStart, data }),

    copyPreviousWeek: (businessId: string, currentWeekStart: string) =>
        apiClient.post<AvailabilityWeekOverride>(`/availability/copy-previous/${businessId}`, { currentWeekStart }),

    getAvailableSlots: (businessId: string, start: string, end: string, serviceId?: string) =>
        apiClient.get<{ date: string; slots: { time: string; isAvailable: boolean }[] }[]>(
            `/availability/slots/${businessId}?start=${start}&end=${end}${serviceId ? `&serviceId=${serviceId}` : ''}`
        ),
};
