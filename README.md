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
   Do this inside `src` :

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
