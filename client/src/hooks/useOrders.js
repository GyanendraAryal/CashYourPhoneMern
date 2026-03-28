import { useQuery } from "@tanstack/react-query";
import * as orderService from "../services/orderService";

export const useMyOrders = () => {
  return useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => orderService.getMyOrders(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useOrder = (id) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
