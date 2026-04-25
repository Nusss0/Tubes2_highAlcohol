# Installing Go

## Linux

1. Download the latest tarball from [go.dev/dl](https://go.dev/dl/)

2. Remove any old installation and extract

```bash
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf </your file path>
```

3. Add Go to your PATH. Add this line to `~/.bashrc` or `~/.profile`

```bash
export PATH=$PATH:/usr/local/go/bin
```

4. Restart your terminal, then verify

```bash
go version
```

## Mac

1. Download the `.pkg` installer from [go.dev/dl](https://go.dev/dl)
2. Open the package file and follow the prompts. It installs Go to `/usr/local/go` and adds `/usr/local/go/bin` to your PATH automatically.
3. Restart any open terminal sessions for the change to take effect.
4. Verify the installation

```bash
go version
```

# Running a Backend

1. Initialize the module (only once), to maintain consistency follow this command :

Note : Do this inside `src` :

```bash
go mod init stima
```

2. Run the program
   Do this inside `src`

```bash
go run backend/main.go
```

or if already inside `src/backend` :

```bash
go run main.go
```

Note : Atur" aja

3. Or compile into a binary (sebenernya gausa go run aja cukup)

```bash
go build -o bin/server ./cmd/
./bin/server
```

# Run With Docker

Use Docker Compose from the repository root so backend and frontend run together.

1. Build both images

```bash
docker compose build
```

Note: frontend browser requests use same-origin `/api/traverse`.
The frontend server proxies those requests to backend using `BACKEND_INTERNAL_URL`.

2. Start both containers

```bash
docker compose up
```

3. Open the apps

- Frontend: http://localhost
- Backend health check: http://localhost:8080/health

4. Stop containers

```bash
docker compose down
```

Useful options:

- Rebuild and start in one command:

```bash
docker compose up --build
```

- Run in background:

```bash
docker compose up -d
```

- View logs:

```bash
docker compose logs -f
```

## Azure VM Notes

If frontend shows `NetworkError when attempting to fetch resource`, rebuild and restart so the proxy route and env vars are applied:

```bash
docker compose down
docker compose up -d --build
```

Then verify:

```bash
docker compose ps
curl -i http://localhost/api/traverse
curl -i http://localhost:8080/health
```

## Link to Azure Deployment
[Akses aplikasi di Azure](http://4.194.26.56)

> **Disclaimer:** Deployment mungkin sedang tidak aktif untuk menghindari biaya. Silakan hubungi salah satu anggota tim untuk mengaktifkannya kembali.

## Tabel Evaluasi Pengerjaan

| No. | Poin | Ya | Tidak |
|-----|------|----|-------|
| 1 | Aplikasi berhasil di kompilasi tanpa kesalahan | ✅ | |
| 2 | Aplikasi berhasil dijalankan | ✅ | |
| 3 | Aplikasi dapat menerima input URL web, pilihan algoritma, CSS selector, dan jumlah hasil | ✅ | |
| 4 | Aplikasi dapat melakukan scraping terhadap web pada input | ✅ | |
| 5 | Aplikasi dapat menampilkan visualisasi pohon DOM | ✅ | |
| 6 | Aplikasi dapat menelusuri pohon DOM dan menampilkan hasil penelusuran | ✅ | |
| 7 | Aplikasi dapat menandai jalur tempuh oleh algoritma | ✅ | |
| 8 | Aplikasi dapat menyimpan jalur yang ditempuh algoritma dalam traversal log | ✅ | |
| 9 | [Bonus] Membuat video | | ❌ |
| 10 | [Bonus] Deploy aplikasi | ✅ | |
| 11 | [Bonus] Implementasi animasi pada penelusuran pohon | ✅ | |
| 12 | [Bonus] Implementasi multithreading | | ❌ |
| 13 | [Bonus] Implementasi LCA Binary Lifting | ✅ | |

## Tabel Anggota

| No. | Nama | NIM |
|-----|------|----|
| 1 | Stevanus Agutaf Wongso | 13524020 |
| 2 | Jonathan Kris Wicaksono | 13524023 |
| 3 | Philipp Hamara | 13524101 |
