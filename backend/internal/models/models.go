package models

type Request struct {
	ID          int    `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type StatusUpdate struct {
	Status string `json:"status"`
}

type UploadRequest struct {
	ImageBase64 string `json:"image_base64"`
}

type House struct {
	ID                int     `json:"houseId"`
	Lat               float64 `json:"lat"`
	Lng               float64 `json:"lng"`
	WaterStatus       string  `json:"water_status"`
	ElectricityStatus string  `json:"electricity_status"`
}

type Offer struct {
	ID          string `json:"id"`
	PartnerName string `json:"partnerName"`
	BadgeText   string `json:"badgeText"`
	OfferText   string `json:"offerText"`
	IconURL     string `json:"iconUrl"`
	IconBgColor string `json:"iconBgColor"`
	IsLocked    bool   `json:"isLocked"`
	ActionType  string `json:"actionType"`
	ActionData  string `json:"actionData"`
}