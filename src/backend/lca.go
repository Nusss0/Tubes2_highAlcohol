package main

import "fmt"

// LCAEngine menjawab query Lowest Common Ancestor pada DOMIndex dalam
// O(log N) menggunakan teknik binary lifting.
type LCAEngine struct {
	idx *DOMIndex
	up  [][]int // up[k][v] = leluhur 2^k dari v, atau -1 jika melewati root
	k   int     // jumlah level: k terkecil sehingga 2^k >= n
}

// NewLCAEngine membangun tabel leluhur.
func NewLCAEngine(idx *DOMIndex) *LCAEngine {
	if idx == nil || len(idx.Nodes) == 0 {
		return &LCAEngine{idx: idx, k: 0}
	}
	n := len(idx.Nodes)
	k := 1
	for (1 << k) < n {
		k++
	}
	up := make([][]int, k)
	for i := range up {
		up[i] = make([]int, n)
	}
	for v := range n {
		up[0][v] = idx.Parent[v]
	}
	for j := 1; j < k; j++ {
		for v := range n {
			mid := up[j-1][v]
			if mid == -1 {
				up[j][v] = -1
			} else {
				up[j][v] = up[j-1][mid]
			}
		}
	}
	return &LCAEngine{idx: idx, up: up, k: k}
}

// LCAResult berisi informasi minimum yang dibutuhkan pemanggil: kedua
// node asal, LCA nya, kedalamannya, dan jalur dari masing-masing node
// naik sampai LCA.
type LCAResult struct {
	NodeA    int
	NodeB    int
	LCA      int
	LCADepth int
	PathA    []int // nodeA, ..., LCA
	PathB    []int // nodeB, ..., LCA
}

// Query menjalankan dua fase binary lifting: samakan kedalaman dua node,
// lalu naikkan keduanya bersamaan dengan lompatan terbesar yang masih
// menjaga mereka di node berbeda.
func (e *LCAEngine) Query(u, v int) (*LCAResult, error) {
	if e == nil || e.idx == nil {
		return nil, fmt.Errorf("LCA engine kosong")
	}
	n := len(e.idx.Nodes)
	if u < 0 || u >= n || v < 0 || v >= n {
		return nil, fmt.Errorf("node id di luar rentang: u=%d v=%d (n=%d)", u, v, n)
	}
	a, b := u, v
	if e.idx.Depth[a] < e.idx.Depth[b] {
		a, b = b, a // swap agar a menjadi yang lebih dalam
	}
	diff := e.idx.Depth[a] - e.idx.Depth[b]
	for j := 0; diff > 0 && j < e.k; j++ {
		if diff&(1<<j) != 0 {
			a = e.up[j][a]
		}
	}
	var lca int
	if a == b {
		lca = a // salah satu adalah leluhur mereka berdua
	} else {
		for j := e.k - 1; j >= 0; j-- {
			if e.up[j][a] != e.up[j][b] {
				a = e.up[j][a]
				b = e.up[j][b]
			}
		}
		lca = e.idx.Parent[a]
	}
	return &LCAResult{
		NodeA:    u,
		NodeB:    v,
		LCA:      lca,
		LCADepth: e.idx.Depth[lca],
		PathA:    pathUp(e.idx, u, lca),
		PathB:    pathUp(e.idx, v, lca),
	}, nil
}

// pathUp menelusuri parent darii from ke atas hingga mencapai to.
func pathUp(idx *DOMIndex, from, to int) []int {
	out := []int{from}
	cur := from
	for cur != to && cur != -1 {
		cur = idx.Parent[cur]
		out = append(out, cur)
	}
	return out
}
