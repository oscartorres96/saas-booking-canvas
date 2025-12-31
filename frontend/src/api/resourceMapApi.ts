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
  serviceId: string,
  scheduledAt: string,
  sessionId?: string
): Promise<ResourceAvailability> => {
  const { data } = await apiClient.get<ResourceAvailability>(
    `/resource-map/${businessId}/availability`,
    { params: { serviceId, scheduledAt, sessionId } }
  );
  return data;
};

export const getResourceConfig = async (
  businessId: string,
  serviceId: string
): Promise<ResourceAvailability['resourceConfig']> => {
  const { data } = await apiClient.get(
    `/resource-map/${businessId}/${serviceId}/config`
  );
  return data;
};

export const createResourceHold = async (
  businessId: string,
  serviceId: string,
  resourceId: string,
  scheduledAt: string,
  sessionId?: string
): Promise<any> => {
  const { data } = await apiClient.post('/resource-map/hold', {
    businessId,
    serviceId,
    resourceId,
    scheduledAt,
    sessionId,
  });
  return data;
};

export const updateResourceConfig = async (
  businessId: string,
  serviceId: string,
  config: any
): Promise<any> => {
  const { data } = await apiClient.put(`/resource-map/${businessId}/${serviceId}/config`, config);
  return data;
};

export const releaseResourceHolds = async (
  businessId: string,
  sessionId: string
): Promise<any> => {
  const { data } = await apiClient.post('/resource-map/release-holds', {
    businessId,
    sessionId,
  });
  return data;
};
