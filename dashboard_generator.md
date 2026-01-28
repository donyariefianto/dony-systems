# 🛠️ OmniDash Settings: Dashboard Generator Manual

Selamat datang di panduan teknis **Dashboard Generator**. Modul ini adalah inti dari kustomisasi visual OmniDash, memungkinkan Administrator untuk membangun, mengatur, dan memproyeksikan data secara dinamis melalui antarmuka _drag-and-drop_ dan konfigurasi berbasis metadata.

---

## 🌟 Fitur Utama Editor

1. **Visual Widget Builder**: Menambah, mengedit, dan menghapus widget secara _real-time_.
2. **Grid Management**: Mengatur lebar widget menggunakan sistem grid (Quarter, Half, Full Width).
3. **Multi-Variant Engine**: Mendukung pembuatan banyak filter dinamis (dropdown) dalam satu widget.
4. **Live Pipeline Editor**: Menulis MongoDB Aggregation Pipeline langsung dengan dukungan injeksi variabel.
5. **Icon & Visual Library**: Integrasi _Icon Picker_ dan pengaturan opsi ECharts kustom.

---

## 📖 Panduan Penggunaan

### 1. Menambahkan Widget Baru

- Klik tombol **"Add Widget"** pada dashboard generator.
- Pilih **Tipe Widget** (misal: Chart, Stat, atau Table).
- Pilih **Sub-tipe** (misal: Line Chart, Bar Race, atau KPI Basic).

### 2. Mengonfigurasi Properti Dasar

Di dalam sidebar **Properties**, Anda dapat mengatur:

- **Title & Description**: Nama yang akan tampil di header widget.
- **Icon**: Representasi visual widget.
- **Width**: Ukuran kolom pada grid dashboard.
- **Refresh Interval**: Durasi _auto-reload_ data dalam satuan detik.

### 3. Konfigurasi Dynamic Variants (PENTING)

Fitur ini memungkinkan widget memiliki filter dropdown kustom (seperti filter Tahun, Bulan, atau Kategori).

**Cara Mengaktifkan:**

1. Centang toggle **"Dynamic Variants"**.
2. Masukkan konfigurasi JSON pada kolom **Variant Config**.

**Format JSON yang Didukung:**

```json
[
 {
  "id": "YEAR_FILTER",
  "label": "Tahun",
  "options": [
   { "label": "2025", "value": "2025" },
   { "label": "2026", "value": "2026" }
  ],
  "default": "2025"
 },
 {
  "id": "CATEGORY",
  "label": "Kategori",
  "options": [
   { "label": "Elektronik", "value": "elec" },
   { "label": "Fashion", "value": "fash" }
  ],
  "default": "elec"
 }
]
```

---

## 🔗 Relasi Data & Pipeline

Bagian paling kuat dari generator ini adalah kemampuan menghubungkan filter (Variant) dengan query database (**Aggregation Pipeline**).

### Penggunaan Placeholder

Gunakan format `{{ID_VARIANT}}` di dalam Pipeline Anda. Sistem akan otomatis mengganti token tersebut dengan nilai yang dipilih user di Dashboard.

**Contoh Kasus:**
Jika Anda memiliki variant dengan ID `YEAR_FILTER`, tulis pipeline Anda seperti ini:

```javascript
;[
 {
  $match: {
   year: '{{YEAR_FILTER}}',
   status: 'COMPLETED',
  },
 },
 {
  $group: {
   _id: '$category',
   total: { $sum: '$amount' },
  },
 },
]
```

---

## 📊 Integrasi Visual (ECharts)

Anda dapat melakukan _override_ pada tampilan grafik melalui kolom **ECharts Configuration**. Masukkan objek JSON yang valid sesuai dengan dokumentasi Apache ECharts.

**Contoh Kustomisasi Warna & Legend:**

```json
{
 "color": ["#3b82f6", "#10b981", "#f59e0b"],
 "legend": { "show": true, "bottom": 0 },
 "grid": { "top": "10%", "containLabel": true }
}
```

---

## 🛠️ Tips Troubleshooting

- **Data Tidak Muncul**: Periksa konsistensi antara `Collection Name` di settings dengan nama koleksi asli di MongoDB.
- **Error JSON**: Pastikan semua konfigurasi (Variant, Pipeline, ECharts) menggunakan tanda kutip ganda (`"`) dan bukan kutip tunggal (`'`).
- **Variant Tidak Berfungsi**: Pastikan `ID` di dalam JSON Variant sama persis dengan placeholder yang Anda tulis di dalam Pipeline (bersifat _case-sensitive_).

---

## 💾 Menyimpan Dashboard

Setelah semua widget selesai dikonfigurasi:

1. Klik **"Save Dashboard"** di bar navigasi atas.
2. Berikan nama dashboard yang deskriptif.
3. Klik **"Publish"** agar dashboard tersedia untuk diakses oleh user.

---

**OmniDash Generator v2.0** | _Metadata-Driven Dashboard Solution_
