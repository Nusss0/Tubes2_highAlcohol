package main

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

// domAttribute adalah bentuk atribut yang dikirim ke FE.
type domAttribute struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// domTreeNode adalah bentuk rekursif pohon yang dikirim ke FE untuk dirender.
type domTreeNode struct {
	ID          string         `json:"id"`
	Label       string         `json:"label"`
	TagName     string         `json:"tagName"`
	Depth       int            `json:"depth"`
	Attributes  []domAttribute `json:"attributes"`
	TextPreview string         `json:"textPreview"`
	IsMatch     bool           `json:"isMatch"`
	Children    []domTreeNode  `json:"children"`
}

// traversalStep mencatat satu langkah BFS/DFS untuk animasi di FE.
type traversalStep struct {
	Order    int      `json:"order"`
	NodeID   string   `json:"nodeId"`
	Label    string   `json:"label"`
	Depth    int      `json:"depth"`
	Matched  bool     `json:"matched"`
	Frontier []string `json:"frontier"`
	Message  string   `json:"message"`
}

// traversalMetrics adalah ringkasan yang ditampilkan FE.
type traversalMetrics struct {
	Algorithm    string `json:"algorithm"`
	Selector     string `json:"selector"`
	SourceType   string `json:"sourceType"`
	MaxDepth     int    `json:"maxDepth"`
	TotalNodes   int    `json:"totalNodes"`
	NodesVisited int    `json:"nodesVisited"`
	MatchesFound int    `json:"matchesFound"`
	ElapsedMs    int    `json:"elapsedMs"`
}

// traversalResponse adalah payload akhir yang dikembalikan ke FE.
type traversalResponse struct {
	Tree             domTreeNode      `json:"tree"`
	Steps            []traversalStep  `json:"steps"`
	Metrics          traversalMetrics `json:"metrics"`
	VisitedOrderByID map[string]int   `json:"visitedOrderById"`
	MatchedNodeIDs   []string         `json:"matchedNodeIds"`
	StopReason       string           `json:"stopReason"`
}

// AnalyzeTraversal menjalankan BFS/DFS pada pohon HTML.
func AnalyzeTraversal(html, sourceType, algorithm string, sel *Selector, resultScope string, limit int) traversalResponse {
	start := time.Now()
	tokens := Tokenize(html)
	tree := Parse(tokens)
	idx := BuildIndex(tree)

	idByNode := make(map[*Node]int, len(idx.Nodes))
	for id, n := range idx.Nodes {
		idByNode[n] = id
	}

	rawSelector := ""
	if sel != nil {
		rawSelector = sel.Raw
	}

	maxMatches := int(^uint(0) >> 1)
	if resultScope == "top" {
		maxMatches = limit
	}

	steps := make([]traversalStep, 0, len(idx.Nodes))
	visited := make(map[string]int, len(idx.Nodes))
	matchedNodeIDs := make([]string, 0)

	type item struct {
		id int
	}

	frontier := make([]item, 0, len(idx.Nodes))
	for _, child := range tree.Root.Child {
		if childID, ok := idByNode[child]; ok {
			frontier = append(frontier, item{id: childID})
		}
	}

	order := 0
	stopped := false
	for len(frontier) > 0 {
		var currentID int
		if algorithm == "dfs" {
			last := len(frontier) - 1
			currentID = frontier[last].id
			frontier = frontier[:last]
		} else {
			currentID = frontier[0].id
			frontier = frontier[1:]
		}

		node := idx.Nodes[currentID]
		if node == nil {
			continue
		}

		// DFS push child dari kanan ke kiri supaya saat di-pop urutannya mengikuti dokumen
		if algorithm == "dfs" {
			for i := len(idx.Children[currentID]) - 1; i >= 0; i-- {
				frontier = append(frontier, item{id: idx.Children[currentID][i]})
			}
		} else {
			for _, childID := range idx.Children[currentID] {
				frontier = append(frontier, item{id: childID})
			}
		}

		order++
		nodeID := nodeIDFromInt(currentID)
		matched := MatchSelector(node, sel)
		if matched && len(matchedNodeIDs) < maxMatches {
			matchedNodeIDs = append(matchedNodeIDs, nodeID)
		}

		visited[nodeID] = order
		frontierLabels := make([]string, 0, len(frontier))
		for _, f := range frontier {
			frontierLabels = append(frontierLabels, labelForNode(idx.Nodes[f.id]))
		}

		message := fmt.Sprintf("Visited %s at depth %d.", labelForNode(node), idx.Depth[currentID])
		if matched {
			message = fmt.Sprintf("Matched %s for selector %s.", labelForNode(node), rawSelector)
		}

		steps = append(steps, traversalStep{
			Order:    order,
			NodeID:   nodeID,
			Label:    labelForNode(node),
			Depth:    idx.Depth[currentID],
			Matched:  matched,
			Frontier: frontierLabels,
			Message:  message,
		})

		if resultScope == "top" && len(matchedNodeIDs) >= maxMatches {
			stopped = true
			break
		}
	}

	treeJSON := buildTreeJSON(tree.Root, idByNode, sel, 0)
	elapsed := int(time.Since(start).Milliseconds())
	if elapsed < 1 {
		elapsed = 1
	}

	stopReason := fmt.Sprintf("Traversal finished after visiting %d nodes.", len(steps))
	if stopped {
		stopReason = fmt.Sprintf("Stopped after top %d matches.", maxMatches)
	}

	return traversalResponse{
		Tree:  treeJSON,
		Steps: steps,
		Metrics: traversalMetrics{
			Algorithm:    algorithm,
			Selector:     rawSelector,
			SourceType:   sourceType,
			MaxDepth:     idx.MaxDepth,
			TotalNodes:   len(idx.Nodes),
			NodesVisited: len(steps),
			MatchesFound: len(matchedNodeIDs),
			ElapsedMs:    elapsed,
		},
		VisitedOrderByID: visited,
		MatchedNodeIDs:   matchedNodeIDs,
		StopReason:       stopReason,
	}
}

func buildTreeJSON(node *Node, idByNode map[*Node]int, sel *Selector, depth int) domTreeNode {
	nodeID := "root"
	if id, ok := idByNode[node]; ok {
		nodeID = nodeIDFromInt(id)
	}

	children := make([]domTreeNode, 0, len(node.Child))
	for _, c := range node.Child {
		children = append(children, buildTreeJSON(c, idByNode, sel, depth+1))
	}

	attrs := attrsToSlice(node.Attr)
	label := labelForNode(node)
	tagName := node.Tag
	if tagName == "" {
		tagName = "#text"
	}
	if label == "" {
		label = "#text"
	}

	textPreview := strings.TrimSpace(node.Text)
	if len(textPreview) > 140 {
		textPreview = textPreview[:137] + "..."
	}

	isMatch := sel != nil && MatchSelector(node, sel)

	return domTreeNode{
		ID:          nodeID,
		Label:       label,
		TagName:     tagName,
		Depth:       depth,
		Attributes:  attrs,
		TextPreview: textPreview,
		IsMatch:     isMatch,
		Children:    children,
	}
}

func attrsToSlice(attr map[string]string) []domAttribute {
	if len(attr) == 0 {
		return []domAttribute{}
	}
	keys := make([]string, 0, len(attr))
	for k := range attr {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	out := make([]domAttribute, 0, len(keys))
	for _, k := range keys {
		out = append(out, domAttribute{Name: k, Value: attr[k]})
	}
	return out
}

func labelForNode(node *Node) string {
	if node == nil {
		return "unknown"
	}
	if node.Tag == "" {
		return "#text"
	}

	label := node.Tag
	if id, ok := node.Attr["id"]; ok && id != "" {
		label += "#" + id
	}
	if classRaw, ok := node.Attr["class"]; ok && classRaw != "" {
		for _, c := range strings.Fields(classRaw) {
			if c != "" {
				label += "." + c
			}
		}
	}
	return label
}

func nodeIDFromInt(id int) string {
	return fmt.Sprintf("node-%d", id)
}
