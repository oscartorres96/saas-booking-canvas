import apiClient from './axiosConfig';

export interface ResourceAvailability {
  resourceConfig: {
    enabled: boolean;
    resourceType: string;
    resourceLabel: string;
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
}

export const getResourceAvailability = async (
  businessId: string,
  scheduledAt: string
): Promise<ResourceAvailability> => {
  const { data } = await apiClient.get<ResourceAvailability>(
    `/resource-map/${businessId}/availability`,
    { params: { scheduledAt } }
  );
  return data;
};

export const createResourceHold = async (
  businessId: string,
  resourceId: string,
  scheduledAt: string
): Promise<any> => {
  const { data } = await apiClient.post('/resource-map/hold', {
    businessId,
    resourceId,
    scheduledAt,
  });
  return data;
};
