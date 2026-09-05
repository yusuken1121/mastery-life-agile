import axios from "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    useFormUrlEncoded?: boolean
  }
}

const isUseMock = process.env.NEXT_PUBLIC_USE_MOCK
const BASE_URL =
  isUseMock === "true"
    ? process.env.NEXT_PUBLIC_MOCK_API_URL
    : (process.env.NEXT_PUBLIC_API_URL ?? "")

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  if (config.data != null) {
    if (config.useFormUrlEncoded) {
      config.headers["Content-Type"] = "application/x-www-form-urlencoded"
    } else {
      config.headers["Content-Type"] = "application/json"
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return Promise.reject(error)
  },
)
