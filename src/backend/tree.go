package main

import (
	"fmt"
	"strings"
)

type Tree struct {
	Root *Node
}

type Node struct {
	Tag    string            // tag name, empty string means text node
	Attr   map[string]string // attribute key-value pairs
	Text   string            // text content
	Child  []*Node           // list of child nodes
	Parent *Node             // pointer to parent
}

// creates a node with Attr initialized to avoid nil map panic
func NewNode(tag string) *Node {
	return &Node{
		Tag:  tag,
		Attr: make(map[string]string),
	}
}

// appends child to this node and sets child's Parent pointer
func (n *Node) AddChild(child *Node) {
	child.Parent = n
	n.Child = append(n.Child, child)
}

// prints the tree with indentation showing depth
func PrintTree(node *Node, depth int) {
	indent := strings.Repeat("  ", depth) // 2 spaces per level

	if node.Tag == "" {
		fmt.Printf("%s#text: %q\n", indent, node.Text) // text node
	} else {
		fmt.Printf("%s<%s> %v\n", indent, node.Tag, node.Attr) // element node
	}

	for _, child := range node.Child {
		PrintTree(child, depth+1) // recurse deeper
	}
}
