Berikut adalah versi lengkap dan diperbarui dari `README.md` untuk panduan penulisan formula **Smart Projection Engine (SPE)**. Dokumen ini telah disesuaikan dengan fitur terbaru seperti *Asynchronous Lookup*, *Cross-Collection*, dan penanganan *Object/Array Assignment*.

---

# 📘 Panduan Penulisan Formula - Smart Projection Engine (SPE)

Dokumen ini adalah referensi resmi untuk menulis logika transformasi pada bagian **Logic (Formula Mode)** di dalam sistem SPE. Semua formula dijalankan dalam lingkungan *Safe Sandbox* (VM Node.js) yang mendukung operasi asinkron dan manipulasi data tingkat lanjut.

---

## 1. Variabel Global (Global Variables)

Anda dapat mengakses objek berikut di dalam setiap formula:

| Variabel | Deskripsi |
| --- | --- |
| `source` | Data baru (*current*) yang memicu engine. |
| `old` | Data lama (*previous*) dari database sebelum update (Hanya ada di event `onUpdate`). |
| `item` | Data baris saat ini jika Anda berada di dalam pemetaan Array (Loop). |
| `lookup` | Fungsi untuk mengambil **satu** data dari collection lain berdasarkan ID. |
| `lookupList` | Fungsi untuk mengambil **banyak** data dari collection lain berdasarkan kriteria. |
| `get(path)` | Helper untuk mengambil nilai nested secara aman (Contoh: `get('profile.address')`). |

---

## 2. Struktur Penulisan & Logika Kontrol

### A. Ternary Operator (Logika Satu Baris)

Sangat efisien untuk penentuan nilai sederhana.
**Format:** `kondisi ? benar : salah`

```javascript
source.price > 1000 ? "Premium" : "Reguler"

```

### B. Block If-Else (Logika Kompleks)

Jika membutuhkan variabel lokal atau banyak kondisi, gunakan **IIFE (Immediately Invoked Function Expression)**.
**Format:** `(() => { ... return hasil; })()`

```javascript
(() => {
    const margin = (source.price || 0) - (source.cost || 0);
    if (margin > 500) return "High Profit";
    if (margin > 0) return "Medium Profit";
    return "Loss";
})()

```

---

## 3. Advanced: Cross-Collection Lookup

Fitur ini memungkinkan Anda menggabungkan (*join*) data dari collection lain secara asinkron. Wajib menggunakan kata kunci **`await`**.

* **Lookup Single (Berdasarkan ID):**
Mengambil data supplier berdasarkan ID yang ada di source.
```javascript
await lookup('master_suppliers', source.supplier_id)

```


* **Lookup List (Banyak Data dengan Filter):**
Mengambil daftar log aktivitas yang berhubungan dengan data ini.
```javascript
await lookupList('activity_logs', { ref_id: source.id }, { action: 1, date: 1 }, 5)

```



---

## 4. Penanganan Object & Array Assignment

Anda dapat mengisi field bertipe **Object** atau **Array** secara utuh menggunakan formula.

* **Object Assignment & Merge:**
Jika field bertipe `Object` diisi formula `lookup`, maka field target akan berisi objek tersebut. Jika di UI Anda menambahkan "Anak" (Children) di bawahnya, nilai anak tersebut akan digabungkan (*merge*) ke dalam objek hasil lookup.
```javascript
await lookup('master_products', source.product_id)

```


* **Array Looping (Mapping):**
Jika field bertipe `Array` diisi formula `lookupList`, sistem akan melakukan mapping otomatis. Anda bisa menggunakan field anak sebagai template untuk memproses setiap item di dalam list tersebut.

---

## 5. Keamanan Data & Null-Safety (Wajib Baca)

Sistem ini sangat ketat. Gunakan teknik berikut agar tidak menghasilkan `NaN` atau ralat `null`.

1. **Gunakan `old?.**`: Selalu gunakan tanda tanya sebelum properti `old`. Saat *Insert*, `old` bernilai `null`.
* ❌ Salah: `source.qty + old.qty`
* ✅ Benar: `(source.qty || 0) + (old?.qty || 0)`


2. **Operasi Matematika Robust**:
Pastikan hasil operasi tidak `NaN` jika salah satu data kosong.
```javascript
(!source.price && !old?.price) ? null : ((source.price || 0) * (old?.price || 1))

```


3. **IIFE Asinkron**:
Jika menggunakan `if/else` bersamaan dengan `lookup`, gunakan format `async`:
```javascript
await (async () => {
    const master = await lookup('master_supply', source.sid);
    return master ? master.name : "Unknown";
})()

```



---

## 6. Contoh Kasus Gabungan (Expert)

Menghitung selisih harga dan mengambil informasi admin yang melakukan update:

```javascript
await (async () => {
    // 1. Hitung selisih
    const priceDiff = (source.price || 0) - (old?.price || 0);
    
    // 2. Ambil data master user
    const admin = await lookup('users', source.updated_by);
    
    return {
        diff: priceDiff,
        is_increased: priceDiff > 0,
        admin_name: admin?.full_name || "System",
        timestamp: new Date()
    };
})()

```

---

*Dokumentasi ini dibuat untuk Smart Projection Engine Service - Versi 2026.01*

*© 2026 Smart Projection Engine - High Performance Data Transformation*