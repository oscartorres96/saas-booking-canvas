import { useQuery } from "@tanstack/react-query";
import { getBusinessSlots } from "@/api/businessesApi";
import { format } from "date-fns";

export const useSlots = (businessId: string | undefined, date: Date | undefined, serviceId: string) => {
    return useQuery({
        queryKey: ["slots", businessId, date, serviceId],
        queryFn: async () => {
            if (!businessId || !date || !serviceId) return [];
            const dateStr = format(date, "yyyy-MM-dd");
            return getBusinessSlots(businessId, dateStr, serviceId);
        },
        enabled: !!businessId && !!date && !!serviceId,
    });
};
