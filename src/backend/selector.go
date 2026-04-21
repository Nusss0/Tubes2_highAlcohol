package main

import (
	"fmt"
	"slices"
	"strings"
)

type Combinator int

const (
	CombNone Combinator = iota
	CombDescendant
	CombChild
	CombAdjacent
	CombGenSibling
)

func (c Combinator) String() string {
	switch c {
	case CombDescendant:
		return " "
	case CombChild:
		return ">"
	case CombAdjacent:
		return "+"
	case CombGenSibling:
		return "~"
	default:
		return ""
	}
}

// AttrMatch untuk selector atribut [foo] atau [foo="bar"].
type AttrMatch struct {
	Name  string
	Op    string // "" = presence, "=" = exact
	Value string
}

// CompoundSelector menampung simple selector yang menempel pada satu elemen yang sama.
type CompoundSelector struct {
	Universal bool
	Tag       string
	ID        string
	Classes   []string
	Attrs     []AttrMatch
}

// SelectorPart = satu compound + combinator yang menghubungkannya ke compound
// sebelumnya. Part pertama selalu CombNone.
type SelectorPart struct {
	Combinator Combinator
	Compound   CompoundSelector
}

// Selector adalah hasil parse string CSS. Groups berisi satu rantai per
// alternatif yang dipisah koma. Node match bila minimal satu grup match.
type Selector struct {
	Raw    string
	Groups [][]SelectorPart
}

// ParseSelector mengubah string menjadi Selector. Mendukung combinator (' ', '>', '+', '~'),
// simple selector (tag, .class, #id, *, [attr], [attr=value]), dan pengelompokan koma.
func ParseSelector(raw string) (*Selector, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, fmt.Errorf("selector is empty")
	}

	sel := &Selector{Raw: raw}
	for _, chunk := range splitTopLevelCommas(trimmed) {
		chunk = strings.TrimSpace(chunk)
		if chunk == "" {
			return nil, fmt.Errorf("empty group in selector %q", raw)
		}
		parts, err := parseSelectorGroup(chunk)
		if err != nil {
			return nil, err
		}
		sel.Groups = append(sel.Groups, parts)
	}
	if len(sel.Groups) == 0 {
		return nil, fmt.Errorf("selector parsed to zero groups")
	}
	return sel, nil
}

// splitTopLevelCommas memecah pada ',' yang berada di luar [ ... ].
func splitTopLevelCommas(s string) []string {
	var out []string
	depth := 0
	last := 0
	for i := 0; i < len(s); i++ {
		switch s[i] {
		case '[':
			depth++
		case ']':
			if depth > 0 {
				depth--
			}
		case ',':
			if depth == 0 {
				out = append(out, s[last:i])
				last = i + 1
			}
		}
	}
	out = append(out, s[last:])
	return out
}

// parseSelectorGroup memparse satu rantai bebas koma.
func parseSelectorGroup(chunk string) ([]SelectorPart, error) {
	tokens := tokenizeSelector(chunk)
	if len(tokens) == 0 {
		return nil, fmt.Errorf("selector group %q contains no tokens", chunk)
	}

	var parts []SelectorPart
	pendingComb := CombNone
	expectCompound := true

	for _, tok := range tokens {
		switch tok.kind {
		case selTokWS:
			// whitespace jadi descendant combinator kalau ada compound sebelumnya
			if !expectCompound && pendingComb == CombNone {
				pendingComb = CombDescendant
				expectCompound = true
			}
		case selTokGT, selTokPlus, selTokTilde:
			if expectCompound && len(parts) == 0 {
				return nil, fmt.Errorf("group %q cannot start with combinator %q", chunk, tok.value)
			}
			// combinator eksplisit meng-override pending descendant
			pendingComb = combFromToken(tok.kind)
			expectCompound = true
		case selTokCompound:
			cs, err := parseCompound(tok.value)
			if err != nil {
				return nil, err
			}
			parts = append(parts, SelectorPart{Combinator: pendingComb, Compound: cs})
			pendingComb = CombNone
			expectCompound = false
		}
	}

	if len(parts) == 0 {
		return nil, fmt.Errorf("group %q parsed to zero parts", chunk)
	}
	if expectCompound && pendingComb != CombNone {
		return nil, fmt.Errorf("group %q ends with dangling combinator %q", chunk, pendingComb)
	}
	return parts, nil
}

// selTok = token internal: compound, whitespace, atau satu karakter combinator.
type selTokKind int

const (
	selTokCompound selTokKind = iota
	selTokWS
	selTokGT
	selTokPlus
	selTokTilde
)

type selTok struct {
	kind  selTokKind
	value string
}

func combFromToken(k selTokKind) Combinator {
	switch k {
	case selTokGT:
		return CombChild
	case selTokPlus:
		return CombAdjacent
	case selTokTilde:
		return CombGenSibling
	default:
		return CombDescendant
	}
}

// tokenizeSelector menscan per karakter.
func tokenizeSelector(s string) []selTok {
	var tokens []selTok
	i := 0
	for i < len(s) {
		c := s[i]
		switch {
		case c == ' ' || c == '\t' || c == '\n' || c == '\r':
			start := i
			for i < len(s) && (s[i] == ' ' || s[i] == '\t' || s[i] == '\n' || s[i] == '\r') {
				i++
			}
			tokens = append(tokens, selTok{selTokWS, s[start:i]})
		case c == '>':
			tokens = append(tokens, selTok{selTokGT, ">"})
			i++
		case c == '+':
			tokens = append(tokens, selTok{selTokPlus, "+"})
			i++
		case c == '~':
			tokens = append(tokens, selTok{selTokTilde, "~"})
			i++
		default:
			start := i
			for i < len(s) {
				cc := s[i]
				if cc == ' ' || cc == '\t' || cc == '\n' || cc == '\r' ||
					cc == '>' || cc == '+' || cc == '~' {
					break
				}
				i++
			}
			tokens = append(tokens, selTok{selTokCompound, s[start:i]})
		}
	}
	return tokens
}

// parseCompound memecah sebuah compound menjadi simple selector pembentuknya.
func parseCompound(chunk string) (CompoundSelector, error) {
	cs := CompoundSelector{}
	if chunk == "" {
		return cs, fmt.Errorf("empty compound selector")
	}

	i := 0
	// tag / universal di depan (opsional)
	if chunk[0] == '*' {
		cs.Universal = true
		i = 1
	} else if isIdentStart(chunk[0]) {
		start := i
		for i < len(chunk) && isIdentPart(chunk[i]) {
			i++
		}
		cs.Tag = strings.ToLower(chunk[start:i])
	}

	// sisanya: .class / #id / [attr], urutan bebas
	for i < len(chunk) {
		c := chunk[i]
		switch c {
		case '.':
			i++
			start := i
			for i < len(chunk) && isIdentPart(chunk[i]) {
				i++
			}
			if start == i {
				return cs, fmt.Errorf("dangling '.' in compound %q", chunk)
			}
			cs.Classes = append(cs.Classes, strings.ToLower(chunk[start:i]))
		case '#':
			i++
			start := i
			for i < len(chunk) && isIdentPart(chunk[i]) {
				i++
			}
			if start == i {
				return cs, fmt.Errorf("dangling '#' in compound %q", chunk)
			}
			if cs.ID != "" {
				return cs, fmt.Errorf("multiple ids in compound %q", chunk)
			}
			cs.ID = chunk[start:i] // id case-sensitive di HTML
		case '[':
			end := strings.IndexByte(chunk[i:], ']')
			if end < 0 {
				return cs, fmt.Errorf("unclosed '[' in compound %q", chunk)
			}
			am, err := parseAttrMatch(chunk[i+1 : i+end])
			if err != nil {
				return cs, fmt.Errorf("bad attr in compound %q: %w", chunk, err)
			}
			cs.Attrs = append(cs.Attrs, am)
			i = i + end + 1
		default:
			return cs, fmt.Errorf("unexpected char %q in compound %q", c, chunk)
		}
	}

	if !cs.Universal && cs.Tag == "" && cs.ID == "" && len(cs.Classes) == 0 && len(cs.Attrs) == 0 {
		return cs, fmt.Errorf("compound selector %q matches nothing", chunk)
	}
	return cs, nil
}

// parseAttrMatch memparse isi di antara [ dan ].
func parseAttrMatch(body string) (AttrMatch, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return AttrMatch{}, fmt.Errorf("empty attribute selector")
	}
	eq := strings.IndexByte(body, '=')
	if eq < 0 {
		return AttrMatch{Name: strings.ToLower(body)}, nil
	}
	name := strings.TrimSpace(body[:eq])
	value := strings.TrimSpace(body[eq+1:])
	if name == "" {
		return AttrMatch{}, fmt.Errorf("attribute selector missing name")
	}
	if len(value) >= 2 {
		first, last := value[0], value[len(value)-1]
		if (first == '"' || first == '\'') && first == last {
			value = value[1 : len(value)-1]
		}
	}
	return AttrMatch{Name: strings.ToLower(name), Op: "=", Value: value}, nil
}

func isIdentStart(c byte) bool {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' || c == '-'
}

func isIdentPart(c byte) bool {
	return isIdentStart(c) || (c >= '0' && c <= '9')
}

// classesOf memecah atribut class node menjadi slice lowercased.
func classesOf(n *Node) []string {
	if n == nil || n.Attr == nil {
		return nil
	}
	raw, ok := n.Attr["class"]
	if !ok || raw == "" {
		return nil
	}
	parts := strings.Fields(raw)
	for i, p := range parts {
		parts[i] = strings.ToLower(p)
	}
	return parts
}

// MatchCompound mengecek satu compound terhadap node. Node teks (Tag=="")
// sengaja tidak pernah match supaya selector selalu menyasar elemen.
func MatchCompound(n *Node, cs CompoundSelector) bool {
	if n == nil || n.Tag == "" {
		return false
	}
	if !cs.Universal && cs.Tag != "" && cs.Tag != n.Tag {
		return false
	}
	if cs.ID != "" {
		if n.Attr == nil || n.Attr["id"] != cs.ID {
			return false
		}
	}
	if len(cs.Classes) > 0 {
		nodeClasses := classesOf(n)
		for _, want := range cs.Classes {
			if !slices.Contains(nodeClasses, want) {
				return false
			}
		}
	}
	for _, a := range cs.Attrs {
		v, ok := n.Attr[a.Name]
		if !ok {
			return false
		}
		if a.Op == "=" && v != a.Value {
			return false
		}
	}
	return true
}

// MatchSelector = true bila minimal satu grup match.
func MatchSelector(n *Node, sel *Selector) bool {
	if sel == nil || len(sel.Groups) == 0 {
		return false
	}
	for _, parts := range sel.Groups {
		if matchSelectorGroup(n, parts) {
			return true
		}
	}
	return false
}

// matchSelectorGroup mengevaluasi rantai dari kanan ke kiri
func matchSelectorGroup(n *Node, parts []SelectorPart) bool {
	if len(parts) == 0 {
		return false
	}
	last := parts[len(parts)-1]
	if !MatchCompound(n, last.Compound) {
		return false
	}
	current := n
	for i := len(parts) - 2; i >= 0; i-- {
		linkComb := parts[i+1].Combinator
		ok, next := matchAncestor(current, parts[i].Compound, linkComb)
		if !ok {
			return false
		}
		current = next
	}
	return true
}

func matchAncestor(from *Node, cs CompoundSelector, comb Combinator) (bool, *Node) {
	switch comb {
	case CombChild:
		p := from.Parent
		if p != nil && MatchCompound(p, cs) {
			return true, p
		}
		return false, nil
	case CombDescendant:
		for p := from.Parent; p != nil; p = p.Parent {
			if MatchCompound(p, cs) {
				return true, p
			}
		}
		return false, nil
	case CombAdjacent:
		prev := previousElementSibling(from)
		if prev != nil && MatchCompound(prev, cs) {
			return true, prev
		}
		return false, nil
	case CombGenSibling:
		for s := previousElementSibling(from); s != nil; s = previousElementSibling(s) {
			if MatchCompound(s, cs) {
				return true, s
			}
		}
		return false, nil
	default:
		return false, nil
	}
}

func previousElementSibling(n *Node) *Node {
	if n == nil || n.Parent == nil {
		return nil
	}
	siblings := n.Parent.Child
	idx := -1
	for i, s := range siblings {
		if s == n {
			idx = i
			break
		}
	}
	for i := idx - 1; i >= 0; i-- {
		if siblings[i].Tag != "" {
			return siblings[i]
		}
	}
	return nil
}
