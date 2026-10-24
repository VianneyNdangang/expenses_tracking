export const useRequestToast = () => {
  const toast = useToast()

  return {
    success(description: string, title = 'Opération réussie') {
      toast.add({
        title,
        description,
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    },
    error(description: string, title = 'Erreur') {
      toast.add({
        title,
        description,
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    }
  }
}
