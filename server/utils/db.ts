import '../models'
import { sequelize } from './sequelize'

let isConnected = false

export async function connectToDatabase(): Promise<typeof sequelize> {
  if (isConnected) {
    return sequelize
  }

  await sequelize.authenticate()
  await sequelize.sync()
  const { ensureInitialData } = await import('./initData')
  await ensureInitialData()
  isConnected = true
  console.log('✅ Connecté à MySQL et schéma de données prêt.')
  return sequelize
}

export async function withTransaction<T>(
  fn: (transaction?: import('sequelize').Transaction) => Promise<T>
): Promise<T> {
  await connectToDatabase()
  return sequelize.transaction(transaction => fn(transaction))
}
