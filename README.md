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

Note: frontend browser requests are configured to call backend on `http://localhost:8080`.

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
