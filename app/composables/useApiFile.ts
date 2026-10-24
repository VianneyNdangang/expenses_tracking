export const useApiFile = () => {
  const api = useApi()

  const readBlob = async (url: string) => {
    const response = await api.get<Blob>(url, { responseType: 'blob' })
    return response.data
  }

  const open = async (url: string) => {
    const tab = window.open('about:blank', '_blank')
    if (!tab) {
      throw new Error('Autorisez les fenêtres contextuelles pour ouvrir le document.')
    }
    tab.opener = null

    try {
      const objectUrl = URL.createObjectURL(await readBlob(url))
      tab.location.href = objectUrl
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (error) {
      tab?.close()
      throw error
    }
  }

  const download = async (url: string, filename: string) => {
    const objectUrl = URL.createObjectURL(await readBlob(url))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  }

  return { open, download }
}
