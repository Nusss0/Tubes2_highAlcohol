package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

func main() {
	mode := "server"
	if len(os.Args) > 1 {
		mode = strings.ToLower(os.Args[1])
	}

	if mode == "cli" {
		runCLI()
		return
	}

	runServer()
}

func runCLI() {
	var op string
	fmt.Println("Choose Input Method : ")
	fmt.Println("1. URL (Unavail)")
	fmt.Println("2. HTML (File)")
	fmt.Scan(&op) // read user choice

	switch op {
	case "1": // url to html converter
		fmt.Println("Not yett!!")

	case "2": // HTML from file
		var fileName string
		fmt.Println("Input FileName : ")
		fmt.Scan(&fileName)

		path := "input/" + fileName
		content, err := os.ReadFile(path) // read file as raw bytes
		if err != nil {
			fmt.Println("[ERROR]", err)
			return
		}

		rawHtml := string(content)  // convert bytes to string
		tokens := Tokenize(rawHtml) // lex into tokens
		tree := Parse(tokens)       // build tree from tokens
		PrintTree(tree.Root, 0)     // display result

	default:
		fmt.Println("[ERROR] Invalid Input!")
	}
}

func runServer() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/api/traverse", traverseHandler)

	server := &http.Server{
		Addr:         ":8080",
		Handler:      withCORS(mux),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	fmt.Println("Backend server listening on http://localhost:8080")
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Println("[ERROR]", err)
	}
}

type traversalRequest struct {
	SourceType  string `json:"sourceType"`
	Source      string `json:"source"`
	Algorithm   string `json:"algorithm"`
	Selector    string `json:"selector"`
	ResultScope string `json:"resultScope"`
	Limit       int    `json:"limit"`
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func traverseHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req traversalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	req.SourceType = strings.ToLower(strings.TrimSpace(req.SourceType))
	req.Source = strings.TrimSpace(req.Source)
	req.Algorithm = strings.ToLower(strings.TrimSpace(req.Algorithm))
	req.Selector = strings.TrimSpace(req.Selector)
	req.ResultScope = strings.ToLower(strings.TrimSpace(req.ResultScope))

	if req.SourceType != "html" && req.SourceType != "url" {
		http.Error(w, "sourceType must be html or url", http.StatusBadRequest)
		return
	}
	if req.Algorithm != "bfs" && req.Algorithm != "dfs" {
		http.Error(w, "algorithm must be bfs or dfs", http.StatusBadRequest)
		return
	}
	if req.ResultScope != "top" && req.ResultScope != "all" {
		http.Error(w, "resultScope must be top or all", http.StatusBadRequest)
		return
	}
	if req.Source == "" {
		http.Error(w, "source cannot be empty", http.StatusBadRequest)
		return
	}
	if req.Selector == "" {
		req.Selector = "*"
	}
	if req.Limit < 1 {
		req.Limit = 1
	}

	sel, err := ParseSelector(req.Selector)
	if err != nil {
		http.Error(w, "invalid selector: "+err.Error(), http.StatusBadRequest)
		return
	}

	html, err := resolveHTMLSource(req.SourceType, req.Source)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp := AnalyzeTraversal(html, req.SourceType, req.Algorithm, sel, req.ResultScope, req.Limit)
	writeJSON(w, http.StatusOK, resp)
}

func resolveHTMLSource(sourceType, source string) (string, error) {
	if sourceType == "html" {
		return source, nil
	}

	parsed, err := url.Parse(source)
	if err != nil || parsed == nil {
		return "", fmt.Errorf("invalid URL")
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return "", fmt.Errorf("URL scheme must be http or https")
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(parsed.String())
	if err != nil {
		return "", fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("failed to fetch URL: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read URL body: %w", err)
	}

	return string(body), nil
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
