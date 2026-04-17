package main

// Membuat indexing pada pohon yang sudah di parse agar memudahkan lookup node
type DOMIndex struct {
	Nodes    []*Node // Nodes[id] = *Node
	Parent   []int   // Parent[id] = parent id, -1 untuk root
	Depth    []int   // Depth[id] = depth dari root (depth root = 0)
	Children [][]int // Children[id] = kumpulan id child
	MaxDepth int
}

// BuildIndex membuat id dari sebuah pohon dalam order BFS. ID dari root selalu 0.
func BuildIndex(tree *Tree) *DOMIndex {
	idx := &DOMIndex{}
	if tree == nil || tree.Root == nil {
		return idx
	}
	type entry struct {
		node   *Node
		parent int
		depth  int
	}
	queue := []entry{{tree.Root, -1, 0}}
	for len(queue) > 0 {
		e := queue[0]
		queue = queue[1:]
		id := len(idx.Nodes)
		idx.Nodes = append(idx.Nodes, e.node)
		idx.Parent = append(idx.Parent, e.parent)
		idx.Depth = append(idx.Depth, e.depth)
		idx.Children = append(idx.Children, nil)
		if e.depth > idx.MaxDepth {
			idx.MaxDepth = e.depth
		}
		if e.parent >= 0 {
			idx.Children[e.parent] = append(idx.Children[e.parent], id)
		}
		for _, c := range e.node.Child {
			queue = append(queue, entry{c, id, e.depth + 1})
		}
	}
	return idx
}
