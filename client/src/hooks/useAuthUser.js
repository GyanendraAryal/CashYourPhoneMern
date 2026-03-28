import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export const useAuthUser = () => {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const res = await api.get("/api/v1/user/me");
      return res.data?.user || null;
    },
    // Don't refetch on mount if we have a user
    staleTime: Infinity, 
    retry: false,
  });
};
