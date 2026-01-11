import apiClient from './axiosConfig';
import { Slot } from './businessesApi';

export interface AvailabilityTemplate {
    _id?: string;
    businessId: string;
    entityType: 'BUSINESS' | 'RESOURCE' | 'PROVIDER';
    entityId?: string;
    timezone: string;
    slotDurationMinutes: number;
    bufferMinutes: number;
    weeklyRules: Array<{
        dayOfWeek: number;
        enabled: boolean;
        blocks: Array<{ start: string; end: string }>;
    }>;
}

export interface DayOverride {
    date: string;
    enabled: boolean;
    blocks: Array<{ start: string; end: string }>;
    blockedRanges: Array<{ start: string; end: string }>;
}

export interface AvailabilityWeekOverride {
    _id?: string;
    businessId: string;
    entityType: 'BUSINESS' | 'RESOURCE' | 'PROVIDER';
    entityId?: string;
    weekStartDate: string;
    days: DayOverride[];
    note?: string;
    source?: 'MANUAL' | 'COPY_PREV' | 'RESET_BASE';
}

export const getAvailabilityTemplate = async (businessId: string, entityType: string = 'BUSINESS', entityId?: string): Promise<AvailabilityTemplate | null> => {
    const { data } = await apiClient.get<AvailabilityTemplate>('/availability/template', {
        params: { businessId, entityType, entityId }
    });
    return data;
};

export const updateAvailabilityTemplate = async (template: Partial<AvailabilityTemplate>): Promise<AvailabilityTemplate> => {
    const { data } = await apiClient.put<AvailabilityTemplate>('/availability/template', template);
    return data;
};

export const getWeekOverride = async (businessId: string, weekStartDate: string, entityType: string = 'BUSINESS', entityId?: string): Promise<AvailabilityWeekOverride | null> => {
    const { data } = await apiClient.get<AvailabilityWeekOverride>('/availability/week', {
        params: { businessId, weekStartDate, entityType, entityId }
    });
    return data;
};

export const updateWeekOverride = async (override: Partial<AvailabilityWeekOverride>): Promise<AvailabilityWeekOverride> => {
    const { data } = await apiClient.put<AvailabilityWeekOverride>('/availability/week', override);
    return data;
};

export const copyWeekOverride = async (payload: { businessId: string, fromWeekStartDate: string, toWeekStartDate: string, entityType?: string, entityId?: string }): Promise<AvailabilityWeekOverride> => {
    const { data } = await apiClient.post<AvailabilityWeekOverride>('/availability/week/copy', payload);
    return data;
};

export const getAvailableSlots = async (params: { businessId: string, startDate: string, endDate: string, serviceId: string, entityType?: string, entityId?: string }): Promise<Array<{ date: string, slots: Slot[] }>> => {
    const { data } = await apiClient.get<Array<{ date: string, slots: Slot[] }>>('/availability/slots', { params });
    return data;
};
