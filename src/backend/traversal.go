package main

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

type domAttribute struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

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

type traversalStep struct {
	Order    int      `json:"order"`
	NodeID   string   `json:"nodeId"`
	Label    string   `json:"label"`
	Depth    int      `json:"depth"`
	Matched  bool     `json:"matched"`
	Frontier []string `json:"frontier"`
	Message  string   `json:"message"`
}

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

type traversalResponse struct {
	Tree             domTreeNode      `json:"tree"`
	Steps            []traversalStep  `json:"steps"`
	Metrics          traversalMetrics `json:"metrics"`
	VisitedOrderByID map[string]int   `json:"visitedOrderById"`
	MatchedNodeIDs   []string         `json:"matchedNodeIds"`
	StopReason       string           `json:"stopReason"`
}

func AnalyzeTraversal(html, sourceType, algorithm, selector, resultScope string, limit int) traversalResponse {
	start := time.Now()
	tokens := Tokenize(html)
	tree := Parse(tokens)
	idx := BuildIndex(tree)

	idByNode := make(map[*Node]int, len(idx.Nodes))
	for id, n := range idx.Nodes {
		idByNode[n] = id
	}

	matcher := newSelectorMatcher(selector)

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
		matched := matcher.matchesByID(currentID, idx)
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
			message = fmt.Sprintf("Matched %s for selector %s.", labelForNode(node), selector)
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

	treeJSON := buildTreeJSON(tree.Root, idByNode, matcher, idx, 0)
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
			Selector:     selector,
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

func buildTreeJSON(node *Node, idByNode map[*Node]int, matcher *selectorMatcher, idx *DOMIndex, depth int) domTreeNode {
	nodeID := "root"
	if id, ok := idByNode[node]; ok {
		nodeID = nodeIDFromInt(id)
	}

	children := make([]domTreeNode, 0, len(node.Child))
	for _, c := range node.Child {
		children = append(children, buildTreeJSON(c, idByNode, matcher, idx, depth+1))
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

	isMatch := false
	if matcher != nil {
		if id, ok := idByNode[node]; ok {
			isMatch = matcher.matchesByID(id, idx)
		}
	}

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

type selectorMatcher struct {
	groups [][]simpleSelector
}

type simpleSelector struct {
	tag        string
	id         string
	classes    []string
	attributes []string
	wildcard   bool
}

func newSelectorMatcher(selector string) *selectorMatcher {
	sel := strings.TrimSpace(selector)
	if sel == "" {
		sel = "*"
	}

	groups := make([][]simpleSelector, 0)
	for _, chunk := range strings.Split(sel, ",") {
		chunk = strings.TrimSpace(chunk)
		if chunk == "" {
			continue
		}
		parts := strings.Fields(chunk)
		selectors := make([]simpleSelector, 0, len(parts))
		for _, p := range parts {
			selectors = append(selectors, parseSimpleSelector(p))
		}
		if len(selectors) > 0 {
			groups = append(groups, selectors)
		}
	}

	if len(groups) == 0 {
		groups = [][]simpleSelector{{{wildcard: true}}}
	}

	return &selectorMatcher{groups: groups}
}

func parseSimpleSelector(raw string) simpleSelector {
	raw = strings.TrimSpace(raw)
	if raw == "*" {
		return simpleSelector{wildcard: true}
	}

	sel := simpleSelector{}
	i := 0
	for i < len(raw) {
		switch raw[i] {
		case '#':
			j := i + 1
			for j < len(raw) && isSelectorChar(raw[j]) {
				j++
			}
			sel.id = raw[i+1 : j]
			i = j
		case '.':
			j := i + 1
			for j < len(raw) && isSelectorChar(raw[j]) {
				j++
			}
			if j > i+1 {
				sel.classes = append(sel.classes, raw[i+1:j])
			}
			i = j
		case '[':
			j := strings.IndexByte(raw[i:], ']')
			if j == -1 {
				i = len(raw)
				continue
			}
			content := strings.TrimSpace(raw[i+1 : i+j])
			if content != "" {
				name := content
				if eq := strings.IndexByte(content, '='); eq >= 0 {
					name = strings.TrimSpace(content[:eq])
				}
				if name != "" {
					sel.attributes = append(sel.attributes, strings.ToLower(name))
				}
			}
			i = i + j + 1
		default:
			j := i
			for j < len(raw) && isSelectorChar(raw[j]) {
				j++
			}
			if j > i {
				sel.tag = strings.ToLower(raw[i:j])
			}
			i = j
		}
	}

	if sel.tag == "" && sel.id == "" && len(sel.classes) == 0 && len(sel.attributes) == 0 {
		sel.wildcard = true
	}

	return sel
}

func isSelectorChar(b byte) bool {
	return (b >= 'a' && b <= 'z') ||
		(b >= 'A' && b <= 'Z') ||
		(b >= '0' && b <= '9') ||
		b == '-' || b == '_'
}

func (m *selectorMatcher) matchesByID(nodeID int, idx *DOMIndex) bool {
	if idx == nil || nodeID < 0 || nodeID >= len(idx.Nodes) {
		return false
	}
	for _, group := range m.groups {
		if m.matchesGroup(nodeID, group, idx) {
			return true
		}
	}
	return false
}

func (m *selectorMatcher) matchesGroup(nodeID int, group []simpleSelector, idx *DOMIndex) bool {
	if len(group) == 0 {
		return false
	}

	currentID := nodeID
	for i := len(group) - 1; i >= 0; i-- {
		if currentID < 0 || currentID >= len(idx.Nodes) {
			return false
		}
		if !matchesSimpleSelector(idx.Nodes[currentID], group[i]) {
			if i == len(group)-1 {
				return false
			}
			currentID = idx.Parent[currentID]
			i++
			continue
		}
		if i > 0 {
			currentID = idx.Parent[currentID]
		}
	}
	return true
}

func matchesSimpleSelector(node *Node, sel simpleSelector) bool {
	if node == nil || node.Tag == "" {
		return false
	}
	if sel.wildcard {
		return true
	}

	if sel.tag != "" && node.Tag != sel.tag {
		return false
	}
	if sel.id != "" {
		if nodeID, ok := node.Attr["id"]; !ok || nodeID != sel.id {
			return false
		}
	}
	if len(sel.classes) > 0 {
		classRaw := node.Attr["class"]
		classSet := make(map[string]struct{})
		for _, c := range strings.Fields(classRaw) {
			classSet[c] = struct{}{}
		}
		for _, c := range sel.classes {
			if _, ok := classSet[c]; !ok {
				return false
			}
		}
	}
	for _, attr := range sel.attributes {
		if _, ok := node.Attr[attr]; !ok {
			return false
		}
	}

	return true
}
