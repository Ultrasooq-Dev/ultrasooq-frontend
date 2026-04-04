import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "../requests/transactions.requests";

export const useTransactions = (
    payload: {
        page: number;
        limit: number;
    },
    enabled = true,
) =>
    useQuery({
        queryKey: ["transactions", payload],
        queryFn: async () => {
            const res = await fetchTransactions(payload);
            return res.data;
        },
        enabled,
    });