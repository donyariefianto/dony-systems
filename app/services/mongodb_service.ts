import { MongoClient, ServerApiVersion, Collection, Db } from 'mongodb'
import { MongoDBConfig } from '#config/mongodb'

export const collections: { data?: Collection } = {}
export const database: { data?: Db } = {}
export const client: { data?: any } = {}
export class MongoDB {
 protected connectiondb: ConnectionDB
 constructor(config: typeof MongoDBConfig) {
  this.connectiondb = new ConnectionDB(config)
 }

 public async connectMongoDB() {
  const config = this.connectiondb
  const url = `${config['host']}`
  const db_name = `${config['db']}`
  client.data = new MongoClient(url)
  await client.data.connect()
  database.data = client.data.db(db_name)
  console.log('✅ Successfully connected to MongoDb')
 }

 public async disconnectMongoDB() {
  await client.data.disconnect()
  console.log('✅ Successfully disconnected to MongoDb')
 }
}

class ConnectionDB {
 protected host: string
 protected db: string

 constructor(config: typeof MongoDBConfig) {
  this.host = config.host || ''
  this.db = config.db || ''
 }
}
