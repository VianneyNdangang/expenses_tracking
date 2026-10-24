import {
  DataTypes,
  Model,
  Op,
  type AttributeOptions,
  type FindOptions,
  type ModelStatic,
  type Transaction,
  type WhereOptions
} from 'sequelize'
import { sequelize } from './sequelize'

type Data = Record<string | symbol, unknown>
type RawAttributes = Record<string, unknown>
type RawInstance = Model<RawAttributes, RawAttributes>
type SqlEntity<T extends object> = RawInstance & T

export interface SqlDocument {
  _id: string
}

type QueryOptions = {
  transaction?: Transaction
  upsert?: boolean
  new?: boolean
}
type Query<T> = PromiseLike<T> & {
  sort(sort: Record<string, 1 | -1>): Query<T>
  skip(amount: number): Query<T>
  limit(amount: number): Query<T>
  lean(): Query<T>
  select(fields: string): Query<T>
  session(transaction?: Transaction | null): Query<T>
}
type CompatibleModel<T extends object> = Omit<ModelStatic<RawInstance>, 'findOne' | 'create' | 'count' | 'exists'> & {
  find(filter?: Data): Query<SqlEntity<T>[]>
  findOne(filter?: Data): Query<SqlEntity<T> | null>
  findById(id: string): Query<SqlEntity<T> | null>
  create(values: Partial<T>, options?: QueryOptions): Promise<SqlEntity<T>>
  findByIdAndUpdate(id: string, update: Data, options?: QueryOptions): Promise<SqlEntity<T> | null>
  findOneAndUpdate(filter: Data, update: Data, options?: QueryOptions): Promise<SqlEntity<T> | null>
  updateMany(filter: Data, update: Data, options?: QueryOptions): Promise<[number]>
  deleteOne(filter: Data, options?: QueryOptions): Promise<number>
  deleteMany(filter: Data, options?: QueryOptions): Promise<number>
  count(filter?: Data): Promise<number>
  countDocuments(filter?: Data): Promise<number>
  exists(filter?: Data): Query<SqlEntity<T> | null>
}

function mapWhere(where: Data): WhereOptions<RawAttributes> {
  const result: Data = {}

  for (const [field, condition] of Object.entries(where)) {
    if (field === '$or' && Array.isArray(condition)) {
      result[Op.or] = condition.map(entry => mapWhere(entry as Data))
      continue
    }

    if (field === '$and' && Array.isArray(condition)) {
      result[Op.and] = condition.map(entry => mapWhere(entry as Data))
      continue
    }

    if (condition instanceof RegExp) {
      result[field] = { [Op.regexp]: condition.source }
      continue
    }

    if (condition && typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof Date)) {
      const operators: Data = {}
      for (const [operator, value] of Object.entries(condition)) {
        const mapped = {
          $in: Op.in,
          $nin: Op.notIn,
          $ne: Op.ne,
          $gt: Op.gt,
          $gte: Op.gte,
          $lt: Op.lt,
          $lte: Op.lte
        }[operator]
        operators[mapped || operator] = value
      }
      result[field] = operators
    } else {
      result[field] = condition
    }
  }

  return result as WhereOptions<RawAttributes>
}

function normalizeUpdate(update: Data): Data {
  const result: Data = {}
  for (const [key, value] of Object.entries(update)) {
    if (key.startsWith('$') && value && typeof value === 'object') {
      Object.assign(result, value)
    } else {
      result[key] = value
    }
  }
  return result
}

class SqlQuery<T extends object, Result> implements Query<Result> {
  private order?: FindOptions<RawAttributes>['order']
  private offset?: number
  private rowLimit?: number
  private attributes?: FindOptions<RawAttributes>['attributes']
  private transaction?: Transaction

  constructor(
    private readonly run: (options: FindOptions<RawAttributes>) => Promise<Result>,
    private readonly filter: Data
  ) {}

  sort(sort: Record<string, 1 | -1>): this {
    this.order = Object.entries(sort).map(([field, direction]) => [field, direction === 1 ? 'ASC' : 'DESC'])
    return this
  }

  skip(amount: number): this {
    this.offset = amount
    return this
  }

  limit(amount: number): this {
    this.rowLimit = amount
    return this
  }

  lean(): this {
    return this
  }

  select(fields: string): this {
    const selections = fields.split(/\s+/).filter(Boolean)
    const included = selections.filter(field => !field.startsWith('-'))
    const excluded = selections.filter(field => field.startsWith('-')).map(field => field.slice(1))
    this.attributes = included.length > 0
      ? included
      : excluded.length > 0
        ? { exclude: excluded }
        : undefined
    return this
  }

  session(transaction?: Transaction | null): this {
    this.transaction = transaction || undefined
    return this
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.run({
      where: mapWhere(this.filter),
      order: this.order,
      offset: this.offset,
      limit: this.rowLimit,
      attributes: this.attributes,
      transaction: this.transaction
    }).then(onfulfilled, onrejected)
  }
}

export function defineSqlModel<T extends object>(
  modelName: string,
  attributes: Record<string, AttributeOptions>,
  options: {
    tableName: string
    timestamps?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    indexes?: Array<{ fields: string[]; unique?: boolean }>
  },
  methods?: Partial<T>
): CompatibleModel<T> {
  const model = sequelize.define<RawInstance, RawAttributes>(modelName, {
    _id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ...attributes
  }, {
    ...options,
    freezeTableName: true
  })
  Object.assign(model.prototype, methods)

  const findOne = model.findOne.bind(model)
  const findAll = model.findAll.bind(model)
  const create = model.create.bind(model)
  const compatible = model as unknown as CompatibleModel<T>

  compatible.find = filter => new SqlQuery(
    async options => await findAll(options) as SqlEntity<T>[],
    filter || {}
  )
  compatible.findOne = filter => new SqlQuery(
    async options => await findOne(options) as SqlEntity<T> | null,
    filter || {}
  )
  compatible.exists = filter => compatible.findOne(filter)
  compatible.findById = id => compatible.findOne({ _id: id })
  compatible.create = async (values, queryOptions = {}) =>
    await create(Object.fromEntries(Object.entries(values)), {
      transaction: queryOptions.transaction
    }) as SqlEntity<T>
  compatible.findByIdAndUpdate = (id, update, queryOptions = {}) =>
    compatible.findOneAndUpdate({ _id: id }, update, queryOptions)
  compatible.findOneAndUpdate = async (filter, update, queryOptions = {}) => {
    let row = await findOne({
      where: mapWhere(filter),
      transaction: queryOptions.transaction
    }) as SqlEntity<T> | null
    if (!row && queryOptions.upsert) {
      const values = Object.fromEntries(Object.entries({ ...filter, ...normalizeUpdate(update) }))
      row = await create(values, { transaction: queryOptions.transaction }) as SqlEntity<T>
      return row
    }
    if (!row) return null
    await row.update(Object.fromEntries(Object.entries(normalizeUpdate(update))), {
      transaction: queryOptions.transaction
    })
    return row
  }
  compatible.updateMany = async (filter, update, queryOptions = {}) => {
    const [count] = await model.update(normalizeUpdate(update) as Partial<T>, {
      where: mapWhere(filter),
      transaction: queryOptions.transaction
    })
    return [count]
  }
  compatible.deleteOne = async (filter, queryOptions = {}) => {
    const row = await findOne({
      where: mapWhere(filter),
      transaction: queryOptions.transaction
    }) as SqlEntity<T> | null
    return row ? row.destroy({ transaction: queryOptions.transaction }).then(() => 1) : 0
  }
  compatible.deleteMany = async (filter, queryOptions = {}) =>
    model.destroy({
      where: mapWhere<T>(filter),
      transaction: queryOptions.transaction
    })
  compatible.count = async filter => {
    const count = await model.count({ where: mapWhere(filter || {}) })
    return typeof count === 'number' ? count : count.length
  }
  compatible.countDocuments = compatible.count

  return compatible
}

export const sqlTypes = DataTypes
