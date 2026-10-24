import type { AxiosRequestConfig } from 'axios'
import type { InternalApi } from 'nitropack/types'
import type { WatchSource } from 'vue'

interface ApiDataOptions<T> {
  key: string
  params?: MaybeRefOrGetter<AxiosRequestConfig['params']>
  default?: () => T
  watch?: WatchSource[]
}

export type ApiGetResponse<Route extends keyof InternalApi>
  = InternalApi[Route] extends { get: infer Response } ? Response : never

export const useApi = () => useNuxtApp().$api

export function useApiData<T>(
  url: MaybeRefOrGetter<string>,
  options: ApiDataOptions<T>
) {
  const api = useApi()
  const requestUrl = computed(() => toValue(url))

  return useAsyncData<T>(
    options.key,
    async () => {
      const response = await api.get<T>(requestUrl.value, { params: toValue(options.params) })
      return response.data
    },
    {
      default: options.default,
      watch: [requestUrl, ...(options.watch || [])]
    }
  )
}
