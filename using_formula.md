Berikut adalah isi lengkap untuk file `README.md` panduan penulisan formula **Smart Projection Engine (SPE)**. Dokumen ini disusun untuk mencakup semua level, dari dasar hingga penggunaan tingkat lanjut yang melibatkan pencarian antar-collection (*cross-collection lookup*).

---

# 📘 Panduan Penulisan Formula - Smart Projection Engine (SPE)

Dokumen ini merupakan panduan resmi untuk menulis logika pada bagian **Logic (Formula Mode)** di dalam sistem SPE. Semua formula dijalankan dalam lingkungan *Sandbox* (VM Node.js) yang aman dan mendukung manipulasi data dinamis.

---

## 1. Variabel Global (Global Variables)

Anda dapat mengakses objek berikut di dalam setiap formula:

| Variabel | Deskripsi |
| --- | --- |
| `source` | Data baru (*current*) yang sedang diproses. |
| `old` | Data lama (*previous*) dari database (tersedia pada event `onUpdate`). |
| `item` | Data baris saat ini jika berada di dalam *Array Mapping*. |
| `lookup` | Fungsi *asynchronous* untuk mengambil data dari collection lain. |
| `Math`, `Date` | Library standar JavaScript untuk perhitungan dan tanggal. |

---

## 2. Struktur Penulisan Dasar

### A. Ternary Operator (Direkomendasikan)

Cocok untuk logika sederhana satu baris.
**Format:** `kondisi ? hasil_jika_benar : hasil_jika_salah`

```javascript
source.price > 1000 ? "Mahal" : "Murah"

```

### B. Block If-Else (IIFE)

Gunakan jika logika memerlukan lebih dari satu baris atau variabel lokal. Wajib dibungkus dalam fungsi anonim yang dipanggil langsung: `(() => { ... })()`.

```javascript
(() => {
    const selisih = (source.price || 0) - (old?.price || 0);
    if (selisih > 0) return "Naik";
    if (selisih < 0) return "Turun";
    return "Tetap";
})()

```

---

## 3. Level Menengah: Penanganan Data Kosong (Null-Safe)

Sistem ini sangat ketat terhadap data `null`. Gunakan *Optional Chaining* (`?.`) agar sistem tidak *crash*.

* **Perkalian Aman:**
`(source.price || 0) * (old?.price || 0)`
* **Pertambahan dengan Array Index:**
`(source.qty || 0) + (old?.data?.[0]?.value || 0)`
* **Keduanya Kosong = Null:**
`(!source.val && !old?.val) ? null : (source.val || 0) + (old?.val || 0)`

---

## 4. Level Lanjut: Pencarian Antar-Collection (Lookup)

Anda bisa mengambil data dari collection lain (Master Data) tanpa menulis query MongoDB yang rumit.

**Sintaks:** `await lookup('nama_collection', id_data, projection_object?)`

* **Mengambil Data Master Supply:**
`await lookup('master_supply', source.supply_id)`
* **Hanya Mengambil Nama Produk:**
`(await lookup('master_products', item.product_id, { name: 1 }))?.name || "N/A"`

---

## 5. Level Expert: Manipulasi Array & Kompleksitas

Manfaatkan fungsi tingkat tinggi JavaScript untuk transformasi data yang masif.

* **Menghitung Total dari Array Objek:**
```javascript
(source.items || []).reduce((sum, it) => sum + (it.price * it.qty), 0)

```


* **Filter dan Join String:**
```javascript
(source.tags || []).filter(t => t.active).map(t => t.label).join(', ')

```



---

## 6. Aturan Emas (Must Follow)

1. **Gunakan `old?.**`: Selalu gunakan tanda tanya sebelum memanggil properti `old`. Jika tidak, sistem akan error saat proses **Insert** (karena `old` bernilai `null`).
2. **Gunakan `await` untuk `lookup**`: Semua fungsi yang mengambil data dari database lain wajib diawali kata kunci `await`.
3. **Default Value**: Berikan nilai default seperti `|| 0` atau `|| ""` untuk menghindari hasil `NaN` atau `undefined` pada output final.
4. **Sandbox Security**: Anda tidak bisa memanggil fungsi `require`, `process`, atau akses database langsung selain melalui fungsi `lookup` yang disediakan.

---

### Contoh Kasus Lengkap (Audit Trail):

```javascript
await (async () => {
    if (!old) return "Data Baru Dibuat";
    
    const fields = ['status', 'price', 'qty'];
    const changed = fields.filter(f => source[f] !== old[f]);
    
    if (changed.length === 0) return "Tidak Ada Perubahan";
    
    const supplier = await lookup('master_supply', source.supplier_id);
    return `Update pada ${changed.join(', ')}. Supplier: ${supplier?.name}`;
})()

```

---

*© 2026 Smart Projection Engine - High Performance Data Transformation*