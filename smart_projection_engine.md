# 📘 Panduan Penulisan Formula - Smart Projection Engine (SPE)

Dokumen ini adalah referensi resmi untuk menulis logika transformasi pada bagian **Logic (Formula Mode)** di dalam sistem SPE. Semua formula dijalankan dalam lingkungan _Safe Sandbox_ (VM Node.js) yang mendukung operasi asinkron dan manipulasi data tingkat lanjut.

---

## 1. Variabel Global (Global Variables)

Anda dapat mengakses objek berikut di dalam setiap formula:

| Variabel     | Deskripsi                                                                            |
| ------------ | ------------------------------------------------------------------------------------ |
| `source`     | Data baru (_current_) yang memicu engine.                                            |
| `old`        | Data lama (_previous_) dari database sebelum update (Hanya ada di event `onUpdate`). |
| `item`       | Data baris saat ini jika Anda berada di dalam pemetaan Array (Loop).                 |
| `lookup`     | Fungsi asinkron untuk mengambil **satu** data (Object) berdasarkan ID.               |
| `lookupList` | Fungsi asinkron untuk mengambil **banyak** data (Array) berdasarkan kriteria.        |
| `get(path)`  | Helper untuk mengambil nilai nested secara aman (Contoh: `get('profile.address')`).  |

---

## 2. Struktur Penulisan Dasar

### A. Ternary Operator (Logika Satu Baris)

**Format:** `kondisi ? benar : salah`

```javascript
source.price > 1000 ? 'Premium' : 'Reguler'
```

### B. Block If-Else (IIFE)

**Format:** `(() => { ... return hasil; })()`

```javascript
;(() => {
 const margin = (source.price || 0) - (source.cost || 0)
 if (margin > 500) return 'High Profit'
 return 'Standard'
})()
```

---

## 3. Advanced: Cross-Collection Lookup

### A. Single Lookup (`lookup`)

Mengambil satu dokumen dari collection lain. Biasanya digunakan untuk memperkaya data ID menjadi objek lengkap.
**Sintaks:** `await lookup('collection_name', id, projection?)`

```javascript
// Mengambil data supplier lengkap
await lookup('master_suppliers', source.supplier_id)
```

### B. Multi Lookup (`lookupList`)

Mengambil daftar dokumen berdasarkan filter tertentu. Sangat berguna untuk menarik riwayat, daftar kategori, atau detail transaksi.
**Sintaks:** `await lookupList('collection_name', filter, projection?, limit?)`

- **Contoh: Mengambil 5 Log Aktivitas Terakhir**

```javascript
await lookupList('activity_logs', { ref_id: source.id }, { action: 1, date: 1 }, 5)
```

- **Contoh: Mengambil Semua Stok di Gudang yang Sama**

```javascript
await lookupList('master_stocks', { warehouse_id: source.warehouse_id })
```

---

## 4. Penanganan Object & Array Assignment

Anda dapat mengisi field bertipe **Object** atau **Array** secara utuh menggunakan formula.

- **Object Assignment:** Jika field bertipe `Object` diisi formula `lookup`, maka field target akan berisi objek tersebut. Field anak (_children_) di UI akan digabungkan (_merge_) ke dalamnya.
- **Array Assignment:** Jika field bertipe `Array` diisi formula `lookupList`, field target akan berisi daftar dokumen. Anda bisa menggunakan field anak sebagai _template_ untuk memproses ulang setiap item dalam list tersebut.

---

## 5. Keamanan Data & Null-Safety (Wajib Baca)

1. **Gunakan `old?.**`: Selalu gunakan tanda tanya sebelum properti `old`. Saat *Insert*, `old`bernilai`null`.

- ✅ Benar: `(source.qty || 0) + (old?.qty || 0)`

2. **Operasi Matematika Robust**: Pastikan hasil tidak `NaN` jika salah satu data kosong.

```javascript
!source.price && !old?.price ? null : (source.price || 0) * (old?.price || 1)
```

3. **IIFE Asinkron**: Jika menggunakan `if/else` dengan `lookup`, gunakan format `async`:

```javascript
await (async () => {
 const list = await lookupList('internal_notes', { ref_id: source.id })
 return list.length > 0 ? list : null
})()
```

---

## 6. Contoh Kasus Gabungan (Expert)

Mengambil informasi supplier dan daftar produk terkait dalam satu field:

```javascript
await (async () => {
 const supplier = await lookup('master_suppliers', source.supplier_id)
 const products = await lookupList(
  'master_products',
  { supplier_id: source.supplier_id },
  { name: 1, price: 1 }
 )

 return {
  supplier_name: supplier?.name || 'Unknown',
  available_products: products.map((p) => p.name),
  total_items: products.length,
  last_sync: new Date(),
 }
})()
```

---

Berikut adalah panduan penggunaan `lookup` dan `lookupList` yang telah diringkaskan supaya lebih mudah difahami dan dipraktikkan di dalam UI Canvas SPE:

---

# 📖 Panduan Mudah: `lookup` vs `lookupList`

Fungsi ini digunakan apabila anda ingin mengambil data daripada **Collection Master** (seperti Master Barang, Master Supplier, atau Master User) untuk dimasukkan ke dalam hasil transformasi anda.

### 1. `lookup` (Ambil SATU Data)

Gunakan ini jika anda mempunyai satu ID dan mahu mengambil **satu objek lengkap** daripada collection lain.

- **Sesuai untuk:** Mencari data unik seperti Nama Supplier berdasarkan `supplier_id`.
- **Sintaks:** `await lookup('nama_collection', id_data)`
- **Contoh Formula:**

```javascript
// Mengambil info supplier berdasarkan ID yang ada di source
await lookup('master_suppliers', source.supplier_id)
```

- **Hasil:** Mengembalikan satu **Object** `{ ... }`.

### 2. `lookupList` (Ambil BANYAK Data)

Gunakan ini jika anda ingin mencari **senarai data** berdasarkan kriteria tertentu (bukan berdasarkan satu ID sahaja).

- **Sesuai untuk:** Mencari senarai invois, senarai promo yang aktif, atau semua stok barang di satu gudang.
- **Sintaks:** `await lookupList('nama_collection', { kriteria_search })`
- **Contoh Formula:**

```javascript
// Mengambil semua promo yang statusnya 'active'
await lookupList('master_promos', { status: 'active' })
```

- **Hasil:** Mengembalikan sebuah **Array** `[ { ... }, { ... } ]`.

---

### Perbandingan Ringkas

| Situasi                                   | Gunakan Fungsi     | Tipe Data di UI |
| ----------------------------------------- | ------------------ | --------------- |
| Ambil profil user berdasarkan `user_id`   | `await lookup`     | **Object**      |
| Ambil semua kategori barang yang ada      | `await lookupList` | **Array**       |
| Ambil harga terbaru produk `ABC`          | `await lookup`     | **Object**      |
| Ambil 5 transaksi terakhir milik customer | `await lookupList` | **Array**       |

---

### Tips Penulisan Formula (Copy-Paste Ready)

#### A. Mengambil satu field spesifik sahaja (contoh: Nama)

Jika anda tidak mahu satu objek penuh, hanya mahu namanya sahaja:

```javascript
;(await lookup('master_suppliers', source.supplier_id))?.name || 'Tiada Nama'
```

#### B. Mengambil List dengan had (Limit)

Jika data di master terlalu banyak, anda boleh hadkan (contoh: ambil 10 sahaja):

```javascript
// Parameter terakhir adalah jumlah limit (default 100)
await lookupList('master_logs', { ref_id: source.id }, {}, 10)
```

#### C. Gabungan Logik (Advanced)

Jika anda mahu mengambil data master, tetapi jika tidak jumpa, ambil nilai daripada `source`:

```javascript
await (async () => {
 const master = await lookup('master_items', source.item_id)
 return master ? master.item_name : source.manual_item_name
})()
```

### Penting untuk Diingat:

1. **Wajib `await**`: Anda mesti menulis `await`di depan fungsi`lookup`atau`lookupList`.
2. **Gunakan `?.**`: Gunakan tanda soal (`?.`) selepas kurungan tutup lookup jika anda ingin mengambil field spesifik (seperti `.name`) untuk mengelakkan ralat jika data tidak dijumpai.
3. **Padankan Tipe**: Jika guna `lookupList`, pastikan **Type** di Drawer UI adalah **Array**. Jika `lookup`, pastikan **Type** adalah **Object**.

_© 2026 Smart Projection Engine - High Performance Data Transformation_
