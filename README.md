# Prototype Dashboard Interaktif Monitoring Cuaca dan Gempa Bumi Berbasis WebGIS Terintegrasi FAQ Interaktif pada BBMKG Wilayah I Medan

Dashboard Next.js dan WebGIS untuk membaca prakiraan cuaca, gempa bumi, serta peringatan dini resmi BMKG. Asisten Cuaca memakai parser intent dan resolver wilayah deterministik, bukan model generatif. Pertanyaan dinamis mengambil data BMKG dari server berdasarkan ADM4, sedangkan pertanyaan definisi dijawab dari FAQ statis.

## Fitur

- Pencarian 6.110 desa/kelurahan pada 455 kecamatan dan 33 kabupaten/kota Sumatera Utara.
- Prakiraan cuaca per wilayah, ringkasan waktu terdekat, tab harian, dan grafik.
- WebGIS dengan empat basemap, overlay cuaca/gempa/polygon peringatan, legenda, skala, fokus wilayah, reset, dan fullscreen.
- Seluruh gempa hasil filter tampil pada WebGIS dengan kategori magnitudo, cluster, marker terpilih, dan tombol fokus semua hasil.
- Filter feed, radius, dan magnitudo dipakai bersama oleh panel gempa dan WebGIS.
- Detail cuaca, gempa, atau peringatan tampil sebagai panel desktop dan bottom sheet mobile.
- Tautan Shakemap hanya ditampilkan setelah URL divalidasi sebagai domain resmi BMKG.
- Seluruh peringatan dini Sumatera Utara yang masih aktif, diurutkan menurut severity dan urgency.
- Gempa terbaru, M5+, dan dirasakan dengan filter magnitudo serta radius dari wilayah aktif.
- Asisten Cuaca Dinamis yang mendeteksi lokasi, mempertahankan konteks percakapan, menangani lokasi ambigu, dan mengambil prakiraan BMKG tanpa request langsung dari browser.
- Navigasi sticky responsif, status loading/error/offline, cache terukur, dan preferensi lokal pengguna.
- Antarmuka presentasi BBMKG dengan landing page gradient, navigasi berikon, statistik dataset nyata, kartu metrik beraksen, serta layout responsif tanpa memindahkan data simulasi dari prototype desain.

## Menjalankan

Gunakan Node.js 20 atau lebih baru.

```bash
npm ci
npm run dev
```

Buka `http://localhost:3000` untuk landing page, `/dashboard` untuk ringkasan WebGIS, atau `/faq` untuk Asisten Cuaca Dinamis. Supabase bersifat opsional pada pengembangan lokal; tanpa kredensial, pencarian wilayah memakai dataset lokal dan cache memakai memori/Next.js.

Pemeriksaan kualitas:

```bash
npm run format:check
npm run lint
npm run type-check
npm test
npm run build
npm start
```

## Arsitektur

- Next.js App Router 16, React 19, TypeScript strict, dan Tailwind CSS.
- Route Handler `/api/weather`, `/api/weather/alerts`, `/api/chat/weather`, `/api/regions/search`, `/api/earthquakes`, dan `/api/warnings` menjadi lapisan server terhadap sumber BMKG serta database wilayah.
- Service layer melakukan timeout, pemeriksaan respons, parsing, validasi, dan normalisasi sebelum data masuk ke UI.
- TanStack Query menangani deduplikasi dan cache: cuaca 30 menit, peringatan 3 menit, dan gempa 5 menit.
- React Leaflet untuk WebGIS dan Recharts untuk visualisasi prakiraan.
- Dataset wilayah tunggal berada di `src/data/sumut-regions.json` dan memuat metadata sumber/generator.
- Supabase menyimpan tabel `regions`, cache opsional, dan konteks percakapan. Secret Supabase hanya dibaca modul server.
- CI GitHub Actions menjalankan format, lint, type-check, test, dan production build.

## Supabase dan chatbot cuaca

1. Buat project Supabase.
2. Jalankan migration `supabase/migrations/202607220001_weather_chatbot.sql` melalui Supabase CLI atau SQL Editor.
3. Salin `.env.example` menjadi `.env.local`, lalu isi `SUPABASE_URL` dan `SUPABASE_SECRET_KEY`. Project lama dapat memakai `SUPABASE_SERVICE_ROLE_KEY`.
4. Impor 6.110 wilayah Sumatera Utara:

```bash
npm run data:import:supabase
```

Secret/service-role tidak boleh diberi prefix `NEXT_PUBLIC_` dan tidak boleh dipakai oleh Client Component. RLS aktif pada tabel dan akses data dilakukan Route Handler server.

Pengunjung tidak memerlukan akun atau login. Halaman dan endpoint baca bersifat publik, sedangkan akses administratif Supabase tetap hanya terjadi di server dan tidak pernah dikirim ke browser.

Endpoint chatbot:

```text
GET  /api/regions/search?q=kabanjahe
GET  /api/weather?adm4=12.06.01.1010
GET  /api/weather/alerts?location=Lau%20Cimba
POST /api/chat/weather
```

## Perencana rute dan cuaca seluruh Indonesia

Halaman `/webgis` memiliki mode **Rute & cuaca** di samping mode monitoring lama. Pengguna dapat mencari titik awal/tujuan, memakai lokasi perangkat, mengeklik peta, menggeser marker, memilih waktu keberangkatan, melihat rute OSRM, petunjuk perjalanan, dan prakiraan BMKG berdasarkan ETA pada setiap titik sampel.

Arsitektur rute:

1. Browser mengirim dua koordinat ke `POST /api/routes/calculate`.
2. Route Handler memanggil OSRM dengan profil `driving`, urutan `longitude,latitude`, geometri GeoJSON penuh, langkah, dan anotasi.
3. `sampleRoutePoints()` menghitung jarak kumulatif sepanjang garis, memakai interval 5/10/25 km, dan membatasi hasil maksimal 15 titik.
4. Setiap titik dicocokkan dengan polygon ADM4 melalui PostGIS `ST_Covers`. Centroid maksimal 25 km hanya dipakai sebagai fallback.
5. Request cuaca dideduplikasi berdasarkan ADM4 dan dijalankan maksimal lima secara paralel.
6. Forecast dipilih berdasarkan waktu perkiraan tiba setiap titik. Waktu di luar cakupan BMKG menghasilkan status tidak tersedia, bukan data buatan.
7. Kegagalan polygon atau BMKG tidak menghapus garis rute.

Endpoint internal:

```text
POST /api/routes/calculate
POST /api/routes/weather
GET  /api/regions/by-coordinate?lat=-6.2&lng=106.8
GET  /api/locations/search?q=Monas
GET  /api/locations/reverse?lat=-6.1754&lng=106.8272
```

OSRM dan provider geocoding dipanggil dari server. Default memakai Photon berbasis OpenStreetMap; Nominatim atau instance mandiri dapat dipilih melalui `GEOCODING_PROVIDER` dan `GEOCODING_BASE_URL`. Pencarian dibatasi ke Indonesia, memiliki debounce 500 ms, cache 24 jam, rate limit, dan identitas aplikasi dari `GEOCODING_USER_AGENT`.

### Memasang polygon ADM4 nasional

1. Jalankan migration `supabase/migrations/202607220002_route_weather_postgis.sql`.
2. Siapkan GeoJSON resmi batas desa/kelurahan seluruh Indonesia dengan properti ADM4 dan nama wilayah. Kode ADM4 harus sudah terdapat pada sumber; importer tidak membuat kode baru.
3. Impor file:

```bash
npm run data:import:polygons -- ./data/adm4-indonesia.geojson
```

Periksa tabel, RPC, dan jumlah polygon tanpa menampilkan secret:

```bash
npm run db:verify
```

Importer menerima geometry `Polygon` atau `MultiPolygon`, memvalidasi format ADM4, mengubah Polygon menjadi MultiPolygon, mengisi zona waktu berdasarkan ADM1 jika sumber tidak menyediakannya, dan melakukan upsert per 100 wilayah. Polygon sebaiknya berasal dari sumber administrasi resmi yang lisensinya mengizinkan pemakaian aplikasi.

Tanpa kredensial Supabase atau tanpa polygon nasional, pencarian lokasi dan garis rute tetap bekerja, tetapi titik cuaca ditandai **data wilayah belum tersedia**. Sistem tidak mengganti titik nasional dengan desa Sumatera Utara terdekat.

Pengujian manual:

1. Buka `/webgis` lalu pilih **Rute & cuaca**.
2. Cari lokasi awal dan tujuan di Indonesia atau pilih langsung dari peta.
3. Pilih waktu keberangkatan lalu tekan **Cari rute**.
4. Pastikan rute, jarak, durasi, estimasi tiba, petunjuk, marker cuaca, popup, dan ringkasan muncul.
5. Geser marker awal/tujuan dan pastikan hasil lama dibersihkan sebelum menghitung ulang.
6. Uji waktu lebih dari tiga hari dan wilayah tanpa polygon untuk memastikan data tidak dibuat-buat.

Contoh request:

```json
{
  "message": "Apakah malam ini hujan di Kabanjahe?",
  "conversationId": "optional-uuid",
  "selectedRegion": null
}
```

Nama kecamatan atau kabupaten tidak diarahkan diam-diam ke satu desa. Untuk seluruh 33 kabupaten/kota, FAQ menawarkan **Ringkasan umum** atau pilihan kecamatan. Ringkasan umum menggabungkan data BMKG dari maksimal lima kecamatan perwakilan dan tetap menjelaskan bahwa kondisi tiap wilayah dapat berbeda. Pengguna yang menulis “Medan saja” atau “Medan secara umum” langsung memperoleh ringkasan tersebut. Jika pengguna memilih kecamatan, FAQ selanjutnya menampilkan desa/kelurahan agar prakiraan memakai ADM4 yang tepat. Pertanyaan awal dilanjutkan otomatis setelah pilihan dibuat. `conversationId` menyimpan lokasi, intent, hari, periode waktu, dan kandidat terakhir sehingga pertanyaan seperti “kalau besok malam?” tetap memakai lokasi aktif.

Cache prakiraan berlaku 30 menit, cache peringatan 5 menit, fetch BMKG memakai timeout 10 detik dan maksimal satu retry. Route publik juga memiliki rate limiter proses untuk menekan penyalahgunaan; pada deployment multi-instance, gunakan rate limiter terdistribusi bila trafik sudah tinggi.

## Sumber data

- Prakiraan cuaca, daftar wilayah prakiraan, gempa bumi, dan CAP peringatan dini: layanan publik resmi BMKG.
- Basemap: OpenStreetMap, OpenTopoMap, Esri World Imagery, dan CARTO; atribusi ditampilkan pada peta.

Bangun ulang dataset wilayah resmi BMKG dengan:

```bash
npm run data:build:bmkg
```

Generator memakai cache dan checkpoint di `.cache`, concurrency terbatas, retry, jeda request, serta pemeriksaan `robots.txt`. `npm run data:build` mengambil kode administrasi Kemendagri melalui wilayah.id sebagai fallback. Hasil generator tidak membuat kode ADM4 secara manual.

## Batasan dan keselamatan

- Informasi pada dashboard bersifat informatif dan tidak menggantikan kanal resmi BMKG atau instruksi pemerintah/layanan darurat.
- Feed gempa BMKG tidak menyediakan histori lengkap dan Shakemap tidak selalu tersedia pada setiap kejadian.
- Status “tidak ada peringatan aktif” hanya menggambarkan feed BMKG ketika diperiksa, bukan jaminan bahwa kondisi aman.
- Data yang sempat dimuat mungkin tetap terlihat selama sesi offline; aplikasi tidak mengklaim dukungan offline penuh.
- Waktu pembaruan bergantung pada publikasi sumber BMKG. Aplikasi tidak membuat prakiraan atau kesimpulan kebencanaan sendiri.

## Asal pengembangan

Konsep navigasi, susunan informasi, dan cakupan fitur dari proyek KP- dipakai sebagai referensi. Implementasi lama yang monolitik serta dataset statisnya tidak disalin; versi ini mempertahankan arsitektur komponen, route server, validasi, dan dataset yang dapat diregenerasi.
