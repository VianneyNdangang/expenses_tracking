import mongoose from 'mongoose'

let isConnected = false
let replSetInstance: any = null

/**
 * Initialise et maintient la connexion MongoDB Mongoose.
 * Supporte le replica set pour les transactions, avec fallback automatique en mémoire (dev).
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose
  }

  const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : {} as any
  let uri = process.env.MONGODB_URI || config.mongodbUri || 'mongodb://127.0.0.1:27017/controle_depense'
  const forceMemory = process.env.USE_MEMORY_DB === 'true' || config.useMemoryDb

  if (forceMemory) {
    if (!replSetInstance) {
      console.log('🔄 Initialisation du Replica Set MongoDB en mémoire...')
      const { MongoMemoryReplSet } = await import('mongodb-memory-server')
      replSetInstance = await MongoMemoryReplSet.create({
        replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' }
      })
      uri = replSetInstance.getUri('controle_depense')
      console.log(`✅ MongoDB Replica Set prêt en mémoire : ${uri}`)
    } else {
      uri = replSetInstance.getUri('controle_depense')
    }
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    })
    isConnected = true
    console.log(`✅ Connecté à MongoDB : ${uri.split('@').pop()}`)
    const { ensureInitialData } = await import('./initData')
    await ensureInitialData()
    return mongoose
  } catch (err: any) {
    // Si la connexion standard échoue en mode dev, démarrer un replica set en mémoire de secours
    if (process.env.NODE_ENV !== 'production' && !replSetInstance) {
      console.warn(`⚠️ Échec de connexion à ${uri} (${err.message}). Démarrage de secours du Replica Set en mémoire...`)
      const { MongoMemoryReplSet } = await import('mongodb-memory-server')
      replSetInstance = await MongoMemoryReplSet.create({
        replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' }
      })
      uri = replSetInstance.getUri('controle_depense')
      await mongoose.connect(uri)
      isConnected = true
      console.log(`✅ Secours actif - Connecté au Replica Set MongoDB en mémoire : ${uri}`)
      const { ensureInitialData } = await import('./initData')
      await ensureInitialData()
      return mongoose
    }
    throw err
  }
}

/**
 * Exécute une opération atomique dans une transaction MongoDB si un Replica Set est actif.
 * Si MongoDB fonctionne en mode autonome (Single / Standalone), exécute la fonction sans session de transaction.
 */
export async function withTransaction<T>(
  fn: (session?: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  await connectToDatabase()

  const client = mongoose.connection.getClient()
  const topologyType = client?.topology?.description?.type
  const supportsTransactions = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded'

  if (!supportsTransactions) {
    return await fn(undefined)
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const result = await fn(session)
    await session.commitTransaction()
    return result
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    await session.endSession()
  }
}
