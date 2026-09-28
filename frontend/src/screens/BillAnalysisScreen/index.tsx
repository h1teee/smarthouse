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
  const [, setIsTyping] = useState(true);
  const [expenseHistory, setExpenseHistory] = useState<ExpenseItem[]>([]);
  const [showExtendedChart, setShowExtendedChart] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const billId = localStorage.getItem('selectedBillId');
      if (!billId) {
        setMessages([{ id: 1, sender: 'ai', text: 'Ошибка: квитанция не выбрана' }]);
        setIsTyping(false);
        return;
      }
      
      try {
        // Fetch AI analysis
        const resAi = await fetch(import.meta.env.VITE_API_URL + '/api/bills/' + billId + '/ai-analysis');
        let summaryText = 'Не удалось получить анализ.';
        if (resAi.ok) {
          const dataAi = await resAi.json();
          summaryText = dataAi.summary || summaryText;
        }

        // Fetch bills for chart
        const resBills = await fetch(import.meta.env.VITE_API_URL + '/api/bills');
        let history: ExpenseItem[] = [];
        if (resBills.ok) {
          const dataBills = await resBills.json();
          // dataBills is sorted DESC by ID, let's reverse to ASC for chart
          const sorted = [...(dataBills || [])].reverse();
          
          if (sorted.length > 0) {
            // Find max amount to calculate percentage
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
          }
        }

        setExpenseHistory(history);
        setMessages([
          { id: 1, sender: 'ai', text: summaryText },
          { id: 2, sender: 'ai', text: '', isChart: true }
        ]);

      } catch (err) {
        setMessages([{ id: 1, sender: 'ai', text: 'Сетевая ошибка при обращении к серверу.' }]);
      } finally {
        setIsTyping(false);
      }
    };
    loadData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const billId = localStorage.getItem('selectedBillId');
    if (!billId) return;

    setShowQuickReplies(false);
    setIsSending(true);
    setInputText('');

    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/bills/' + billId + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      
      let replyText = 'Ошибка при ответе от ИИ.';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || replyText;
      }
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: replyText }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: 'Ошибка сети.' }]);
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
    if (!isSending) {
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
        <div className={styles.navSpacer} />
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
          {isSending && (
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
            <button className={styles.quickReplyBtn} onClick={() => handleQuickReply('details')}>Подробнее</button>
            <button className={styles.quickReplyBtn} onClick={() => handleQuickReply('dispute')}>Оспорить</button>
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
              disabled={isSending}
            />
            <button type="submit" className={styles.sendButton} disabled={isSending || !inputText.trim()}>
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