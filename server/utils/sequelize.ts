import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'controle_depense',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)
