import { defineSqlModel, sqlTypes, type SqlDocument } from '../utils/sqlModel'
import { sequelize } from '../utils/sequelize'
import type { Transaction } from 'sequelize'

export interface ICounter extends SqlDocument {
  _id: string
  seq: number
}

export const Counter = defineSqlModel<ICounter>('Counter', {
  _id: { type: sqlTypes.STRING(100), allowNull: false, primaryKey: true },
  seq: { type: sqlTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'counters', timestamps: false })

export async function getNextSequence(name: string, transaction?: Transaction): Promise<number> {
  await sequelize.query(
    'INSERT INTO `counters` (`_id`, `seq`) VALUES (?, 1) ON DUPLICATE KEY UPDATE `seq` = `seq` + 1',
    { replacements: [name], transaction }
  )
  const counter = await Counter.findById(name)
  if (!counter) {
    throw new Error(`Le compteur "${name}" n'a pas pu être créé.`)
  }
  return counter.seq
}
