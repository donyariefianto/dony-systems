Berikut adalah draf dokumen **README.md** yang disusun secara terpisah untuk modul **Dashboard Generator** dan **Menu Generator**. Dokumentasi ini dirancang dengan standar profesional untuk memudahkan pengembang memahami arsitektur dan cara kerja sistem yang Anda bangun.

---

# 📊 Module: Dashboard Generator

Modul ini bertanggung jawab untuk melakukan render komponen visual secara dinamis berdasarkan konfigurasi JSON. Mendukung berbagai tipe widget mulai dari indikator performa utama (KPI) hingga tabel analitik yang terintegrasi dengan **SPE (Stream Processing Engine)**.

## 🚀 Fitur Utama

- **Multi-Category Widgets**: Mendukung _Executive Summary_, _Data Intelligence_, dan _Graphic Charts_.
- **Hybrid Data Source**: Mendukung data statis untuk _mockup_ cepat dan data dinamis dari MongoDB/SPE.
- **Responsive Grid System**: Layout yang menyesuaikan ukuran layar secara otomatis (Mobile, Tablet, Desktop).
- **Interactive Tables**: Tabel dengan fitur pencarian Regex, paginasi, dan _sticky header_.

## 🛠 Struktur Konfigurasi Widget

Setiap widget didefinisikan dalam objek JSON dengan skema berikut:

```json
{
 "id": "unique_widget_id",
 "type": "stat | table | chart",
 "subtype": "stat_card | data_grid | line_smooth",
 "title": "Widget Display Name",
 "width": "full | half | quarter",
 "data_config": {
  "source": "static | dynamic",
  "static_data": []
 }
}
```

## 📂 Kategori Widget (Registry)

1. **Executive Summary**: Digunakan untuk Label/Stat (KPI). Menampilkan `value`, `icon`, dan `description`.
2. **Data Intelligence**: Digunakan untuk Tabel Analitik dengan dukungan paginasi dan filter.
3. **Visual Analytics**: Integrasi penuh dengan **Apache ECharts** untuk visualisasi tren.

## 🖥 Penggunaan (Rendering)

Untuk merender dashboard, gunakan fungsi `renderDashboard` yang akan melakukan iterasi pada registry:

```javascript
import { WidgetRegistry } from './WidgetRegistry.js'

// Contoh memanggil render berdasarkan tipe
if (widget.type === 'stat') {
 renderStatWidget(widget, container)
} else if (widget.type === 'table') {
 renderTableWidget(widget, container)
}
```

---

# 🗂 Module: Menu Generator

Modul **Menu Generator** adalah inti dari navigasi sistem yang memungkinkan pembuatan struktur menu secara dinamis melalui antarmuka administratif atau file registri pusat.

## 🚀 Fitur Utama

- **Dynamic Routing**: Menu yang terhubung langsung dengan sistem navigasi SPA.
- **Icon Library Integration**: Mendukung penuh **FontAwesome 6** untuk visualisasi menu yang profesional.
- **Contextual Permissions**: Menampilkan atau menyembunyikan menu berdasarkan peran pengguna (_RBAC_).
- **Smooth Transitions**: Animasi masuk dan keluar yang elegan pada sidebar.

## 🏗 Struktur Registri Menu

Menu dikelola melalui file `MenuRegistry.js` untuk memudahkan pemeliharaan:

```javascript
export const MenuRegistry = [
 {
  id: 'm_inventory',
  name: 'Master Inventory',
  icon: 'fa-boxes-stacked',
  path: '/inventory',
  category: 'Operations',
 },
 {
  id: 'm_analytics',
  name: 'Business Intelligence',
  icon: 'fa-chart-pie',
  path: '/analytics',
  category: 'Reports',
 },
]
```

## 🎨 Standar Visual Menu

- **Active State**: Menu yang sedang dibuka akan mendapatkan aksen warna (contoh: `bg-blue-50 text-blue-600`).
- **Mobile Optimized**: Menu pada perangkat mobile akan berubah menjadi _bottom navigation_ atau _hamburger menu_ yang _touch-friendly_.
- **Grouping**: Menu dikelompokkan berdasarkan kategori bisnis (misal: _F&B Ops_, _Finance_, _Settings_).

## 🛠 Cara Menambahkan Menu Baru

1. Buka `MenuRegistry.js`.
2. Tambahkan objek menu baru ke dalam array.
3. Pastikan `path` sesuai dengan rute yang terdaftar di sistem navigasi.
4. Sistem akan secara otomatis merender menu tersebut pada sidebar utama.

---

### Perbandingan Arsitektur

| Fitur            | Dashboard Generator    | Menu Generator           |
| ---------------- | ---------------------- | ------------------------ |
| **Output Utama** | Widget, Chart, & Table | Sidebar & Navigation Bar |
| **Pemicu Data**  | SPE / MongoDB Query    | User Permissions / Role  |
| **Tampilan**     | Grid-based Layout      | List / Tree-based Layout |

---

**Apakah Anda ingin saya buatkan dokumen pendamping untuk konfigurasi SPE (Stream Processing Engine) agar alur pengolahan data ke dashboard menjadi lengkap?**
