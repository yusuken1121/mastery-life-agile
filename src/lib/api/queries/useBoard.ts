import { useQuery } from "@tanstack/react-query"
import { boardApi, healthApi } from "../board"

export function useBoard() {
  return useQuery({
    queryKey: ["board"],
    queryFn: boardApi.get,
  })
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: healthApi.get,
  })
}
