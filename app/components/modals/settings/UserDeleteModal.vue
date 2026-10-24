<script setup lang="ts">
interface Props {
  modelValue: boolean
  user: any | null
}

const props = withDefaults(defineProps<Props>(), {
  user: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  deleted: [message: string]
  error: [message: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const deleteUserLoading = ref(false)

const submitDeleteUser = async () => {
  if (!props.user) return
  deleteUserLoading.value = true
  try {
    await $fetch(`/api/users/${props.user.id}`, {
      method: 'DELETE'
    })
    const msg = `L'utilisateur "${props.user.name}" a été supprimé avec succès.`
    isOpen.value = false
    emit('deleted', msg)
  } catch (err: any) {
    const errorMsg = err.data?.statusMessage || err.message || 'Erreur lors de la suppression'
    isOpen.value = false
    emit('error', errorMsg)
  } finally {
    deleteUserLoading.value = false
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="Confirmer la suppression du compte"
    :description="`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${user?.name || ''} (@${user?.username || ''}) ? Ses sessions actives seront également révoquées.`"
    icon="i-lucide-alert-triangle"
    confirm-label="Supprimer Définitivement"
    confirm-color="error"
    :confirm-loading="deleteUserLoading"
    @confirm="submitDeleteUser"
    @cancel="isOpen = false"
  />
</template>
