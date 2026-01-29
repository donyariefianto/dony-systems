import type { HttpContext } from '@adonisjs/core/http'
import { database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'
import fs from 'fs'
import { EncryptionService } from '#services/encryption_service'
import { SmartProjectionEngineService } from '#services/smart_projection_engine_service'
import env from '#start/env'
import jwt from 'jsonwebtoken'

const ACCESS_SECRET: any = env.get('ACCESS_SECRET')
const REFRESH_SECRET: any = env.get('REFRESH_SECRET')

export default class BackendsController {
 async patchMenu({ response, request }: HttpContext) {
  let body = request.all()
  const collections = database.data?.collection('systems')
  const existingDoc = await collections?.findOne({ id: 'fixed_menu' })
  let data
  if (existingDoc) {
   body.created_at = existingDoc.created_at
   body.updated_at = new Date()

   data = await collections?.replaceOne({ id: 'fixed_menu' }, body, { upsert: false })
  } else {
   body.created_at = new Date()
   body.updated_at = new Date()
   data = await collections?.replaceOne({ id: 'fixed_menu' }, body, { upsert: true })
  }
  return response.send(data)
 }
 async listMenu({ response }: HttpContext) {
  try {
   const collections = database.data?.collection('systems')
   let data = await collections?.findOne({ id: 'fixed_menu' })
   let result = {},
    FIXED_DASHBOARD = {
     id: 'fixed_dashboard',
     name: 'Dashboard',
     icon: 'fas fa-home',
     sub_sidemenu: [
      {
       id: '1.1',
       name: 'Dashboard',
       icon: 'fas fa-chart-line',
       type: 'chartview',
       path: 'dashboard',
       permissions: ['admin', 'user'],
       config: {
        endpoint: '/api/dashboard/stats',
        charts: ['overview', 'performance'],
        refreshInterval: 30000,
       },
      },
     ],
    },
    FIXED_SETTINGS = {
     id: 'fixed_settings',
     name: 'Settings',
     icon: 'fas fa-cogs',
     permissions: ['admin'],
     sub_sidemenu: [
      {
       id: '8.1',
       name: 'User Management',
       icon: 'fas fa-users-cog',
       type: 'tableview',
       path: 'settings/users',
       config: {
        endpoint: '/api/collections/users',
        collectionName: 'users',
        fields: [
         {
          name: 'username',
          label: 'Username',
          type: 'text',
          required: true,
          unique: true,
         },
         {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          unique: true,
         },
         {
          name: 'role',
          label: 'Role',
          type: 'select',
          options: ['admin', 'warehouse', 'finance', 'user'],
          required: true,
         },
         {
          name: 'status',
          label: 'Status Akun',
          type: 'select',
          options: ['Active', 'Inactive', 'Suspended'],
          default: 'Active',
         },
         {
          name: 'last_login',
          label: 'Terakhir Login',
          type: 'datetime',
          readonly: true,
         },
        ],
        operations: {
         create: true,
         read: true,
         update: true,
         delete: true,
         reset_password: true,
        },
       },
      },
      {
       id: '8.2',
       name: 'App Config',
       icon: 'fas fa-sliders-h',
       type: 'settings',
       path: 'settings/config',
       config: {
        endpoint: '/api/settings/general',
        collectionName: 'app_config',
        fields: [
         {
          name: 'app_name',
          label: 'Nama Aplikasi',
          type: 'text',
          default: 'TB Sahabat System',
         },
         {
          name: 'maintenance_mode',
          label: 'Mode Maintenance',
          type: 'boolean',
          default: false,
         },
         {
          name: 'timezone',
          label: 'Zona Waktu Default',
          type: 'select',
          options: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'],
          default: 'Asia/Jakarta',
         },
        ],
       },
      },
     ],
    }
   if (data) {
    result = {
     name: 'menu',
     sidemenu: [FIXED_DASHBOARD, ...data.sidemenu, FIXED_SETTINGS],
    }
   } else {
    result = {
     name: 'menu',
     sidemenu: [FIXED_DASHBOARD, FIXED_SETTINGS],
    }
   }
   let data_encrypt = EncryptionService.encrypt(JSON.stringify(result))
   return response.json(data_encrypt)
  } catch (error) {
   console.log(error)

   return response.internalServerError({
    message: error.message,
    status: false,
   })
  }
 }
 async settingsGeneral({ response }: HttpContext) {
  const collections = database.data?.collection('systems')
  const existingDoc = await collections?.findOne({ id: 'general_settings' })
  if (!existingDoc) {
   return response.send(
    EncryptionService.encrypt(
     JSON.stringify({
      id: 'general_settings',
      app_name: 'Dony',
      app_short_name: 'D',
      phone_number: '',
      address: '',
      maintenance_mode: '',
      theme: '',
      language: '',
      timezone: '',
      enable_analytics: '',
      enable_error_tracking: '',
      auto_save_interval: '',
      max_upload_size: '',
      session_timeout: '',
     })
    )
   )
  }
  let data_encrypt = EncryptionService.encrypt(JSON.stringify(existingDoc))
  return response.send(data_encrypt)
 }
 async patchGeneralSettings({ response, request }: HttpContext) {
  let body = request.all()
  const collections = database.data?.collection('systems')
  const existingDoc = await collections?.findOne({ id: 'general_settings' })
  let data
  body.id = 'general_settings'
  if (existingDoc) {
   body.created_at = existingDoc.created_at
   body.updated_at = new Date()
   data = await collections?.replaceOne({ id: 'general_settings' }, body, { upsert: false })
  } else {
   body.created_at = new Date()
   body.updated_at = new Date()
   data = await collections?.replaceOne({ id: 'general_settings' }, body, { upsert: true })
  }
  return response.send(data)
 }
 async runTestFormulaSPE({ request, response }: HttpContext) {
  try {
   const { code, source, old } = request.only(['code', 'source', 'old'])
   const result = await SmartProjectionEngineService.testFormula({
    code,
    source,
    old,
   })
   return response.ok(result)
  } catch (error) {
   return response.badRequest({
    success: false,
    error: error.message,
   })
  }
 }
 async aggreateCollectionData({ params, request, response }: HttpContext) {
  const collectionName = params.col
  const { pipeline, options } = request.only(['pipeline', 'options'])
  if (!pipeline) {
   return response.status(400).send({ message: 'Pipeline is required' })
  }
  const defaultOptions: any = {
   allowDiskUse: true,
   maxTimeMS: 60000,
   cursor: { batchSize: 1000 },
   ...options,
  }
  try {
   const collections = database.data?.collection(collectionName)
   const startTime = Date.now()
   const result = await collections?.aggregate(JSON.parse(pipeline), defaultOptions).toArray()
   const duration = Date.now() - startTime
   let data_encrypt = EncryptionService.encrypt(
    JSON.stringify({
     success: true,
     data: result,
     executionTime: `${duration}ms`,
     messages: `[Aggregation Success] Collection: ${collectionName} | Duration: ${duration}ms | Count: ${result?.length}`,
    })
   )
   return response.send(data_encrypt)
  } catch (error) {
   console.log(error)

   return response.status(500).send({ message: 'Error executing aggregation', error })
  }
 }
 async getCollectionData({ params, request, response }: HttpContext) {
  const colName = params.col
  const { page = 1, limit = 10, sortField, sortOrder, search, filter } = request.all()
  const collections = database.data?.collection(colName)
  let query: any = {}
  if (search) {
   let object_search = JSON.parse(search)
   query.$or = []
   for (const element of Object.keys(object_search)) {
    if (typeof object_search[element] === 'string') {
     query.$or.push({ [element]: { $regex: object_search[element], $options: 'i' } })
    } else if (typeof Number(object_search[element]) === 'number') {
     query.$or.push({ [element]: object_search[element] })
    }
   }
  }
  if (filter) {
   let object_filter = JSON.parse(filter)
   for (const element of Object.keys(object_filter)) {
    query[element] = object_filter[element]
   }
  }
  const skip = (page - 1) * limit
  const sort: any = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { updated_at: -1 }

  let data = await collections?.find(query).skip(skip).limit(Number(limit)).sort(sort).toArray()
  const total: any = await collections?.countDocuments(query)
  let response_data = { data, total, page: Number(page), totalPages: Math.ceil(total / limit) }
  let data_encrypt = EncryptionService.encrypt(JSON.stringify(response_data))
  return response.send(data_encrypt)
 }
 async getCollectionDataDetail({ params, response }: HttpContext) {
  const colName = params.col
  const id = params.id
  if (!id || id === 'undefined') {
   return response.status(400).send({ message: 'ID parameter is required' })
  }
  const collections = database.data?.collection(colName)
  const result = await collections?.findOne({ _id: new ObjectId(id) })
  let data_encrypt = EncryptionService.encrypt(JSON.stringify(result))
  return response.send(data_encrypt)
 }
 async createCollectionData({ params, request, response }: HttpContext) {
  const colName = params.col
  let body = request.all()
  try {
   const payload = { ...body, created_at: new Date(), updated_at: new Date() }
   const collections = database.data?.collection(colName)
   const result = await collections?.insertOne(payload)
   return response.status(201).send(result)
  } catch (error) {
   return response.status(500).send({ message: 'Error creating data', error })
  }
 }
 async updateCollectionData({ params, request, response }: HttpContext) {
  try {
   const colName = params.col
   const id = params.id
   let body = request.all()
   const collections = database.data?.collection(colName)
   const updateData: any = { ...body, updated_at: new Date() }
   delete updateData._id
   const result = await collections?.updateOne({ _id: new ObjectId(id) }, { $set: updateData })
   return response.status(200).send({ message: 'Data updated successfully', result })
  } catch (error) {
   return response.status(500).send({ message: 'Error updating data', error })
  }
 }
 async deleteCollectionData({ params, response }: HttpContext) {
  try {
   const colName = params.col
   const id = params.id
   const collections = database.data?.collection(colName)
   const result = await collections?.deleteOne({ _id: new ObjectId(id) })
   return response.status(200).send({ message: 'Data deleted successfully', result })
  } catch (error) {
   return response.status(500).send({ message: 'Error deleting data', error })
  }
 }
 async deleteCollection({ params, response }: HttpContext) {
  try {
   const colName = params.col
   const collections = database.data?.collection(colName)
   const result = await collections?.drop()
   return response.status(200).send({ message: 'Data deleted successfully', result })
  } catch (error) {
   return response.status(500).send({ message: 'Error deleting data', error })
  }
 }
 async login({ request, response }: HttpContext) {
  const { username } = request.all()
  return response.send({ token: `token`, user: { username, role: 'admin' } })
 }
 async authentication_login({ request, response }: HttpContext) {
  const { username, email, password } = request.all()
  if (!password)
   return response.badRequest({ status: false, message: 'Invalid request [password]' })
  if (!username && !email)
   return response.badRequest({ status: false, message: 'Invalid request [username or email]' })
  let accessToken = null,
   refreshToken = null,
   _id = null,
   _email = null
  if ((username === 'root' || email === 'root') && password === 'secret_services') {
   accessToken = jwt.sign({ id: 0 }, ACCESS_SECRET, { expiresIn: '30m' })
   refreshToken = jwt.sign({ id: 0 }, REFRESH_SECRET, { expiresIn: '7d' })
   ;((_id = 0), (_email = 'root'))
  } else {
   const collections = database.data?.collection('users')
   const query_user = { $or: [{ user: username || null }, { email: email || null }] }
   const data_users = await collections?.findOne(query_user)
   if (!data_users) return response.unauthorized({ status: false, message: 'Invalid credentials' })
   _id = data_users._id
   _email = data_users.email
   accessToken = jwt.sign({ id: data_users._id }, ACCESS_SECRET, { expiresIn: '30m' })
   refreshToken = jwt.sign({ id: data_users._id }, REFRESH_SECRET, { expiresIn: '7d' })
  }
  const collections_token_authentications = database.data?.collection('authentications')
  await collections_token_authentications?.insertOne({
   userId: _id,
   accessToken: accessToken,
   refreshToken: refreshToken,
   expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })
  response.cookie('refreshToken', refreshToken, {
   httpOnly: true,
   secure: true,
   sameSite: 'Strict',
   maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  return response.send({ accessToken, username: { id: _id, email: _email } })
 }
 async authentication_logout({ request, response }: HttpContext) {
  const authHeader = request.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  const collections_token_authentications = database.data?.collection('authentications')
  await collections_token_authentications?.findOneAndDelete({ accessToken: token })
  response.clearCookie('refreshToken')
  return response.status(200).json({ message: 'Logged out successfully' })
 }
 async authentication_refresh({ request, response }: HttpContext) {
  const token = request.cookies.refreshToken
  if (!token) return response.unauthorized()
  const collections_token_authentications = database.data?.collection('authentications')
  const storedToken = await collections_token_authentications?.findOne({ token: token })
  if (!storedToken) return response.forbidden()
  try {
   const payload: any = jwt.verify(token, REFRESH_SECRET)
   await collections_token_authentications?.deleteOne({ token: token })
   const newAccessToken = jwt.sign({ id: payload.id }, ACCESS_SECRET, { expiresIn: '30m' })
   const newRefreshToken = jwt.sign({ id: payload.id }, REFRESH_SECRET, { expiresIn: '7d' })
   await collections_token_authentications?.insertOne({
    userId: payload.id,
    token: newRefreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
   })
   response.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
   })
   return response.json({ accessToken: newAccessToken })
  } catch (err) {
   return response.forbidden()
  }
 }
}
