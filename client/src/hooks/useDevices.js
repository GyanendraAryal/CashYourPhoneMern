import { useQuery } from "@tanstack/react-query";
import * as deviceService from "../services/deviceService";

/**
 * ✅ FIXED: unwrap axios response safely
 */
const extractData = (res) => {
  return res?.data || {};
};

export const useDevices = (options = {}) => {
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["devices", queryOptions],

    queryFn: async () => {
      const res = await deviceService.getDevices(queryOptions);
      return extractData(res); // ✅ FIX
    },

    enabled,

    staleTime: 1000 * 60 * 5,

    // ✅ prevents crash if API fails
    retry: 1,

    // ✅ keeps previous data during refetch (better UX)
    placeholderData: (prev) => prev || {},
  });
};

export const useDevice = (id) => {
  return useQuery({
    queryKey: ["device", id],

    queryFn: async () => {
      const res = await deviceService.getDeviceById(id);
      return extractData(res); // ✅ FIX
    },

    enabled: !!id,

    staleTime: 1000 * 60 * 10,

    retry: 1,
  });
};

export const useRecommendations = (id) => {
  return useQuery({
    queryKey: ["recommendations", id],

    queryFn: async () => {
      const res = await deviceService.getRecommendations(id);
      return extractData(res); // ✅ FIX
    },

    enabled: !!id,

    staleTime: 1000 * 60 * 30,

    retry: 1,
  });
};