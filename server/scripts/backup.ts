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

async function runBackup() {
  console.log('📦 Démarrage de la sauvegarde MySQL...')
  await connectToDatabase()

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupDir = path.resolve(process.cwd(), 'backups')
  fs.mkdirSync(backupDir, { recursive: true })

  const backupFilePath = path.join(backupDir, `backup-${timestamp}.json`)
  const backupData: Record<string, unknown[]> = {}

  for (const table of TABLES) {
    const [rows] = await sequelize.query(`SELECT * FROM \`${table}\``)
    backupData[table] = rows as unknown[]
    console.log(`  ✓ Table "${table}": ${backupData[table].length} ligne(s) exportée(s)`)
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8')
  console.log(`\n🎉 Sauvegarde terminée : ${backupFilePath}`)
  await sequelize.close()
}

runBackup().catch(async (err: unknown) => {
  console.error('❌ Échec de la sauvegarde :', err)
  await sequelize.close()
  process.exitCode = 1
})
