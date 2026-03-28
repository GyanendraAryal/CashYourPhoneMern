import { useQuery } from "@tanstack/react-query";
import * as deviceService from "../services/deviceService";

export const useDevices = (options = {}) => {
  const { enabled = true, ...queryOptions } = options;
  return useQuery({
    queryKey: ["devices", queryOptions],
    queryFn: () => deviceService.getDevices(queryOptions),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useDevice = (id) => {
  return useQuery({
    queryKey: ["device", id],
    queryFn: () => deviceService.getDeviceById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
};

export const useRecommendations = (id) => {
  return useQuery({
    queryKey: ["recommendations", id],
    queryFn: () => deviceService.getRecommendations(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};
