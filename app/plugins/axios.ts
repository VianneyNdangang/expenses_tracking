import axios, { type AxiosInstance } from 'axios'

export default defineNuxtPlugin(() => {
  const api = axios.create({
    baseURL: import.meta.server ? useRequestURL().origin : '/',
    withCredentials: true,
    headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
  })

  api.interceptors.response.use(
    response => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response) {
        Object.assign(error, { data: error.response.data })
      }
      return Promise.reject(error)
    }
  )

  return {
    provide: { api }
  }
})

declare module '#app' {
  interface NuxtApp {
    $api: AxiosInstance
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance
  }
}
