import { LetterTemplate, DEFAULT_LETTER_TEMPLATE } from '../../models/LetterTemplate'

export default defineEventHandler(async () => {
  let activeTemplate = await LetterTemplate.findOne({ isActive: true }).sort({ version: -1 })
  if (!activeTemplate) {
    activeTemplate = await LetterTemplate.create({
      version: 1,
      content: DEFAULT_LETTER_TEMPLATE,
      isActive: true
    })
  }

  const allTemplates = await LetterTemplate.find().sort({ version: -1 }).lean()

  return {
    id: activeTemplate._id,
    version: activeTemplate.version,
    content: activeTemplate.content,
    isActive: activeTemplate.isActive,
    updatedAt: activeTemplate.updatedAt,
    templates: allTemplates.map((t) => ({
      id: t._id,
      version: t.version,
      content: t.content,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    })),
    history: allTemplates.map((t) => ({
      version: t.version,
      isActive: t.isActive,
      createdAt: t.createdAt
    }))
  }
})
