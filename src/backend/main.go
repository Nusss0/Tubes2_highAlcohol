package main

import (
	"fmt"
	"os"
)

func main() {
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

		rawHtml := string(content)        // convert bytes to string
		tokens := Tokenize(rawHtml)       // lex into tokens
		tree := Parse(tokens)             // build tree from tokens
		PrintTree(tree.Root, 0)           // display result

	default:
		fmt.Println("[ERROR] Invalid Input!")
	}
}
