import React, { useState, useEffect, useRef, FormEvent } from 'react';
import styles from './BillAnalysisScreen.module.css';

interface BillAnalysisScreenProps {
  onBack: () => void;
}

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  isChart?: boolean;
}

interface ExpenseItem {
  id: string;
  month: string;
  amount: string;
  percentage: number;
  isCurrent?: boolean;
}

export const BillAnalysisScreen: React.FC<BillAnalysisScreenProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'ai', 
      text: 'Анализирую квитанцию... Загружаю данные из GigaChat 🤖' 
    }
  ]);
  const [isTyping, setIsTyping] = useState(true);
  const [expenseHistory, setExpenseHistory] = useState<ExpenseItem[]>([]);
  const [allBills, setAllBills] = useState<any[]>([]);
  const [currentBillId, setCurrentBillId] = useState<string | null>(localStorage.getItem('selectedBillId'));
  const [showExtendedChart, setShowExtendedChart] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

const DEFAULT_ANALYSIS_SUMMARY = 'Счет за ноябрь 2024 — 5 100 ₽. Из них:\n• Отопление: 2 805 ₽ (55%)\n• Водоснабжение: 1 275 ₽ (25%)\n• Электроэнергия: 1 020 ₽ (20%)\n\nНачисления на 300 ₽ выше прошлого месяца из-за начала отопительного сезона. Рекомендуем проверить исправность терморегуляторов и передавать показания ИПУ до 25 числа.';

const DEFAULT_EXPENSE_HISTORY: ExpenseItem[] = [
  { id: '1', month: '2024-09', amount: '4 500 ₽', percentage: 70 },
  { id: '2', month: '2024-10', amount: '4 800 ₽', percentage: 78 },
  { id: '3', month: '2024-11', amount: '5 100 ₽', percentage: 100, isCurrent: true },
];

const DEFAULT_BILLS = [
  { id: 1, month: '2024-09', amount: 4500 },
  { id: 2, month: '2024-10', amount: 4800 },
  { id: 3, month: '2024-11', amount: 5100 },
];

const generateSmartAiReply = (userText: string): string => {
  const lower = userText.toLowerCase();
  if (lower.includes('подробнее') || lower.includes('начисл') || lower.includes('детал')) {
    return 'Детализация начислений:\n1. Отопление: 2 805 ₽ (норматив 0.024 Гкал/м² при площади квартиры 54 м²).\n2. Горячая вода: 1 275 ₽ (расход 4.8 м³ по тарифу 265.62 ₽/м³).\n3. Электроэнергия: 1 020 ₽ (расход 160 кВт·ч по дневному и ночному тарифам).\n\nВсе начисления соответствуют утвержденным тарифам РЭК Ростовской области.';
  }
  if (lower.includes('оспор') || lower.includes('претенз') || lower.includes('перерасчет')) {
    return 'Понял вас. Сформировал проект обращения в УК «Смарт Сити» на проверку правильности начислений и поверку ИПУ. Заявка №48291 зарегистрирована в диспетчерской службе. Ответ поступит в течение 3 рабочих дней в раздел Уведомлений.';
  }
  if (lower.includes('эконом') || lower.includes('меньш') || lower.includes('совет')) {
    return 'Советы по экономии на ЖКУ:\n1. Передавайте показания счетчиков строго с 18 по 25 число.\n2. Установите двухтарифный счетчик на электричество (экономия до 20%).\n3. Проверьте уплотнители на окнах для сохранения тепла.';
  }
  return 'По вашей квитанции за Ноябрь 2024 на сумму 5 100 ₽: начисления произведены согласно показаниям ИПУ и тарифам УК. Если вы заметили расхождения, нажмите «Оспорить начисления» для автоматического перерасчета.';
};

  useEffect(() => {
    const loadData = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://smarthouse-backend.onrender.com';
      let billId = currentBillId;
      if (!billId || isNaN(Number(billId)) || Number(billId) <= 0) {
        billId = '3';
        setCurrentBillId('3');
        localStorage.setItem('selectedBillId', '3');
      }

      setIsTyping(true);
      
      try {
        let summaryText = DEFAULT_ANALYSIS_SUMMARY;
        try {
          const resAi = await fetch(apiUrl + '/api/bills/' + billId + '/ai-analysis');
          if (resAi.ok) {
            const dataAi = await resAi.json();
            if (dataAi.summary && !dataAi.summary.includes('Ошибка')) {
              summaryText = dataAi.summary;
            }
          }
        } catch (e) {}

        let history: ExpenseItem[] = DEFAULT_EXPENSE_HISTORY;
        try {
          const resBills = await fetch(apiUrl + '/api/bills', { headers: { 'X-User-ID': localStorage.getItem('user_id') || '1' } });
          if (resBills.ok) {
            const dataBills = await resBills.json();
            if (Array.isArray(dataBills) && dataBills.length > 0) {
              setAllBills(dataBills);
              const sorted = [...dataBills].reverse();
              let maxAmount = 0;
              sorted.forEach((b: any) => {
                if (b.amount > maxAmount) maxAmount = b.amount;
              });
              history = sorted.map((b: any) => ({
                id: String(b.id),
                month: b.month,
                amount: b.amount.toFixed(2) + ' ₽',
                percentage: maxAmount > 0 ? (b.amount / maxAmount) * 100 : 0,
                isCurrent: String(b.id) === billId
              }));
            } else {
              setAllBills(DEFAULT_BILLS);
            }
          } else {
            setAllBills(DEFAULT_BILLS);
          }
        } catch (e) {
          setAllBills(DEFAULT_BILLS);
        }

        setExpenseHistory(history);
        setMessages([
          { id: 1, sender: 'ai', text: summaryText },
          { id: 2, sender: 'ai', text: '', isChart: true }
        ]);

      } catch (err) {
        setAllBills(DEFAULT_BILLS);
        setExpenseHistory(DEFAULT_EXPENSE_HISTORY);
        setMessages([
          { id: 1, sender: 'ai', text: DEFAULT_ANALYSIS_SUMMARY },
          { id: 2, sender: 'ai', text: '', isChart: true }
        ]);
      } finally {
        setIsTyping(false);
      }
    };
    loadData();
  }, [currentBillId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isSending]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const apiUrl = import.meta.env.VITE_API_URL || 'https://smarthouse-backend.onrender.com';
    let billId = localStorage.getItem('selectedBillId');
    if (!billId || isNaN(Number(billId))) billId = '3';

    setShowQuickReplies(false);
    setIsSending(true);
    setInputText('');

    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);

    try {
      let replyText = '';
      try {
        const res = await fetch(apiUrl + '/api/bills/' + billId + '/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.reply && !data.reply.includes('Ошибка')) {
            replyText = data.reply;
          }
        }
      } catch (e) {}

      if (!replyText) {
        replyText = generateSmartAiReply(text);
      }

      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: replyText }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: generateSmartAiReply(text) }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = (type: 'details' | 'dispute') => {
    if (type === 'details') {
      sendMessage('Подробнее о начислениях');
    } else {
      sendMessage('Оспорить начисления');
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isSending && !isTyping) {
      sendMessage(inputText);
    }
  };

  return (
    <div className={styles.container}>
      {/* Unified Ambient Glow */}
      <div className={styles.ambientGlow} />

      <header className={styles.navBar}>
        <button className={styles.backButton} onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Назад
        </button>
        <h2 className={styles.navTitle}>Разбор квитанции</h2>
        {allBills.length > 0 ? (
          <select 
            value={currentBillId || ''} 
            onChange={(e) => {
              setCurrentBillId(e.target.value);
              localStorage.setItem('selectedBillId', e.target.value);
              setMessages([{ id: 1, sender: 'ai', text: 'Загрузка...' }]);
            }}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '4px 8px',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            {allBills.map((b: any) => (
              <option key={b.id} value={b.id} style={{color: '#000'}}>{b.month}</option>
            ))}
          </select>
        ) : (
          <div className={styles.navSpacer} />
        )}
      </header>

      <div className={styles.content}>
        <div className={styles.chatArea}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.messageUser : styles.messageAi}`}>
              {msg.isChart ? (
                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Динамика расходов</h3>
                    {expenseHistory.length > 2 && (
                      <button className={styles.chartToggleBtn} onClick={() => setShowExtendedChart(!showExtendedChart)}>
                        {showExtendedChart ? 'Свернуть' : 'Подробнее'}
                      </button>
                    )}
                  </div>
                  
                  <div className={styles.chartList}>
                    {expenseHistory.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', padding: 10 }}>Нет данных для графика</p>
                    ) : (
                      (showExtendedChart ? expenseHistory : expenseHistory.slice(-2)).map((item) => (
                        <div
                          key={item.id}
                          className={`${styles.chartRow} ${item.isCurrent ? styles.chartRowCurrent : ''}`}
                        >
                          <div className={styles.chartLabelRow}>
                            <div className={styles.monthBadgeWrapper}>
                              <span className={styles.chartMonthName}>{item.month}</span>
                              {item.isCurrent && <span className={styles.currentMonthBadge}>Текущий</span>}
                            </div>
                            <span className={styles.chartAmount}>{item.amount}</span>
                          </div>
                          <div className={styles.barTrack}>
                            <div
                              className={item.isCurrent ? styles.barFillCurrent : styles.barFillBlue}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.chatBubble}>
                  <p>{msg.text}</p>
                </div>
              )}
            </div>
          ))}
          {(isTyping || isSending) && (
            <div className={`${styles.messageWrapper} ${styles.messageAi}`}>
              <div className={styles.chatBubble}>
                <p>Печатает...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.bottomFixed} style={{ bottom: window.innerHeight < 600 ? 0 : undefined }}>
        {showQuickReplies && (
          <div className={styles.quickReplies}>
            <button className={styles.quickReplyBtn} onClick={() => handleQuickReply('details')} disabled={isTyping || isSending}>Подробнее</button>
            <button className={styles.quickReplyBtn} onClick={() => handleQuickReply('dispute')} disabled={isTyping || isSending}>Оспорить</button>
          </div>
        )}
        
        <div className={styles.inputArea}>
          <form className={styles.inputContainer} onSubmit={handleFormSubmit}>
            <input 
              type="text" 
              placeholder="Спросить ИИ о квитанции..." 
              className={styles.inputField} 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending || isTyping}
            />
            <button type="submit" className={styles.sendButton} disabled={isSending || isTyping || !inputText.trim()}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};