export default defineEventHandler((event) => {
  if (event.path.startsWith('/uploads/')) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Cette adresse de fichier n’est plus accessible directement.'
    })
  }
})
