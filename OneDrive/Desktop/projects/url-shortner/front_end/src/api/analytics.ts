import api from "./axios";
import { type AnalyticsOverview,type TimelinePoint, type BreakdownData } from "../types";

export const analyticsApi = {
    getOverview: async () => {
        const { data } = await api.get("/analytics/overview");
        return data.data as AnalyticsOverview;
    },

    getTimeline: async (urlId: string) => {
        const { data } = await api.get(`/analytics/${urlId}/timeline`);
        return data.data as TimelinePoint[];
    },

    getBreakdown: async (urlId: string) => {
        const { data } = await api.get(`/analytics/${urlId}/breakdown`);
        return data.data as BreakdownData;
    }
};

