export const usePdfDownload = () => {
  const downloadingId = ref<string | null>(null)

  const downloadCommitmentPdf = async (id: string, letterNumber?: string) => {
    downloadingId.value = id
    try {
      const sanitized = (letterNumber || 'ENG').replace(/[^a-zA-Z0-9_-]/g, '_')
      const blob = await $fetch<Blob>(`/api/commitments/${id}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Lettre_Engagement_${sanitized}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF :', err)
      // Fallback navigateur direct
      const a = document.createElement('a')
      a.href = `/api/commitments/${id}/pdf`
      a.download = ''
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } finally {
      downloadingId.value = null
    }
  }

  return {
    downloadingId,
    downloadCommitmentPdf
  }
}
