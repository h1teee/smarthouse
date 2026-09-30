package ai

import (
	"backend/internal/models"
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

var cachedToken string
var tokenExpiresAt time.Time

func getGigaChatToken() (string, error) {
	if time.Now().Before(tokenExpiresAt) && cachedToken != "" {
		return cachedToken, nil
	}

	authData := "MDFhMGRkOGQtYzhiYS03ZDRlLThjYzctYWU1NDYwMzgwNmJlOmMxY2IzNWVlLTdjMzItNGNlZC05YWRmLWNiMWE2OWFhYWE2MQ=="
	
	req, _ := http.NewRequest("POST", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth", strings.NewReader("scope=GIGACHAT_API_PERS"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("RqUID", "6f0b1291-c7f3-4cb4-971e-a61622243e1f")
	req.Header.Set("Authorization", "Basic "+authData)

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	client := &http.Client{Transport: tr}
	
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("auth error: status %d", resp.StatusCode)
	}

	var data struct {
		AccessToken string `json:"access_token"`
		ExpiresAt   int64  `json:"expires_at"`
	}
	json.NewDecoder(resp.Body).Decode(&data)
	cachedToken = data.AccessToken
	tokenExpiresAt = time.UnixMilli(data.ExpiresAt)
	return cachedToken, nil
}

func callGigaChat(systemPrompt, userText string) (string, error) {
	token, err := getGigaChatToken()
	if err != nil {
		return "", err
	}

	payload := map[string]interface{}{
		"model": "GigaChat",
		"messages": []map[string]interface{}{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userText},
		},
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://gigachat.devices.sberbank.ru/api/v1/chat/completions", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	tr := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	client := &http.Client{Timeout: 30 * time.Second, Transport: tr}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return "", fmt.Errorf("gigachat error")
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var routerResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	json.Unmarshal(respBody, &routerResp)
	if len(routerResp.Choices) > 0 {
		return routerResp.Choices[0].Message.Content, nil
	}
	return "", fmt.Errorf("empty response")
}

func extractTextWithOCR(base64Image string) string {
	if !strings.HasPrefix(base64Image, "data:image") {
		base64Image = "data:image/jpeg;base64," + base64Image
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	writer.WriteField("apikey", "helloworld")
	writer.WriteField("language", "rus")
	writer.WriteField("base64Image", base64Image)
	writer.Close()

	req, err := http.NewRequest("POST", "https://api.ocr.space/parse/image", body)
	if err != nil {
		return ""
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return ""
	}
	defer resp.Body.Close()

	var data struct {
		ParsedResults []struct {
			ParsedText string `json:"ParsedText"`
		} `json:"ParsedResults"`
	}
	json.NewDecoder(resp.Body).Decode(&data)

	if len(data.ParsedResults) > 0 {
		return data.ParsedResults[0].ParsedText
	}
	return ""
}

func ParseAnnouncement(base64Image string) (*models.Request, error) {
	extractedText := extractTextWithOCR(base64Image)
	if extractedText == "" {
		extractedText = "Текст не распознан. Пожалуйста, попросите пользователя ввести текст вручную."
	}

	result, err := callGigaChat(
		"Вы помощник по разбору объявлений. Выведи строго JSON без markdown: {\"type\": \"water/electricity/other\", \"title\": \"...\", \"start_date\": \"...\", \"end_date\": \"...\", \"description\": \"...\"}.",
		"Я прикрепил текст из объявления, полученный через OCR. Найди в нем суть и выведи информацию об отключениях или событиях.\nТекст объявления:\n" + extractedText,
	)
	if err != nil {
		return &models.Request{
			Type:        "water",
			Title:       "Ошибка распознавания",
			Description: "Случилась ошибка при обращении к GigaChat.",
		}, err
	}

	result = strings.TrimSpace(result)
	result = strings.TrimPrefix(result, "```json")
	result = strings.TrimPrefix(result, "```")
	result = strings.TrimSuffix(result, "```")
	result = strings.TrimSpace(result)

	var req models.Request
	json.Unmarshal([]byte(result), &req)
	if req.Title == "" {
		req.Title = "Распознанное объявление"
		req.Description = result
	}
	return &req, nil
}

type BillDetail struct {
	Month      string
	Amount     float64
	IsPaid     bool
	RawReceipt string
}

func getBillData(billID int) BillDetail {
	switch billID {
	case 1:
		return BillDetail{
			Month:  "Сентябрь 2024",
			Amount: 4500.00,
			IsPaid: true,
			RawReceipt: `КВИТАНЦИЯ ЖКУ ЗА СЕНТЯБРЬ 2024
Лицевой счет: 61-0001-0015
Адрес: г. Ростов-на-Дону, ул. Мухина, д. 47, кв. 15 (Площадь: 54.2 м²)

СТАТЬИ НАЧИСЛЕНИЙ:
1. Водоснабжение и канализация:
   - Холодная вода (ХВС): 3.5 м³ × 51.62 ₽ = 180.67 ₽
   - Горячая вода (ГВС): 2.8 м³ × 218.45 ₽ = 611.66 ₽
   - Водоотведение: 6.3 м³ × 36.14 ₽ = 227.68 ₽
   ИТОГО ЗА ВСЮ ВОДУ: 1 020.01 ₽
2. Электроэнергия (ИПУ): 180 кВт·ч × 4.81 ₽ = 865.80 ₽
   ИТОГО ЗА СВЕТ: 865.80 ₽
3. Отопление (начало подачи тепла в конце месяца): 0.35 Гкал × 2 340.50 ₽ = 819.18 ₽
   ИТОГО ЗА ОТОПЛЕНИЕ: 819.18 ₽
4. Содержание жилья и текущий ремонт: 54.2 м² × 24.50 ₽ = 1 327.90 ₽
5. Взнос на капремонт: 54.2 м² × 6.50 ₽ = 352.11 ₽
   ИТОГО ЗА ДОМ И КАПРЕМОНТ: 1 680.01 ₽
6. Вывоз мусора (ТКО) и ОДН: 115.00 ₽

ВСЕГО К ОПЛАТЕ: 4 500.00 ₽. Статус: Оплачено вовремя.`,
		}
	case 2:
		return BillDetail{
			Month:  "Октябрь 2024",
			Amount: 4800.50,
			IsPaid: true,
			RawReceipt: `КВИТАНЦИЯ ЖКУ ЗА ОКТЯБРЬ 2024
Лицевой счет: 61-0001-0015
Адрес: г. Ростов-на-Дону, ул. Мухина, д. 47, кв. 15 (Площадь: 54.2 м²)

СТАТЬИ НАЧИСЛЕНИЙ:
1. Водоснабжение и канализация:
   - Холодная вода (ХВС): 4.1 м³ × 51.62 ₽ = 211.64 ₽
   - Горячая вода (ГВС): 3.2 м³ × 218.45 ₽ = 699.04 ₽
   - Водоотведение: 7.3 м³ × 36.14 ₽ = 263.82 ₽
   ИТОГО ЗА ВСЮ ВОДУ: 1 174.50 ₽
2. Электроэнергия (ИПУ): 205 кВт·ч × 4.81 ₽ = 986.05 ₽
   ИТОГО ЗА СВЕТ: 986.05 ₽
3. Отопление (полный месяц отопления): 0.52 Гкал × 2 340.50 ₽ = 1 217.06 ₽
   ИТОГО ЗА ОТОПЛЕНИЕ: 1 217.06 ₽
4. Содержание жилья и ремонт: 54.2 м² × 24.50 ₽ = 1 327.90 ₽
5. Взнос на капремонт: 54.2 м² × 6.50 ₽ = 352.11 ₽
   ИТОГО ЗА ДОМ И КАПРЕМОНТ: 1 680.01 ₽
6. Вывоз ТКО, домофон, ОДН: 222.88 ₽

ВСЕГО К ОПЛАТЕ: 4 800.50 ₽. Статус: Оплачено вовремя.`,
		}
	default:
		return BillDetail{
			Month:  "Ноябрь 2024",
			Amount: 5100.00,
			IsPaid: false,
			RawReceipt: `КВИТАНЦИЯ ЖКУ ЗА НОЯБРЬ 2024
Лицевой счет: 61-0001-0015
Адрес: г. Ростов-на-Дону, ул. Мухина, д. 47, кв. 15 (Площадь: 54.2 м²)

СТАТЬИ НАЧИСЛЕНИЙ:
1. Водоснабжение и канализация:
   - Холодная вода (ХВС): 4.5 м³ × 51.62 ₽ = 232.29 ₽
   - Горячая вода (ГВС): 3.6 м³ × 218.45 ₽ = 786.42 ₽
   - Водоотведение: 8.1 м³ × 36.14 ₽ = 292.73 ₽
   ИТОГО ЗА ВСЮ ВОДУ: 1 311.44 ₽
2. Электроэнергия (ИПУ): 220 кВт·ч × 4.81 ₽ = 1 058.20 ₽
   ИТОГО ЗА СВЕТ: 1 058.20 ₽
3. Отопление (повышенный расход из-за морозов): 0.74 Гкал × 2 340.50 ₽ = 1 731.97 ₽
   ИТОГО ЗА ОТОПЛЕНИЕ: 1 731.97 ₽
4. Содержание жилья и текущий ремонт: 54.2 м² × 24.50 ₽ = 1 327.90 ₽
5. Взнос на капитальный ремонт: 54.2 м² × 6.50 ₽ = 352.11 ₽
   ИТОГО ЗА ДОМ И КАПРЕМОНТ: 1 680.01 ₽
6. Вывоз ТКО, освещение мест общего пользования (ОДН): 220.00 ₽

ВСЕГО К ОПЛАТЕ: 5 100.00 ₽. Статус: К оплате (НЕ ОПЛАЧЕНО).`,
		}
	}
}

func AnalyzeBill(billID int) (string, error) {
	bill := getBillData(billID)

	systemPrompt := `Ты — умный и заботливый персональный ИИ-ассистент по ЖКХ сервиса «Мой Дом».
Твоя задача — проанализировать реальную квитанцию жителя и простыми, живыми словами вытянуть из неё самое главное.

СТРОГИЕ ПРАВИЛА ДЛЯ ПЕРВОГО СООБЩЕНИЯ:
1. Поприветствуй жителя и назови общую сумму квитанции за этот месяц жирным шрифтом: **... ₽**. Укажи статус (оплачена или ожидает оплаты).
2. Простыми понятными словами разложи 4 главные статьи расходов (суммы выделяй жирным шрифтом):
   • 💧 Вода (горячая, холодная и канализация): назови общую сумму за воду и кратко объём в кубах.
   • ⚡ Свет (электричество): сколько киловатт и сумма.
   • 🔥 Отопление: сумма за тепло.
   • 🏠 Содержание дома и капремонт: сумма на обслуживание дома и взнос на капремонт.
3. Коротко и понятно объясни, почему вышла именно такая сумма (например, наступление холодов и рост расхода отопления/воды) и дай 1 полезный жизненный совет по экономии.
4. В конце обязательно напомни:
«Кнопки «Подробнее» и «Оспорить» внизу всегда активны — нажмите «Подробнее», если хотите разобрать формулы и тарифы, или «Оспорить», если считаете начисления неверными.»

Отвечай дружелюбно, структурированно, с отступами и эмодзи. Суммы выделяй жирным шрифтом.`

	userPrompt := fmt.Sprintf("Вот полные данные квитанции за %s:\n%s\n\nСделай для жителя понятный разбор по правилам.", bill.Month, bill.RawReceipt)

	result, err := callGigaChat(systemPrompt, userPrompt)
	if err != nil {
		log.Println("[AI] GigaChat error in AnalyzeBill:", err)
		var water, light, heat string
		switch billID {
		case 1:
			water, light, heat = "1 020.01 ₽", "865.80 ₽", "819.18 ₽"
		case 2:
			water, light, heat = "1 174.50 ₽", "986.05 ₽", "1 217.06 ₽"
		default:
			water, light, heat = "1 311.44 ₽", "1 058.20 ₽", "1 731.97 ₽"
		}
		return fmt.Sprintf("👋 Здравствуйте! Счет за **%s** составляет **%.2f ₽**.\n\nВот главное из вашей квитанции:\n• 💧 **Вода (ГВС + ХВС + слив):** %s\n• ⚡ **Свет (электричество):** %s\n• 🔥 **Отопление:** %s\n• 🏠 **Содержание дома и капремонт:** 1 680.01 ₽\n\nОсновная доля расходов пришлась на отопление и коммунальные ресурсы. Рекомендуем проверять терморегуляторы и передавать показания ИПУ вовремя.\n\nКнопки «Подробнее» и «Оспорить» внизу всегда активны — нажмите «Подробнее», если хотите разобрать формулы, или «Оспорить», если не согласны с суммой.", bill.Month, bill.Amount, water, light, heat), nil
	}
	return result, nil
}

func ChatAboutBill(billID int, message string) (string, error) {
	bill := getBillData(billID)

	systemPrompt := fmt.Sprintf(`Ты — персональный финансовый ассистент жителя по ЖКХ сервиса «Мой Дом».
Ты консультируешь жителя по квитанции за %s.
Вот полные исходные данные квитанции:
%s

ИНСТРУКЦИИ ДЛЯ ОТВЕТОВ:
1. Если житель нажал «Подробнее» или спрашивает детали начислений:
   - Простыми словами подробно распиши формулу расчета по каждой статье: объем потребления, действующий тариф за единицу и итоговую сумму.
   - Поясни, где индивидуальные приборы учета (ИПУ в квартире), а где общедомовые нужды (ОДН).
2. Если житель нажал «Оспорить» или выражает сомнение в сумме:
   - Спокойно и доброжелательно объясни, в каких случаях положен перерасчет (например: температура батарей ниже +18°C, перебои с водой дольше норматива, отсутствие жильца дома более 5 дней).
   - Дай четкий пошаговый алгоритм: 1) Вызвать техника УК для составления акта, 2) Подать заявку на перерасчет прямо в нашем приложении (вкладка «Заявки»).
   - Предложи прямо сейчас составить текст обращения в управляющую компанию!
3. На любой другой вопрос жителя: отвечай емко, дружелюбно, опираясь строго на цифры этой квитанции.`, bill.Month, bill.RawReceipt)

	result, err := callGigaChat(systemPrompt, message)
	if err != nil {
		log.Println("[AI] GigaChat error in ChatAboutBill:", err)
		msgLower := strings.ToLower(message)
		if strings.Contains(msgLower, "оспор") {
			return "Оспорить начисления можно в нескольких случаях:\n1. **Некачественные услуги:** температура отопления ниже нормы (+18°C в комнате, +20°C в угловой) или слабый напор/ржавая вода.\n2. **Период отсутствия:** если вы уезжали более чем на 5 дней (без счетчиков).\n3. **Ошибка в показаниях счетчиков.**\n\n**Что делать:**\nСоставьте заявку на перерасчет в разделе «Заявки» нашего приложения с прикреплением акта или фото счетчиков. УК обязана рассмотреть её в течение 3 рабочих дней.", nil
		}
		if strings.Contains(msgLower, "подробн") {
			switch billID {
			case 1:
				return fmt.Sprintf("Детальный расчет квитанции за %s:\n• Холодная вода: 3.5 м³ × 51.62 ₽ = 180.67 ₽\n• Горячая вода: 2.8 м³ × 218.45 ₽ = 611.66 ₽\n• Водоотведение: 6.3 м³ × 36.14 ₽ = 227.68 ₽\n• Электроэнергия: 180 кВт·ч × 4.81 ₽ = 865.80 ₽\n• Отопление: 0.35 Гкал × 2 340.50 ₽ = 819.18 ₽\n• Содержание дома и капремонт: 1 680.01 ₽\n• Вывоз ТКО и ОДН: 115.00 ₽\nИтого: %.2f ₽.", bill.Month, bill.Amount), nil
			case 2:
				return fmt.Sprintf("Детальный расчет квитанции за %s:\n• Холодная вода: 4.1 м³ × 51.62 ₽ = 211.64 ₽\n• Горячая вода: 3.2 м³ × 218.45 ₽ = 699.04 ₽\n• Водоотведение: 7.3 м³ × 36.14 ₽ = 263.82 ₽\n• Электроэнергия: 205 кВт·ч × 4.81 ₽ = 986.05 ₽\n• Отопление: 0.52 Гкал × 2 340.50 ₽ = 1 217.06 ₽\n• Содержание дома и капремонт: 1 680.01 ₽\n• Вывоз ТКО и ОДН: 222.88 ₽\nИтого: %.2f ₽.", bill.Month, bill.Amount), nil
			default:
				return fmt.Sprintf("Детальный расчет квитанции за %s:\n• Холодная вода: 4.5 м³ × 51.62 ₽ = 232.29 ₽\n• Горячая вода: 3.6 м³ × 218.45 ₽ = 786.42 ₽\n• Водоотведение: 8.1 м³ × 36.14 ₽ = 292.73 ₽\n• Электроэнергия: 220 кВт·ч × 4.81 ₽ = 1 058.20 ₽\n• Отопление: 0.74 Гкал × 2 340.50 ₽ = 1 731.97 ₽\n• Содержание дома и капремонт: 1 680.01 ₽\n• Вывоз ТКО и ОДН: 220.00 ₽\nИтого: %.2f ₽.", bill.Month, bill.Amount), nil
			}
		}
		return "Я готов ответить на любой ваш вопрос по этой квитанции. Вы можете нажать «Подробнее» или «Оспорить».", nil
	}
	return result, nil
}

func WeeklyAnalysis(reqCount int, amount float64) (string, error) {
	prompt := fmt.Sprintf("За неделю поступило %d заявок от жителей. Общая сумма выставленных счетов %.2f руб. Дай короткий комментарий (2 предложения) для директора УК, как улучшить работу.", reqCount, amount)
	result, err := callGigaChat("Ты аналитик УК.", prompt)
	if err != nil {
		return "Слишком много заявок, рекомендуется усилить контроль диспетчерской (Mock).", err
	}
	return result, nil
}

func ImproveText(text string) (string, error) {
	result, err := callGigaChat(
		"Ты помощник управляющей компании ЖКХ. Улучши текст рассылки для жителей: исправь грамматику, сделай более информативным и официальным. Ответь только улучшенным текстом без пояснений.",
		text,
	)
	if err != nil {
		return text, err
	}
	return result, nil
}

func CallGigaChat(systemPrompt, userText string) (string, error) {
	return callGigaChat(systemPrompt, userText)
}

func AnswerOutageQuery(userName, userAddress, outagesDigest, userQuestion string) (string, error) {
	if userName == "" {
		userName = "Уважаемый житель"
	}
	if userAddress == "" {
		userAddress = "г. Ростов-на-Дону, ул. Мухина, д. 47, кв. 15"
	}

	systemPrompt := fmt.Sprintf(`Ты — официальный заботливый ИИ-диспетчер сервиса «Мой Дом» (ЖКХ г. Ростов-на-Дону).
Твоя задача — оперативно, вежливо и точно отвечать жителям на любые вопросы об авариях, отключениях коммунальных услуг (электричество, холодная/горячая вода, отопление) и работе управляющей компании.

АКТУАЛЬНАЯ ОПЕРАТИВНАЯ СВОДКА ДИСПЕТЧЕРСКОЙ СЛУЖБЫ:
%s

ДАННЫЕ ОБРАТИВШЕГОСЯ ЖИТЕЛЯ:
• Имя: %s
• Закрепленный адрес: %s

СТРОГИЕ ПРАВИЛА ОТВЕТА:
1. Если житель спрашивает о наличии света, воды или тепла в конкретном районе или по адресу (например: «а на северном районе есть свет?», «почему отключили горячую воду на Мухина?», «когда дадут свет в ст-це Елизаветинская?»):
   - Внимательно сверься с оперативной сводкой диспетчерской выше.
   - Если в сводке есть зафиксированная авария или плановые работы по этому району/адресу: назови причину, затронутые улицы/дома и точное время восстановления подачи ресурса (если указано время окончания работ).
   - Если в сводке по запрашиваемому району/адресу НЕТ отключений и аварий: четко и доброжелательно ответь, что по оперативным данным диспетчерской сети работают в штатном режиме, аварийных отключений не зафиксировано. Посоветуй проверить вводной автомат в электрощитке или подать заявку в приложении, если проблема локальная в квартире.
2. Если житель спрашивает об оплате, передаче показаний, счетчиках или заявках:
   - Кратко подскажи, что все эти действия доступны прямо в приложении «Мой Дом» (разделы «Квитанции», «Счетчики», «Заявки»).
3. Отвечай кратко, по делу, дружелюбно, структурированно, с понятными отступами и уместными эмодзи (⚡, 💧, 🔥, 🛠).`, outagesDigest, userName, userAddress)

	ans, err := callGigaChat(systemPrompt, userQuestion)
	if err != nil {
		log.Printf("[AI] GigaChat error for outage query: %v\n", err)
		return "", err
	}
	return ans, nil
}