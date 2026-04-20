package main

// tracks current position in tree during parsing
type Stack struct {
	items []*Node
}

func (s *Stack) Push(node *Node) {
	s.items = append(s.items, node)
}

func (s *Stack) Pop() *Node {
	if len(s.items) == 0 {
		return nil
	}
	top := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1] // shrink slice by one
	return top
}

func (s *Stack) Peek() *Node {
	if len(s.items) == 0 {
		return nil
	}
	return s.items[len(s.items)-1] // top without removing
}

func (s *Stack) IsEmpty() bool {
	return len(s.items) == 0
}

// Parse builds a Tree from a flat token list using a stack to track depth
func Parse(tokens []Token) *Tree {
	tree := &Tree{Root: NewNode("root")}
	stack := &Stack{}
	stack.Push(tree.Root) // root always the base of the stack

	for _, token := range tokens {
		switch token.Type {
		case OpenTag:
			if stack.Peek() == nil {
				continue // skip if stack is unexpectedly empty
			}
			node := NewNode(token.Tag)
			node.Attr = token.Attr
			stack.Peek().AddChild(node) // attach to current parent
			stack.Push(node)            // go deeper

		case CloseTag:
			// only pop if top of stack matches
			if !stack.IsEmpty() && stack.Peek() != nil && stack.Peek().Tag == token.Tag {
				stack.Pop() // go back up to parent
			}

		case SelfClose:
			if stack.Peek() == nil {
				continue
			}
			node := NewNode(token.Tag)
			node.Attr = token.Attr
			stack.Peek().AddChild(node) // attach but don't push

		case Text:
			if stack.Peek() == nil {
				continue
			}
			node := NewNode("") // empty tag = text node
			node.Text = token.Content
			stack.Peek().AddChild(node) // attach but don't push
		}
	}

	return tree
}
