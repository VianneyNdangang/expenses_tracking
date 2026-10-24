export const usePdfDownload = () => {
  const downloadingId = ref<string | null>(null)
  const { download } = useApiFile()
  const requestToast = useRequestToast()

  const downloadCommitmentPdf = async (id: string, letterNumber?: string) => {
    downloadingId.value = id
    try {
      const sanitized = (letterNumber || 'ENG').replace(/[^a-zA-Z0-9_-]/g, '_')
      await download(`/api/commitments/${id}/pdf`, `Lettre_Engagement_${sanitized}.pdf`)
    } catch (error) {
      const message = error && typeof error === 'object' && 'data' in error
        && error.data && typeof error.data === 'object' && 'statusMessage' in error.data
        && typeof error.data.statusMessage === 'string'
        ? error.data.statusMessage
        : error instanceof Error ? error.message : 'Impossible de télécharger le PDF.'
      requestToast.error(message)
    } finally {
      downloadingId.value = null
    }
  }

  return {
    downloadingId,
    downloadCommitmentPdf
  }
}
