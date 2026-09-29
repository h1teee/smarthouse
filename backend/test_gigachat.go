package main

import (
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

func main() {
	authData := "MDFhMGRkOGQtYzhiYS03ZDRlLThjYzctYWU1NDYwMzgwNmJlOmMxY2IzNWVlLTdjMzItNGNlZC05YWRmLWNiMWE2OWFhYWE2MQ=="
	
	req, _ := http.NewRequest("POST", "https://ngw.devices.sberbank.ru:2124/api/v2/oauth", strings.NewReader("scope=GIGACHAT_API_PERS"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("RqUID", "6f0b1291-c7f3-4cb4-971e-a61622243e1f")
	req.Header.Set("Authorization", "Basic "+authData)

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	client := &http.Client{Transport: tr, Timeout: 10 * time.Second}
	
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Auth Request Error:", err)
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Auth Status:", resp.StatusCode)
	fmt.Println("Auth Body:", string(body))
}
