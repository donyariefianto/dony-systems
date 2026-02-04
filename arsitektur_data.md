Dokumentasi ini dirancang sebagai panduan teknis (Blue Print) untuk mengubah sistem Anda dari sekadar aplikasi pencatatan menjadi **Enterprise Resource Planning (ERP) Engine** yang skalabel.

---

# 🏗️ Smart Projection Engine (SPE) - Enterprise Data Architecture

Dokumentasi ini menjelaskan 8 pilar data yang memisahkan tanggung jawab antara operasional, analisis, dan kontrol sistem.

---

## 🟢 Kelompok 1: Core Engine (Operasional)

### Pilar 1: Master Data (The Truth)

**Tujuan:** Menyediakan status aset saat ini secara instan.

* **Proses:** Setiap perubahan stok harus di-update secara *Atomic* (menggunakan `$inc` di MongoDB) untuk menghindari *race condition*.
* **Data Key:** `current_balance`, `safety_stock`, `unit_conversion`.

### Pilar 2: Event Logs (The History)

**Tujuan:** Catatan mutasi "Delta" yang tidak boleh diubah (*Immutable*).

* **Proses:** Setiap kali barang bergerak, buat satu entry log. Log ini adalah sumber data asli jika dashboard perlu dihitung ulang (*Re-projection*).
* **Data Key:** `delta_qty`, `balance_after`, `transaction_type`.

---

## 🔵 Kelompok 2: Intelligence & Analytics (The Smart Part)

### Pilar 3: Materialized Projections (The Dashboard)

**Tujuan:** Data siap saji untuk **Apache ECharts**.

* **Proses:** SPE membaca Pilar 2 secara asinkron (via BullMQ) dan merangkumnya ke dalam pilar ini. Dashboard tidak boleh melakukan `SUM()` pada jutaan baris, ia hanya membaca dokumen di sini.
* **Format:** Optimized for Time-series (Harian, Mingguan, Bulanan).

### Pilar 4: Predictive Insights (The Forecasting)

**Tujuan:** Menjawab pertanyaan "Kapan stok saya habis?".

* **Proses:** Algoritma SPE menghitung *Burn Rate* (kecepatan konsumsi) dan memproyeksikan tanggal kritis.
* **Data Key:** `estimated_out_of_stock_date`, `confidence_score`.

---

## 🟡 Kelompok 3: Framework & Orchestration (The Brain)

### Pilar 5: Rule Engine / Flow Config (The Flexibility)

**Tujuan:** Desain flow proses yang fleksibel tanpa ganti kode.

* **Proses:** Anda mendefinisikan *Mapping* data di sini. Misalnya: "Jika koleksi Supply berubah, update Pie Chart A". SPE akan membaca config ini secara dinamis.
* **Struktur:** JSON-based Workflow Definition.

### Pilar 6: Metadata Management (The Glossary)

**Tujuan:** Menjaga konsistensi standar (Satuan, Kategori, Gudang).

* **Proses:** Semua dropdown di UI harus menarik data dari sini agar tidak ada input "Pcs", "PCS", atau "buah" yang berbeda-beda.

---

## 🔴 Kelompok 4: Governance & Security (The Control)

### Pilar 7: Archiving Policy (The Vault)

**Tujuan:** Menjaga database tetap ringan.

* **Proses:** Data log (Pilar 2) yang sudah lebih dari 2 tahun dipindah ke *Cold Storage*. Hanya ringkasan (Snapshot) yang ditinggalkan di database utama.

### Pilar 8: Security & Identity Audit (The Guard)

**Tujuan:** Kepatuhan keamanan (*Compliance*).

* **Proses:** Mencatat setiap akses data sensitif (seperti harga beli) dan log perubahan konfigurasi sistem.

---

## 🔄 Alur Proses Terintegrasi (The Life of a Transaction)

Untuk mencapai level Enterprise, alur datanya harus mengikuti urutan ini:

1. **Trigger:** User melakukan transaksi di PWA (Input Barang Masuk).
2. **Pilar 2 (Write):** Sistem menulis Log Mutasi (Delta: +10).
3. **Pilar 1 (Update):** Secara atomik, saldo di Master Product ditambah 10.
4. **SPE Worker (BullMQ):** Mendeteksi log baru, membaca **Pilar 5 (Rule)** untuk tahu cara memprosesnya.
5. **Pilar 3 (Project):** SPE memperbarui nilai di dokumen Dashboard (Pie/Line Chart).
6. **Pilar 4 (Analyze):** SPE menghitung ulang sisa hari stok berdasarkan mutasi terbaru.
7. **PWA (Refresh):** Dashboard menampilkan data dari Pilar 3 secara instan tanpa *loading* berat.

---

## 🚀 Strategi Efisiensi Masa Depan

* **Zero-Calculation Frontend:** PWA hanya bertugas menampilkan data (`Read-only`). Semua logika matematika berat ada di SPE.
* **Bucket Pattern:** Simpan data harian dalam satu array per bulan untuk mengurangi *overhead* pembacaan database.
* **Lazy Projection:** Hanya jalankan SPE untuk produk-produk yang benar-benar mengalami mutasi dalam satu jam terakhir.

---

> **Tips Naik Level:** Jangan pernah biarkan query dashboard kamu melakukan filter pada data mentah. Jika kamu melakukannya, sistemmu akan melambat seiring bertambahnya data. Selalu gunakan **Pilar 3 (Projections)** sebagai sumber data Dashboard.
