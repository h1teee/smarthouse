import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { API_URL, getAuthHeaders } from '@/config/api';
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

const formatMonthName = (m: string) => {
  if (m === '2024-09' || m.includes('09')) return 'Сентябрь 2024';
  if (m === '2024-10' || m.includes('10')) return 'Октябрь 2024';
  if (m === '2024-11' || m.includes('11')) return 'Ноябрь 2024';
  return m;
};

const DEFAULT_ANALYSIS_SUMMARY = 'Анализирую квитанцию... Загружаю данные из GigaChat 🤖';

const DEFAULT_EXPENSE_HISTORY: ExpenseItem[] = [
  { id: '1', month: 'Сентябрь 2024', amount: '4 500 ₽', percentage: 70 },
  { id: '2', month: 'Октябрь 2024', amount: '4 800 ₽', percentage: 78 },
  { id: '3', month: 'Ноябрь 2024', amount: '5 100 ₽', percentage: 100, isCurrent: true },
];

const DEFAULT_BILLS = [
  { id: 1, month: 'Сентябрь 2024', amount: 4500 },
  { id: 2, month: 'Октябрь 2024', amount: 4800.50 },
  { id: 3, month: 'Ноябрь 2024', amount: 5100 },
];

const generateSmartAiReply = (userText: string, errorMsg?: string): string => {
  return `⚠️ Ошибка ИИ: ${errorMsg || 'Сервер не смог получить ответ от нейросети'}`;
};

  useEffect(() => {
    const loadData = async () => {
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
          const resAi = await fetch(API_URL + '/api/bills/' + billId + '/ai-analysis', {
            headers: getAuthHeaders()
          });
          if (resAi.ok) {
            const dataAi = await resAi.json();
            if (dataAi.summary && !dataAi.summary.includes('Ошибка')) {
              summaryText = dataAi.summary;
            }
          }
        } catch (e) {}

        let history: ExpenseItem[] = DEFAULT_EXPENSE_HISTORY;
        try {
          const resBills = await fetch(API_URL + '/api/bills', { headers: getAuthHeaders() });
          if (resBills.ok) {
            const dataBills = await resBills.json();
            if (Array.isArray(dataBills) && dataBills.length > 0) {
              const formattedBills = dataBills.map((b: any) => ({
                ...b,
                month: formatMonthName(b.month)
              }));
              setAllBills(formattedBills);
              const sorted = [...dataBills].reverse();
              let maxAmount = 0;
              sorted.forEach((b: any) => {
                if (b.amount > maxAmount) maxAmount = b.amount;
              });
              history = sorted.map((b: any) => ({
                id: String(b.id),
                month: formatMonthName(b.month),
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isSending]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    let billId = localStorage.getItem('selectedBillId');
    if (!billId || isNaN(Number(billId))) billId = '3';

    // Кнопки остаются всегда активными
    setIsSending(true);
    setInputText('');

    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);

    try {
      let replyText = '';
      try {
        const res = await fetch(API_URL + '/api/bills/' + billId + '/chat', {
          method: 'POST',
          headers: getAuthHeaders(),
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

      <div className={styles.content} ref={contentRef}>
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
        </div>
      </div>

      <div className={styles.bottomFixed}>
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
              onFocus={() => {
                setTimeout(scrollToBottom, 200);
              }}
              onBlur={() => {
                window.scrollTo({ top: 0, left: 0 });
              }}
              disabled={isSending || isTyping}
            />
            <button 
              type="submit" 
              className={styles.sendButton} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={isSending || isTyping || !inputText.trim()}
            >
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