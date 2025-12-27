import apiClient from './axiosConfig';

export interface ResourceAvailability {
  resourceConfig: {
    enabled: boolean;
    resourceType: string;
    resourceLabel: string;
    layoutType?: string;
    rows: number;
    cols: number;
    resources: Array<{
      id: string;
      label: string;
      isActive: boolean;
      position: { row: number; col: number };
    }>;
  };
  occupiedResourceIds: string[];
  userHoldResourceId?: string | null;
}

export const getResourceAvailability = async (
  businessId: string,
  scheduledAt: string,
  sessionId?: string
): Promise<ResourceAvailability> => {
  const { data } = await apiClient.get<ResourceAvailability>(
    `/resource-map/${businessId}/availability`,
    { params: { scheduledAt, sessionId } }
  );
  return data;
};

export const createResourceHold = async (
  businessId: string,
  resourceId: string,
  scheduledAt: string,
  sessionId?: string
): Promise<any> => {
  const { data } = await apiClient.post('/resource-map/hold', {
    businessId,
    resourceId,
    scheduledAt,
    sessionId,
  });
  return data;
};
