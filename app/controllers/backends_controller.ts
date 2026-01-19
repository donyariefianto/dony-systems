import type { HttpContext } from '@adonisjs/core/http'
import { database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'
import fs from 'fs'
import { EncryptionService } from '#services/encryption_service'

export default class BackendsController {
 async patchMenu({ response, request }: HttpContext) {
  let body = request.all()
  const collections = database.data?.collection('menu_systems')
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
 async listMenu({ response, request }: HttpContext) {
  let { example } = request.all()
  if (example === 'true') {
   let data = fs.readFileSync('public/menu.json', { encoding: 'utf-8' })
   return response.send(data)
  }
  try {
   const collections = database.data?.collection('menu_systems')
   let data = await collections?.findOne({})
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
 async dashboardSnapshots({ response }: HttpContext) {
  return response.send({})
 }
 async settingsGeneral({ response }: HttpContext) {
  const settings = {
   app_name: 'TB Sahabat System',
   timezone: 'Asia/Jakarta',
   shop_name: 'TB Sahabat Jaya',
   shop_phone: '081234567890',
   shop_address: 'Jl. Raya Utama No. 123, Malang, Jawa Timur',
   maintenance_mode: false,
   email_notification: true,
   session_timeout: 120,
   logo_url: '/uploads/logo-sahabat.png',
   updated_at: '2023-10-27T10:00:00Z',
  }
  return response.send(settings)
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
  const sort:any = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { updated_at: -1 }

  let data = await collections?.find(query).skip(skip).limit(Number(limit)).sort(sort).toArray()
  const total:any = await collections?.countDocuments(query)
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
   const updateData:any = { ...body, updated_at: new Date() }
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
 async login({ request, response }: HttpContext) {
  const { username, password } = request.all()
  return response.send({ token: `token`, user: { username, role: 'admin' } })
 }
}
