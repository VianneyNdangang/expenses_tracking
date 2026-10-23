import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import { connectToDatabase } from '../utils/db'

// Collections à sauvegarder
const COLLECTIONS = [
  'users',
  'settings',
  'lettertemplates',
  'items',
  'itemprices',
  'workers',
  'witnesses',
  'commitments',
  'payments',
  'justifications',
  'counters',
  'auditlogs'
]

async function runBackup() {
  console.log('📦 Démarrage de la sauvegarde de la base de données...')

  // Chargement de l'environnement si disponible
  if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
    process.loadEnvFile('.env')
  }

  await connectToDatabase()

  const db = mongoose.connection.db
  if (!db) {
    throw new Error('Connexion à la base de données impossible.')
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupDir = path.resolve(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const backupFilePath = path.join(backupDir, `backup-${timestamp}.json`)
  const backupData: Record<string, any[]> = {}

  for (const collName of COLLECTIONS) {
    try {
      const docs = await db.collection(collName).find({}).toArray()
      backupData[collName] = docs
      console.log(`  ✓ Collection "${collName}": ${docs.length} document(s) exporté(s)`)
    } catch (err: any) {
      console.warn(`  ⚠️ Impossible d'exporter "${collName}":`, err.message)
      backupData[collName] = []
    }
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8')
  console.log(`\n🎉 Sauvegarde terminée avec succès !`)
  console.log(`📁 Fichier généré : ${backupFilePath}`)

  await mongoose.disconnect()
  process.exit(0)
}

runBackup().catch((err) => {
  console.error('❌ Échec de la sauvegarde :', err)
  process.exit(1)
})
