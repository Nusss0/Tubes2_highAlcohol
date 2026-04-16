package main

type Tree struct {
	Root *Node
}

type Node struct {
	Tag    string
	Attr   map[string]string
	Text   string
	Child  []*Node
	Parent *Node
}

func NewNode(tag string) *Node {
	return &Node{
		Tag:  tag,
		Attr: make(map[string]string),
	}
}

func (n *Node) AddChild(child *Node) {
	child.Parent = n
	n.Child = append(n.Child, child)
}