import dotenv from 'dotenv'

dotenv.config()

async function migrateDatabase() {
  const initialPassword = process.env.PATRON_INITIAL_PASSWORD
  if (!initialPassword || initialPassword.length < 12) {
    throw new Error('Définissez PATRON_INITIAL_PASSWORD avec au moins 12 caractères dans .env.')
  }

  const { sequelize } = await import('../utils/sequelize')
  await import('../models')
  const { User } = await import('../models/User')
  const { hashPassword } = await import('../utils/crypto')

  try {
    await sequelize.authenticate()
    await sequelize.sync()

    const existingPatron = await User.findOne({ username: 'patron' })
    if (existingPatron) {
      console.log('Le compte patron existe déjà ; son mot de passe n’a pas été modifié.')
    } else {
      await User.create({
        username: 'patron',
        name: process.env.PATRON_INITIAL_NAME || 'M. Abdouraman',
        role: 'PATRON',
        passwordHash: await hashPassword(initialPassword),
        failedLoginAttempts: 0
      })
      console.log('Compte patron créé (identifiant : patron).')
    }

    console.log('Migration terminée : tables manquantes créées et base prête.')
  } finally {
    await sequelize.close()
  }
}

migrateDatabase().catch((error: unknown) => {
  console.error('Échec de la migration MySQL.', error)
  process.exitCode = 1
})
