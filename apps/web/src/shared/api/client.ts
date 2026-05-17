import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useBillingStore } from '../store/billingStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => {
    // Carência ativa — API sinalizou via headers
    if (response.headers['x-payment-warning'] === 'true') {
      const endsAt = response.headers['x-grace-period-ends'] as string
      if (endsAt) useBillingStore.getState().setPastDue(endsAt)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    if (error.response?.status === 402) {
      useBillingStore.getState().setBlocked(error.response.data?.message ?? 'Acesso bloqueado.')
    }
    return Promise.reject(error)
  },
)
