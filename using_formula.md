Berikut adalah draf lengkap untuk fail `README.md` yang boleh anda gunakan sebagai panduan rasmi penulisan formula dalam projek **Smart Projection Engine (SPE)** anda. Fail ini direka untuk membantu pembangun memahami cara menulis logik yang *robust* dan selamat.

---

# Panduan Penulisan Formula - Smart Projection Engine (SPE)

Dokumen ini mengandungi panduan lengkap untuk menulis formula pada bahagian **Logic (Formula Mode)** dalam sistem SPE. Formula dijalankan dalam persekitaran *Sandbox* (VM Node.js) yang selamat dan menyokong manipulasi data dinamik antara data semasa (**source**) dan data lama (**old**).

## 1. Pembolehubah Global (Global Variables)

Terdapat tiga objek utama yang boleh anda akses di dalam setiap formula:

| Pembolehubah | Deskripsi |
| --- | --- |
| `source` | Merujuk kepada data semasa (payload baru) yang sedang diproses. |
| `old` | Merujuk kepada data lama yang sedia ada di database (hanya ada pada event `onUpdate`). |
| `item` | Merujuk kepada data dalam baris semasa apabila berada di dalam *Array Loop*. |
| `get(path)` | Helper function untuk mengambil data secara selamat (Contoh: `get('profile.address.city')`). |

---

## 2. Struktur Penulisan Asas

### A. Ternary Operator (Sangat Disyorkan)

Sesuai untuk logik ringkas satu baris.
**Format:** `kondisi ? hasil_jika_benar : hasil_jika_salah`

```javascript
source.price > 1000 ? "Mahal" : "Murah"

```

### B. Block If-Else (IIFE)

Gunakan format ini jika logik anda memerlukan lebih daripada satu baris atau pengisytiharan variabel. Anda **mesti** membungkusnya dalam fungsi anonim yang dipanggil terus `(() => { ... })()`.

```javascript
(() => {
    const selisih = (source.price || 0) - (old?.price || 0);
    if (selisih > 0) return "Naik";
    if (selisih < 0) return "Turun";
    return "Tetap";
})()

```

---

## 3. Contoh Kes & Amalan Terbaik

### Operasi Matematik Selamat (Null-Safe)

Sentiasa gunakan *Optional Chaining* (`?.`) dan *Nullish Coalescing* (`||`) untuk mengelakkan ralat `NaN` atau *crash* apabila `old` adalah `null`.

* **Pendaraban (Harga x Kuantiti):**
```javascript
(source.price || 0) * (source.qty || 0)

```


* **Perbandingan dengan Data Lama:**
Jika `old` tiada (Insert), maka nilai `old.price` dianggap `0`.
```javascript
(source.price || 0) + (old?.price || 0)

```



### Pengesanan Perubahan (Change Detection)

Berguna untuk membuat *Audit Log* atau status dinamik.

```javascript
source.status !== old?.status ? `Berubah dari ${old?.status} ke ${source.status}` : "Tiada Perubahan"

```

### Manipulasi Array (Nested Data)

Jika anda memproses field di dalam Array, gunakan `item`.

```javascript
// Mengira total harga dalam senarai item
(item.price || 0) * (item.qty || 0)

```

---

## 4. Peraturan Penting (Must Follow)

1. **Gunakan `old?.**`: Jangan sesekali memanggil `old.field` secara terus. Gunakan tanda soal (`old?.field`) untuk memastikan sistem tidak *crash* semasa proses **Insert** (di mana `old` adalah `null`).
2. **Keduanya Kosong = Null**: Jika anda mahu hasil menjadi `null` apabila kedua-dua data tiada:
```javascript
(!source.val && !old?.val) ? null : (source.val || 0) + (old?.val || 0)

```


3. **Tipe Data**: Pastikan hasil akhir formula selaras dengan **Data Type** yang anda pilih di UI (contoh: Formula untuk tipe Number harus mengembalikan angka).

---

## 5. Advanced Level: Teknik Manipulasi Kompleks

### A. Penggunaan Higher-Order Functions pada Array

Karena formula berjalan di Node.js, Anda bisa menggunakan fungsi seperti `.map()`, `.filter()`, dan `.reduce()` untuk mentransformasi data array secara dinamis dalam satu field.

* **Menghitung Total Harga (Summing Up):**
Mengambil total nilai dari sebuah array objek tanpa membuat banyak field.
```javascript
// Menghitung total belanja dari array items
(source.items || []).reduce((sum, item) => sum + (item.price * item.qty), 0)

```


* **Filtering Data (Hanya Mengambil Data Tertentu):**
Misal hanya ingin mengambil nama item yang kategorinya "Elektronik".
```javascript
(source.items || [])
  .filter(item => item.category === 'Elektronik')
  .map(item => item.name)
  .join(', ')

```



### B. Deep Comparison & Audit Trail

Untuk membuat log perubahan yang sangat detail, Anda bisa membandingkan objek secara mendalam.

* **Mendeteksi Perubahan pada Field Spesifik secara Dinamis:**
```javascript
(() => {
    const fields = ['status', 'price', 'stock'];
    const changes = fields.filter(f => source[f] !== old?.[f]);
    return changes.length > 0 ? `Perubahan pada: ${changes.join(', ')}` : "Tidak ada perubahan signifikan"
})()

```



### C. Manipulasi Tanggal Tingkat Lanjut

Menggunakan objek `Date` untuk menghitung durasi atau menentukan *deadline*.

* **Menghitung Selisih Jam (SLA Check):**
```javascript
(() => {
    if (!old?.created_at) return 0;
    const diffInMs = new Date() - new Date(old.created_at);
    return Math.floor(diffInMs / (1000 * 60 * 60)); // Hasil dalam jam
})()

```



### D. Data Normalization & Cleaning

Membersihkan data kotor dari sumber (source) sebelum masuk ke target.

* **Regex untuk Membersihkan Format String (Misal Nomor Telepon):**
```javascript
source.phone ? source.phone.replace(/[^0-9]/g, '') : null

```



---

## 6. Optimization & Security (Best Practices)

1. **Early Returns dalam IIFE:**
Gunakan `if (!data) return null` di awal blok IIFE untuk menghindari eksekusi kode berat di bawahnya jika data esensial tidak ada.
2. **Hindari Infinite Loops:**
Meskipun sistem memiliki timeout 100ms, hindari penggunaan `while` loop yang berisiko. Gunakan metode array standar JavaScript yang lebih aman.
3. **Cek Eksistensi Array Index:**
Saat mengakses `old.data[0]`, pastikan menggunakan `old?.data?.[0]` untuk mencegah error *undefined* jika array tersebut kosong.
4. **Optimasi Formula:**
Jika sebuah logika digunakan di banyak field, pertimbangkan untuk menyederhanakan input di tingkat `source` sebelum masuk ke SPE untuk menjaga performa transformasi.

---

### Contoh Struktur Formula Advanced (IIFE + Object Mapping):

Gunakan teknik ini untuk mengonversi kode status dari database menjadi label yang ramah pengguna.

```javascript
(() => {
    const statusMap = {
        1: "Pending",
        2: "Processing",
        3: "Completed",
        4: "Cancelled"
    };
    
    // Jika status berubah, kembalikan label baru, jika tidak gunakan label lama
    if (old && source.status === old.status) return statusMap[old.status] || "Unknown";
    return statusMap[source.status] || "Invalid Status";
})()

```

Dengan memahami **Advanced Level** ini, Anda dapat membangun sistem proyeksi data yang sangat cerdas dan mampu menangani logika bisnis yang rumit langsung di dalam SPE tanpa perlu mengubah kode backend utama.

## 7. Troubleshooting

* **Hasil `null` terus?**: Semak sama ada nama field dalam `source.nama_field` sudah betul.
* **Error "is not defined"**: Pastikan anda tidak memanggil variabel luar selain `source`, `old`, `item`, `Math`, dan `Date`.
* **Formula Terlalu Panjang**: Jika formula terlalu kompleks, pertimbangkan untuk memecahkannya kepada beberapa field kecil atau gunakan format **IIFE** (Point 2B).

---

*Hak Cipta © 2026 Smart Projection Engine Service*