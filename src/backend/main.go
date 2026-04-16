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
    fmt.Scan(&op)

    switch op{
        case "1" : //url to html converter
            fmt.Println("Not yett!!")
        case "2" : //HTML from File 
            var fileName string;
            fmt.Println("Input FileName : ")
            fmt.Scan(&fileName)

            path := "input/"+fileName
            content,err := os.ReadFile(path)
            if err != nil { //check wheter file is exist
                fmt.Println("[ERROR]", err)
                return 
            }

            rawHtml := string(content)
            fmt.Println(rawHtml)
        default : //else is invalid
            fmt.Println("[ERROR] Invalid Input!")   
    }


}