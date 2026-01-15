import type { HttpContext } from '@adonisjs/core/http'
import { database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'

export default class BackendsController {
 async menu() {
  return {
   name: 'struktur_menu',
   daftar_sidemenu: [
    {
     id: 'fixed_dashboard',
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
       name: 'Transaksi Baru',
       icon: 'fas fa-cash-register', // Icon mesin kasir
       type: 'tableview',
       path: 'sales/transactions',
       config: {
        endpoint: '/api/collections/transactions',
        collectionName: 'transactions', // Nama tabel di database untuk menyimpan transaksi
        fields: [
         // --- SECTION 1: INFO PRIBADI ---
         {
          name: 'full_name',
          label: 'Nama Lengkap',
          type: 'text',
          required: true,
         },
         {
          name: 'photo',
          label: 'Foto Profil',
          type: 'image', // Ada preview
         },
         {
          name: 'gender',
          label: 'Jenis Kelamin',
          type: 'radio', // Pilihan bulat
          options: [
           { value: 'M', label: 'Laki-laki' },
           { value: 'F', label: 'Perempuan' },
          ],
         },

         // --- SECTION 2: PEKERJAAN (RELASI & LOGIKA) ---
         {
          name: 'department_id',
          label: 'Departemen',
          type: 'relation', // Ambil dari tabel lain
          required: true,
          relation: {
           collection: 'departments',
           key: '_id',
           display: 'dept_name',
          },
         },
         {
          name: 'is_active',
          label: 'Status Karyawan Aktif',
          type: 'boolean', // Toggle Switch
          defaultValue: true,
         },
         {
          name: 'salary',
          label: 'Gaji Pokok',
          type: 'currency', // Format Rupiah
          required: true,
         },
         {
          name: 'join_date',
          label: 'Tanggal Bergabung',
          type: 'date',
         },

         // --- SECTION 3: DATA KOMPLEKS (REPEATER) ---
         {
          name: 'education_history',
          label: 'Riwayat Pendidikan',
          type: 'repeater', // Tabel input dinamis
          sub_fields: [
           { name: 'degree', label: 'Jenjang', type: 'select', options: ['SMA', 'S1', 'S2', 'S3'] },
           { name: 'school', label: 'Nama Sekolah/Kampus', type: 'text' },
           { name: 'year', label: 'Tahun Lulus', type: 'number' },
          ],
         },
         {
          name: 'documents',
          label: 'Berkas Pendukung',
          type: 'repeater', // Repeater untuk upload banyak file
          sub_fields: [
           { name: 'doc_name', label: 'Nama Dokumen', type: 'text' },
           { name: 'file_attachment', label: 'File Upload', type: 'file' },
          ],
         },
        ],
       },
      },
      {
       id: 'trx_pembelian_001',
       name: 'Transaksi Pembelian',
       icon: 'fas fa-shopping-cart',
       type: 'tableview',
       path: 'transactions/purchase',
       permissions: ['admin', 'staff'],
       config: {
        endpoint: '/api/collections/purchases',
        collectionName: 'purchases',
        fields: [
         {
          name: 'items',
          type: 'repeater',
          sub_fields: [
           {
            name: 'product_id',
            type: 'relation',
            relation: {
             collection: 'products',
             key: '_id',
             display: 'name',
             auto_populate: {
              price: 'unit_price',
              stock: 'qty_available',
             },
            },
           },
           { name: 'unit_price', type: 'currency', ui: { readonly: true } },
           { name: 'qty', type: 'number', defaultValue: 1 },
           {
            name: 'subtotal',
            type: 'currency',
            ui: { readonly: true },
            calculation: { operation: 'multiply', fields: ['qty', 'unit_price'] },
           },
          ],
         },
         {
          name: 'invoice_no',
          label: 'Nomor Faktur',
          type: 'text',
          required: true,
          unique: true,
          placeholder: 'INV/2024/XXX',
          width: '50',
         },
         {
          name: 'trx_date',
          label: 'Tanggal Transaksi',
          type: 'date',
          required: true,
          width: '50',
         },
         {
          name: 'supplier_id',
          label: 'Supplier',
          type: 'relation',
          required: true,
          width: '100',
          relation: {
           collection: 'suppliers',
           key: '_id',
           display: 'company_name',
          },
         },
         {
          name: 'items_detail',
          label: 'Keranjang Belanja',
          type: 'repeater',
          width: '100',
          required: true,
          sub_fields: [
           {
            name: 'product_name',
            label: 'Nama Produk',
            type: 'text',
           },
           {
            name: 'qty',
            label: 'Jumlah (Qty)',
            type: 'number',
           },
           {
            name: 'unit_price',
            label: 'Harga Satuan',
            type: 'currency',
           },
           {
            name: 'subtotal',
            label: 'Subtotal',
            type: 'currency',
           },
          ],
         },
         {
          name: 'grand_total',
          label: 'Total Akhir',
          type: 'currency',
          required: true,
          width: '50',
         },
         {
          name: 'payment_status',
          label: 'Status Pembayaran',
          type: 'select',
          options: ['Unpaid', 'Down Payment', 'Paid', 'Refunded'],
          width: '50',
         },
         {
          name: 'proof_of_payment',
          label: 'Bukti Transfer',
          type: 'image',
          width: '100',
         },
         {
          name: 'notes',
          label: 'Catatan Tambahan',
          type: 'textarea',
          required: false,
          width: '100',
         },
        ],
       },
      },
     ],
    },
    {
     id: 'fixed_settings',
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
 async menu_example({ response }: HttpContext) {
  return response.send({
   name: 'struktur_menu',
   daftar_sidemenu: [
    {
     id: 'fixed_dashboard',
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
     id: 'example',
     name: 'Example',
     icon: 'fas fa-home',
     daftar_sub_sidemenu: [
      {
       id: 'library_loans',
       name: 'Peminjaman Buku',
       icon: 'fas fa-book-reader',
       type: 'tableview',
       path: 'library/loans',
       config: {
        endpoint: '/api/collections/loans',
        collectionName: 'loans',
        fields: [
         {
          name: 'loan_code',
          label: 'Kode Peminjaman',
          type: 'text',
          required: true,
          unique: true,
          placeholder: 'LIB-2024-XXX',
          width: '33',
         },
         {
          name: 'member_id',
          label: 'Anggota Peminjam',
          type: 'relation',
          relation: {
           collection: 'members',
           key: '_id',
           display: 'member_name',
          },
          width: '33',
         },
         {
          name: 'due_date',
          label: 'Tanggal Kembali',
          type: 'date',
          required: true,
          width: '33',
         },
         {
          name: 'books_list',
          label: 'Buku yang Dipingjam',
          type: 'repeater',
          width: '100',
          sub_fields: [
           {
            name: 'book_id',
            label: 'Judul Buku',
            type: 'relation',
            relation: {
             collection: 'books',
             key: '_id',
             display: 'title',
             auto_populate: {
              isbn: 'isbn_code',
              author: 'author_name',
             },
            },
           },
           {
            name: 'isbn_code',
            label: 'ISBN',
            type: 'text',
            ui: {
             readonly: true,
            },
           },
           {
            name: 'author_name',
            label: 'Pengarang',
            type: 'text',
            ui: {
             readonly: true,
            },
           },
          ],
         },
         {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: ['Dipinjam', 'Dikembalikan', 'Terlambat', 'Hilang'],
          defaultValue: 'Dipinjam',
          width: '50',
         },
        ],
       },
      },
      {
       id: 'inventory_in',
       name: 'Barang Masuk',
       icon: 'fas fa-dolly',
       type: 'tableview',
       path: 'inventory/stock-in',
       config: {
        endpoint: '/api/collections/stock_movements',
        collectionName: 'stock_movements',
        fields: [
         {
          name: 'ref_code',
          label: 'No. Referensi / PO',
          type: 'text',
          required: true,
          width: '50',
         },
         {
          name: 'received_date',
          label: 'Tanggal Terima',
          type: 'date',
          required: true,
          width: '50',
         },
         {
          name: 'supplier_id',
          label: 'Supplier / Vendor',
          type: 'relation',
          relation: {
           collection: 'suppliers',
           key: '_id',
           display: 'company_name',
          },
          width: '100',
         },
         {
          name: 'items',
          label: 'Daftar Barang',
          type: 'repeater',
          sub_fields: [
           {
            name: 'item_id',
            label: 'Nama Barang',
            type: 'relation',
            relation: {
             collection: 'items',
             key: '_id',
             display: 'item_name',
             auto_populate: {
              unit: 'uom',
             },
            },
           },
           {
            name: 'uom',
            label: 'Satuan',
            type: 'text',
            ui: {
             readonly: true,
            },
           },
           {
            name: 'qty_in',
            label: 'Jumlah Masuk',
            type: 'number',
            required: true,
           },
           {
            name: 'condition',
            label: 'Kondisi',
            type: 'select',
            options: ['Baik', 'Rusak Ringan', 'Rusak Berat'],
            defaultValue: 'Baik',
           },
          ],
         },
         {
          name: 'notes',
          label: 'Keterangan',
          type: 'textarea',
          width: '100',
         },
        ],
       },
      },
      {
       id: 'hrd_employees',
       name: 'Data Karyawan',
       icon: 'fas fa-users',
       type: 'tableview',
       path: 'hr/employees',
       config: {
        endpoint: '/api/collections/employees',
        collectionName: 'employees',
        fields: [
         {
          name: 'nik',
          label: 'Nomor Induk (NIK)',
          type: 'text',
          required: true,
          unique: true,
          width: '50',
         },
         {
          name: 'full_name',
          label: 'Nama Lengkap',
          type: 'text',
          required: true,
          width: '50',
         },
         {
          name: 'division_id',
          label: 'Divisi / Departemen',
          type: 'relation',
          relation: {
           collection: 'divisions',
           key: '_id',
           display: 'div_name',
          },
          width: '50',
         },
         {
          name: 'position',
          label: 'Jabatan',
          type: 'text',
          width: '50',
         },
         {
          name: 'gender',
          label: 'Jenis Kelamin',
          type: 'radio',
          options: ['Laki-laki', 'Perempuan'],
          width: '50',
         },
         {
          name: 'is_active',
          label: 'Status Aktif',
          type: 'boolean',
          defaultValue: true,
          width: '50',
         },
         {
          name: 'photo_profile',
          label: 'Foto Profil',
          type: 'image',
          width: '50',
         },
         {
          name: 'document_cv',
          label: 'File CV (PDF)',
          type: 'file',
          width: '50',
         },
         {
          name: 'address',
          label: 'Alamat Domisili',
          type: 'textarea',
          width: '100',
         },
        ],
       },
      },
      {
       id: 'pos_transaction',
       name: 'Kasir (POS)',
       icon: 'fas fa-cash-register',
       type: 'tableview',
       path: 'sales/pos',
       config: {
        endpoint: '/api/collections/transactions',
        collectionName: 'transactions',
        fields: [
         {
          name: 'invoice_no',
          label: 'No. Invoice',
          type: 'text',
          required: true,
          unique: true,
          placeholder: 'INV-2024-XXXX',
          width: '50',
         },
         {
          name: 'trx_date',
          label: 'Tanggal',
          type: 'date',
          required: true,
          width: '50',
         },
         {
          name: 'customer_id',
          label: 'Pelanggan',
          type: 'relation',
          relation: {
           collection: 'customers',
           key: '_id',
           display: 'fullname',
          },
          width: '100',
         },
         {
          name: 'cart_items',
          label: 'Keranjang Belanja',
          type: 'repeater',
          width: '100',
          sub_fields: [
           {
            name: 'product_id',
            label: 'Produk',
            type: 'relation',
            relation: {
             collection: 'products',
             key: '_id',
             display: 'product_name',
             auto_populate: {
              sell_price: 'price',
              sku: 'product_code',
             },
            },
           },
           {
            name: 'product_code',
            label: 'SKU',
            type: 'text',
            ui: {
             readonly: true,
            },
           },
           {
            name: 'price',
            label: 'Harga',
            type: 'currency',
            ui: {
             readonly: true,
            },
           },
           {
            name: 'qty',
            label: 'Qty',
            type: 'number',
            defaultValue: 1,
           },
           {
            name: 'subtotal',
            label: 'Subtotal',
            type: 'currency',
            ui: {
             readonly: true,
            },
            calculation: {
             operation: 'multiply',
             fields: ['qty', 'price'],
            },
           },
          ],
         },
         {
          name: 'grand_total',
          label: 'Total Bayar',
          type: 'currency',
          ui: {
           readonly: true,
          },
          width: '50',
         },
         {
          name: 'payment_method',
          label: 'Metode Bayar',
          type: 'select',
          options: ['Cash', 'QRIS', 'Debit Card', 'Credit Card'],
          width: '50',
         },
        ],
       },
      },
     ],
    },
    {
     id: 'fixed_settings',
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
  })
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
    query.$or.push({ [element]: { $regex: object_search[element], $options: 'i' } })
   }
  }
  if (filter) {
   let object_filter = JSON.parse(filter)
   for (const element of Object.keys(object_filter)) {
    query[element] = object_filter[element]
   }
  }
  const skip = (page - 1) * limit
  const sort = sortField ? { [sortField]: sortOrder === 'desc' ? -1 : 1 } : { updated_at: -1 }
  let data = await collections?.find(query).skip(skip).limit(Number(limit)).sort(sort).toArray()
  const total = await collections?.countDocuments(query)
  return response.send({ data, total, page: Number(page), totalPages: Math.ceil(total / limit) })
 }
 async getCollectionDataDetail({ params, response }: HttpContext) {
  const colName = params.col
  const id = params.id
  if (!id || id === 'undefined') {
   return response.status(400).send({ message: 'ID parameter is required' })
  }
  const collections = database.data?.collection(colName)
  const result = await collections?.findOne({ _id: new ObjectId(id) })
  return response.send(result)
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
