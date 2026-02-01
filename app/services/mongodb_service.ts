import { MongoClient, ServerApiVersion, Collection, Db } from 'mongodb'
import { MongoDBConfig } from '#config/mongodb'

export const collections: { data?: Collection } = {}
export const database: { data?: Db } = {}
export class MongoDB {
 protected connectiondb: ConnectionDB
 constructor(config: typeof MongoDBConfig) {
  this.connectiondb = new ConnectionDB(config)
 }

 public async connectMongoDbCollection() {
  const config = this.connectiondb
  const url = `mongodb+srv://${config['host']}`
  const client = new MongoClient(url)
  await client.connect()
  const db = client.db('dony')
  collections.data = db.collection('user')
 }

 public async connectMongoDB() {
  const config = this.connectiondb
  const url = `${config['host']}`
  const db_name = `${config['db']}`
  const client = new MongoClient(url)
  await client.connect()
  database.data = client.db(db_name)
  console.log('✅ Successfully connected to MongoDb')
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
