import type { HttpContext } from '@adonisjs/core/http'
import { collections, database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'

export default class BackendsController {
 async menu() {
  return {
   name: 'struktur_menu_tbsahabat',
   daftar_sidemenu: [
    {
     id: '1',
     name: 'Dashboard',
     icon: 'fas fa-home',
     daftar_sub_sidemenu: [
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
    {
     id: '2',
     name: 'Stock BBU',
     icon: 'fas fa-boxes',
     permissions: ['admin', 'warehouse'],
     daftar_sub_sidemenu: [
      {
       id: '2.1',
       name: 'Tobbacco',
       icon: 'fas fa-leaf',
       type: 'tableview',
       path: 'tobacco',
       permissions: ['admin', 'warehouse'],
       config: {
        endpoint: '/api/collections/tobacco',
        collectionName: 'tobacco',
        fields: [
         {
          name: 'name',
          label: 'Nama Tembakau',
          type: 'select',
          required: true,
          minLength: 3,
          maxLength: 100,
          placeholder: 'Masukkan nama tembakau',
          searchable: true,
          options: ['A', 'B', 'C'],
          default: 'A',
         },
         {
          name: 'grade',
          label: 'Grade',
          type: 'select',
          required: true,
          options: ['A', 'B', 'C', 'Special'],
          default: 'A',
         },
         {
          name: 'stock',
          label: 'Stok (kg)',
          type: 'number',
          required: true,
          min: 0,
          step: 0.5,
          validation: 'positive',
         },
         {
          name: 'price_per_kg',
          label: 'Harga per Kg (Rp)',
          type: 'number',
          required: true,
          min: 0,
          format: 'currency',
         },
         {
          name: 'supplier',
          label: 'Supplier',
          type: 'text',
          required: false,
          searchable: true,
         },
         {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: ['In', 'Out', 'Pending'],
          default: 'Pending',
         },
         {
          name: 'notes',
          label: 'Catatan',
          type: 'textarea',
          required: false,
          rows: 3,
         },
        ],
        tableConfig: {
         defaultSort: { field: 'createdAt', order: 'desc' },
         pageSize: 20,
         exportable: true,
        },
        operations: {
         create: true,
         read: true,
         update: true,
         delete: true,
         import: true,
         export: true,
        },
       },
      },
      {
       id: '2.2',
       name: 'Clove',
       icon: 'fas fa-seedling',
       type: 'tableview',
       path: 'clove',
       config: {
        endpoint: '/api/collections/clove',
        collectionName: 'clove',
        fields: [
         {
          name: 'name',
          label: 'Nama Cengkeh',
          type: 'text',
          required: true,
         },
         {
          name: 'quantity',
          label: 'Kuantitas (kg)',
          type: 'number',
          required: true,
         },
         {
          name: 'origin',
          label: 'Asal',
          type: 'select',
          options: ['Bali', 'Sulawesi', 'Sumatera', 'Jawa'],
          required: true,
         },
        ],
        operations: {
         create: true,
         read: true,
         update: true,
         delete: false,
        },
       },
      },
      {
       id: '2.3',
       name: 'Casing',
       icon: 'fas fa-flask',
       type: 'tableview',
       path: 'casing',
       config: {
        endpoint: '/api/collections/casing',
        collectionName: 'casing',
        fields: [
         {
          name: 'name',
          label: 'Nama Casing',
          type: 'text',
          required: true,
         },
         {
          name: 'volume',
          label: 'Volume (L)',
          type: 'number',
          required: true,
         },
        ],
       },
      },
      {
       id: '2.4',
       name: 'Flavour',
       icon: 'fas fa-wine-bottle',
       type: 'tableview',
       path: 'flavour',
       config: {
        endpoint: '/api/collections/flavour',
        collectionName: 'flavour',
        fields: [
         {
          name: 'name',
          label: 'Nama Flavour',
          type: 'text',
          required: true,
         },
         {
          name: 'type',
          label: 'Jenis',
          type: 'select',
          options: ['Natural', 'Artificial', 'Mixed'],
         },
        ],
       },
      },
     ],
    },
    {
     id: '3',
     name: 'Stock BBP',
     icon: 'fas fa-pallet',
     daftar_sub_sidemenu: [
      {
       id: '3.1',
       name: 'NTM',
       icon: 'fas fa-cubes',
       type: 'tableview',
       path: 'ntm',
       config: {
        endpoint: '/api/collections/ntm',
        collectionName: 'ntm',
        fields: [
         {
          name: 'code',
          label: 'Kode NTM',
          type: 'text',
          required: true,
          unique: true,
         },
         {
          name: 'description',
          label: 'Deskripsi',
          type: 'textarea',
         },
        ],
       },
      },
      {
       id: '3.2',
       name: 'Stock',
       icon: 'fas fa-boxes-stacked',
       type: 'cardview',
       path: 'bbp-stock',
       config: {
        endpoint: '/api/collections/bbp-stock',
        collectionName: 'bbp_stock',
        viewType: 'card',
        cardsPerRow: 3,
       },
      },
     ],
    },
    {
     id: '4',
     name: 'Payroll',
     icon: 'fas fa-money-bill-wave',
     daftar_sub_sidemenu: [
      {
       id: '4.1',
       name: 'Employee',
       icon: 'fas fa-users',
       type: 'tableview',
       path: 'employees',
       config: {
        endpoint: '/api/collections/employees',
        collectionName: 'employees',
        fields: [
         {
          name: 'employee_id',
          label: 'ID Karyawan',
          type: 'text',
          required: true,
          unique: true,
         },
         {
          name: 'name',
          label: 'Nama Lengkap',
          type: 'text',
          required: true,
         },
         {
          name: 'position',
          label: 'Jabatan',
          type: 'select',
          options: ['Staff', 'Supervisor', 'Manager', 'Director'],
          required: true,
         },
         {
          name: 'department',
          label: 'Departemen',
          type: 'text',
          required: true,
         },
         {
          name: 'salary',
          label: 'Gaji Pokok',
          type: 'number',
          required: true,
          format: 'currency',
         },
        ],
       },
      },
      {
       id: '4.2',
       name: 'Salary',
       icon: 'fas fa-money-check',
       type: 'tableview',
       path: 'salaries',
       config: {
        endpoint: '/api/collections/salaries',
        collectionName: 'salaries',
        fields: [
         {
          name: 'employee_id',
          label: 'ID Karyawan',
          type: 'text',
          required: true,
         },
         {
          name: 'month',
          label: 'Bulan',
          type: 'month',
          required: true,
         },
         {
          name: 'total_salary',
          label: 'Total Gaji',
          type: 'number',
          required: true,
         },
        ],
       },
      },
     ],
    },
    {
     id: '5',
     name: 'Task',
     icon: 'fas fa-tasks',
     daftar_sub_sidemenu: [
      {
       id: '5.1',
       name: 'Task List',
       icon: 'fas fa-list-check',
       type: 'tableview',
       path: 'tasks',
       config: {
        endpoint: '/api/collections/tasks',
        collectionName: 'tasks',
        fields: [
         {
          name: 'title',
          label: 'Judul Task',
          type: 'select',
          options: ['Gunting', 'Giling'],
          required: true,
         },
         {
          name: 'description',
          label: 'Deskripsi',
          type: 'textarea',
         },
         {
          name: 'priority',
          label: 'Prioritas',
          type: 'select',
          options: ['Low', 'Medium', 'High', 'Urgent'],
          default: 'Medium',
         },
         {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
          default: 'Pending',
         },
         {
          name: 'due_date',
          label: 'Tanggal Jatuh Tempo',
          type: 'date',
         },
        ],
       },
      },
      {
       id: '5.2',
       name: 'Reject Task',
       icon: 'fas fa-ban',
       type: 'tableview',
       path: 'rejected-tasks',
       config: {
        endpoint: '/api/collections/rejected-tasks',
        collectionName: 'rejected_tasks',
       },
      },
      {
       id: '5.3',
       name: 'Daily Report',
       icon: 'fas fa-chart-column',
       type: 'chartview',
       path: 'task-reports',
       config: {
        endpoint: '/api/dashboard/task-reports',
        charts: ['completion_rate', 'task_distribution'],
       },
      },
     ],
    },
    {
     id: '6',
     name: 'Assets',
     icon: 'fas fa-building',
     daftar_sub_sidemenu: [
      {
       id: '6.1',
       name: 'Assets',
       icon: 'fas fa-server',
       type: 'tableview',
       path: 'assets',
       config: {
        endpoint: '/api/collections/assets',
        collectionName: 'assets',
        fields: [
         {
          name: 'asset_code',
          label: 'Kode Asset',
          type: 'text',
          required: true,
          unique: true,
         },
         {
          name: 'name',
          label: 'Nama Asset',
          type: 'text',
          required: true,
         },
         {
          name: 'category',
          label: 'Kategori',
          type: 'select',
          options: ['Hardware', 'Software', 'Furniture', 'Vehicle'],
         },
        ],
       },
      },
     ],
    },
    {
     id: '7',
     name: 'Penjualan',
     icon: 'fas fa-chart-line',
     daftar_sub_sidemenu: [
      {
       id: '7.1',
       name: 'Product',
       icon: 'fas fa-box-open',
       type: 'tableview',
       path: 'products',
       config: {
        endpoint: '/api/collections/products',
        collectionName: 'products',
        fields: [
         {
          name: 'product_code',
          label: 'Kode Produk',
          type: 'text',
          required: true,
          unique: true,
         },
         {
          name: 'name',
          label: 'Nama Produk',
          type: 'text',
          required: true,
         },
         {
          name: 'price',
          label: 'Harga',
          type: 'number',
          required: true,
         },
         {
          name: 'stock',
          label: 'Stok',
          type: 'number',
          required: true,
         },
        ],
       },
      },
      {
       id: '7.2',
       name: 'Daily Report',
       icon: 'fas fa-chart-pie',
       type: 'chartview',
       path: 'sales-reports',
       config: {
        endpoint: '/api/dashboard/sales-reports',
        charts: ['sales_trend', 'product_performance'],
       },
      },
     ],
    },
    {
     id: '8',
     name: 'Settings',
     icon: 'fas fa-cogs',
     permissions: ['admin'],
     daftar_sub_sidemenu: [
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
       name: 'Role & Permissions',
       icon: 'fas fa-user-shield',
       type: 'tableview',
       path: 'settings/roles',
       config: {
        endpoint: '/api/collections/roles',
        collectionName: 'roles',
        fields: [
         {
          name: 'role_name',
          label: 'Nama Role',
          type: 'text',
          required: true,
         },
         {
          name: 'access_level',
          label: 'Level Akses',
          type: 'number',
          required: true,
         },
         {
          name: 'permissions',
          label: 'Izin Akses',
          type: 'multiselect',
          options: ['read_dashboard', 'write_stock', 'manage_users', 'view_reports'],
         },
        ],
       },
      },
      {
       id: '8.3',
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
      {
       id: '8.4',
       name: 'Audit Logs',
       icon: 'fas fa-history',
       type: 'tableview',
       path: 'settings/logs',
       config: {
        endpoint: '/api/logs/system',
        collectionName: 'system_logs',
        fields: [
         {
          name: 'timestamp',
          label: 'Waktu',
          type: 'datetime',
         },
         {
          name: 'user',
          label: 'User',
          type: 'text',
         },
         {
          name: 'action',
          label: 'Aktivitas',
          type: 'text',
         },
         {
          name: 'ip_address',
          label: 'IP Address',
          type: 'text',
         },
        ],
        operations: {
         create: false,
         read: true,
         update: false,
         delete: false,
         export: true,
        },
       },
      },
     ],
    },
   ],
  }
 }
 async dashboardStats({ response }: HttpContext) {
  const stats = {
  "success": true,
  "data": {
    "widgets": [
      {
        "type": "stat",
        "title": "Total Penjualan Hari Ini",
        "value": "Rp 4.500.000",
        "width": "small"
      },
      {
        "type": "chart",
        "chartType": "line",
        "title": "Tren Transaksi",
        "width": "half",
        "chartData": {
          "labels": ["08:00", "12:00", "16:00", "20:00"],
          "datasets": [{ "data": [10, 45, 30, 60], "borderColor": "#2563eb" }]
        }
      }
    ]
  }
}
  return response.send(stats)
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
  const { page = 1, limit = 10, sortField, sortOrder, search } = request.all()
  const collections = database.data?.collection(colName)
  let query: any = {}
  if (search) {
   query = { $text: { $search: search } }
  }
  const skip = (page - 1) * limit
  const sort = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { updated_at: -1 }
  let data = await collections?.find(query).skip(skip).limit(Number(limit)).sort(sort).toArray()
  const total = await collections?.countDocuments(query)
  return response.send({ data, total, page, totalPages: Math.ceil(total / limit) })
 }
 async getCollectionDataDetail({ params, request, response }: HttpContext) {
  const colName = params.col
  const id = params.id

  const payload = { created_at: new Date(), updated_at: new Date(), deleted_at: null }
  const collections = database.data?.collection(colName)
  const result = await collections?.findOne({ _id: new ObjectId(id) })
  return response.send(result)
 }
 async createCollectionData({ params, request, response }: HttpContext) {
  const colName = params.col
  let body = request.all()
  try {
   const payload = { ...body, created_at: new Date(), updated_at: new Date(), deleted_at: null }
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
   const updateData = { ...body, updated_at: new Date() }
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
