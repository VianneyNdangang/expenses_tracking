import fs from 'node:fs'
import path from 'node:path'
import { connectToDatabase } from '../utils/db'
import { sequelize } from '../utils/sequelize'

const TABLES = [
  'users',
  'settings',
  'letter_templates',
  'items',
  'item_prices',
  'workers',
  'witnesses',
  'commitments',
  'payments',
  'justifications',
  'counters',
  'sessions',
  'audit_logs'
]

async function runRestore() {
  console.log('🔄 Démarrage de la restauration MySQL...')

  if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
    process.loadEnvFile('.env')
  }

  const args = process.argv.slice(2)
  let backupFilePath = ''
  const fileArgIndex = args.indexOf('--file')
  if (fileArgIndex !== -1 && args[fileArgIndex + 1]) {
    backupFilePath = path.resolve(process.cwd(), args[fileArgIndex + 1])
  } else {
    const backupDir = path.resolve(process.cwd(), 'backups')
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse()
      if (files.length > 0) {
        backupFilePath = path.join(backupDir, files[0])
      }
    }
  }

  if (!backupFilePath || !fs.existsSync(backupFilePath)) {
    throw new Error('Aucune sauvegarde valide trouvée. Utilisez --file <chemin>.')
  }

  const backupData: unknown = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'))
  if (!backupData || typeof backupData !== 'object' || Array.isArray(backupData)) {
    throw new Error('Le fichier de sauvegarde doit contenir un objet de tables.')
  }

  await connectToDatabase()
  const queryInterface = sequelize.getQueryInterface()
  await sequelize.transaction(async (transaction) => {
    for (const table of TABLES) {
      const records = (backupData as Record<string, unknown>)[table]
      if (records === undefined) continue
      if (!Array.isArray(records) || records.some(record => !record || typeof record !== 'object' || Array.isArray(record))) {
        throw new Error(`La sauvegarde contient des données invalides pour la table "${table}".`)
      }

      await queryInterface.bulkDelete(table, {}, { transaction })
      if (records.length > 0) {
        await queryInterface.bulkInsert(table, records as Array<Record<string, unknown>>, { transaction })
      }
      console.log(`  ✓ Table "${table}": ${records.length} ligne(s) restaurée(s)`)
    }
  })

  console.log(`\n🎉 Restauration terminée depuis ${path.basename(backupFilePath)}.`)
  await sequelize.close()
}

runRestore().catch(async (err: unknown) => {
  console.error('❌ Échec de la restauration :', err)
  await sequelize.close()
  process.exitCode = 1
})
