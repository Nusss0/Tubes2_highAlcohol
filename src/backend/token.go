package main

import "strings"

type TokenType int

const (
	OpenTag   TokenType = iota // <div>, <p>
	CloseTag                   // </div>, </p>
	SelfClose                  // <br/>, <img>
	Text                       // raw text between tags≈
)

type Token struct {
	Type    TokenType
	Tag     string
	Attr    map[string]string
	Content string
}

// tags that never have children and don't need a closing tag
var voidElements = map[string]bool{
	"area": true, "base": true, "br": true, "col": true,
	"embed": true, "hr": true, "img": true, "input": true,
	"link": true, "meta": true, "param": true, "source": true,
	"track": true, "wbr": true,
}

// findTagEnd finds the closing > of a tag, skipping > inside quoted values
func findTagEnd(html string, start int) int {
	inQuote := false
	quoteChar := byte(0)
	for i := start; i < len(html); i++ {
		c := html[i]
		if inQuote {
			if c == quoteChar {
				inQuote = false // closing quote found
			}
		} else {
			if c == '"' || c == '\'' {
				inQuote = true // entering a quoted value
				quoteChar = c
			} else if c == '>' {
				return i // real tag end
			}
		}
	}
	return -1 // unclosed tag
}

// Tokenize breaks raw HTML into a flat list of tokens
func Tokenize(html string) []Token {
	var tokens []Token
	i := 0

	for i < len(html) {
		if html[i] == '<' {
			// check for comment BEFORE findTagEnd to avoid > inside comment confusing parser
			if i+3 < len(html) && html[i+1:i+4] == "!--" {
				commentEnd := strings.Index(html[i+4:], "-->") // find comment close
				if commentEnd == -1 {
					break // unclosed comment, stop
				}
				i = i + 4 + commentEnd + 3 // jump past -->
				continue
			}

			end := findTagEnd(html, i+1) // find matching >
			if end == -1 {
				break // unclosed tag, stop
			}

			raw := html[i+1 : end] // content between < and >
			i = end + 1            // move past >

			if strings.HasPrefix(raw, "!") {
				continue // skip DOCTYPE and other <! declarations
			}

			if strings.HasPrefix(raw, "/") {
				// closing tag
				fields := strings.Fields(raw[1:])
				if len(fields) == 0 {
					continue // ignore empty close tag
				}
				tokens = append(tokens, Token{
					Type: CloseTag,
					Tag:  strings.ToLower(fields[0]),
				})
			} else if strings.HasSuffix(raw, "/") {
				// explicit self-close
				tag, attr := parseTagAndAttr(raw[:len(raw)-1]) // strip trailing /
				tokens = append(tokens, Token{
					Type: SelfClose,
					Tag:  strings.ToLower(tag),
					Attr: attr,
				})
			} else {
				tag, attr := parseTagAndAttr(raw)
				tag = strings.ToLower(tag) // normalize tag name

				if voidElements[tag] {
					// treat void element as self-closing
					tokens = append(tokens, Token{
						Type: SelfClose,
						Tag:  tag,
						Attr: attr,
					})
					continue
				}

				if tag == "script" || tag == "style" {
					// grab raw content until closing tag
					closeTag := "</" + tag + ">"
					closeIdx := strings.Index(strings.ToLower(html[i:]), closeTag)
					if closeIdx == -1 {
						break // no closing tag
					}
					tokens = append(tokens, Token{Type: OpenTag, Tag: tag, Attr: attr})
					rawContent := strings.TrimSpace(html[i : i+closeIdx]) // content between tags
					if rawContent != "" {
						tokens = append(tokens, Token{Type: Text, Content: rawContent})
					}
					tokens = append(tokens, Token{Type: CloseTag, Tag: tag})
					i += closeIdx + len(closeTag) // jump past </script> or </style>
					continue
				}

				tokens = append(tokens, Token{
					Type: OpenTag,
					Tag:  tag,
					Attr: attr,
				})
			}
		} else {
			// text content between tags
			end := strings.Index(html[i:], "<") // find next tag
			if end == -1 {
				end = len(html) // text only
			} else {
				end += i
			}

			content := strings.TrimSpace(html[i:end]) // strip surrounding whitespace
			i = end

			if content != "" {
				tokens = append(tokens, Token{
					Type:    Text,
					Content: content,
				})
			}
		}
	}

	return tokens
}

// splits raw tag content into tag name and attribute map
func parseTagAndAttr(raw string) (string, map[string]string) {
	raw = strings.TrimSpace(raw)
	attr := make(map[string]string)

	fields := strings.Fields(raw) // split by any whitespace
	if len(fields) == 0 {
		return "", attr
	}

	tag := fields[0]
	attrStr := strings.TrimSpace(raw[len(tag):]) // everything after tag name

	for len(attrStr) > 0 {
		attrStr = strings.TrimSpace(attrStr)
		if len(attrStr) == 0 {
			break
		}

		eqIdx := strings.Index(attrStr, "=")
		spaceIdx := strings.IndexAny(attrStr, " \t\n\r") // any whitespace separator

		if eqIdx == -1 || (spaceIdx != -1 && spaceIdx < eqIdx) {
			// boolean attribute
			key := attrStr
			if spaceIdx != -1 {
				key = attrStr[:spaceIdx]
			}
			attr[strings.ToLower(key)] = "" // store empty value
			if spaceIdx == -1 {
				break
			}
			attrStr = attrStr[spaceIdx+1:]
			continue
		}

		key := strings.ToLower(strings.TrimSpace(attrStr[:eqIdx])) // attr name before =
		attrStr = attrStr[eqIdx+1:]                                // move past =

		if len(attrStr) == 0 {
			break
		}

		if attrStr[0] == '"' || attrStr[0] == '\'' {
			// quoted value e.g. class="foo"
			quote := attrStr[0]
			attrStr = attrStr[1:]                           // skip opening quote
			closeQuote := strings.IndexByte(attrStr, quote) // find closing quote
			if closeQuote == -1 {
				break
			}
			attr[key] = attrStr[:closeQuote]
			attrStr = strings.TrimSpace(attrStr[closeQuote+1:]) // move past closing quote
		} else {
			// unquoted value
			end := strings.IndexAny(attrStr, " \t\n\r")
			if end == -1 {
				attr[key] = attrStr
				break
			}
			attr[key] = attrStr[:end]
			attrStr = strings.TrimSpace(attrStr[end:])
		}
	}

	return tag, attr
}
