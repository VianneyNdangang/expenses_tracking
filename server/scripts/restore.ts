import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'
import { connectToDatabase } from '../utils/db'

async function runRestore() {
  console.log('🔄 Démarrage de la restauration de la base de données...')

  // Chargement de l'environnement si disponible
  if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
    process.loadEnvFile('.env')
  }

  const args = process.argv.slice(2)
  let backupFilePath = ''

  const fileArgIndex = args.indexOf('--file')
  if (fileArgIndex !== -1 && args[fileArgIndex + 1]) {
    backupFilePath = path.resolve(process.cwd(), args[fileArgIndex + 1])
  } else {
    // Prendre le fichier de sauvegarde le plus récent dans ./backups/
    const backupDir = path.resolve(process.cwd(), 'backups')
    if (fs.existsSync(backupDir)) {
      const files = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
        .sort()
        .reverse()

      if (files.length > 0) {
        backupFilePath = path.join(backupDir, files[0])
      }
    }
  }

  if (!backupFilePath || !fs.existsSync(backupFilePath)) {
    console.error('❌ Aucun fichier de sauvegarde valide trouvé. Utilisez --file <chemin>')
    process.exit(1)
  }

  console.log(`📄 Lecture de la sauvegarde : ${backupFilePath}`)
  const rawData = fs.readFileSync(backupFilePath, 'utf-8')
  const backupData: Record<string, any[]> = JSON.parse(rawData)

  await connectToDatabase()

  const db = mongoose.connection.db
  if (!db) {
    throw new Error('Connexion à la base de données impossible.')
  }

  for (const [collName, docs] of Object.entries(backupData)) {
    if (!Array.isArray(docs) || docs.length === 0) continue

    try {
      const collection = db.collection(collName)
      await collection.deleteMany({}) // Nettoyage de la collection existante
      await collection.insertMany(docs)
      console.log(`  ✓ Collection "${collName}": ${docs.length} document(s) restauré(s)`)
    } catch (err: any) {
      console.error(`  ❌ Erreur lors de la restauration de "${collName}":`, err.message)
    }
  }

  console.log(`\n🎉 Restauration terminée avec succès depuis ${path.basename(backupFilePath)} !`)

  await mongoose.disconnect()
  process.exit(0)
}

runRestore().catch((err) => {
  console.error('❌ Échec de la restauration :', err)
  process.exit(1)
})
