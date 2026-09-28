import React, { useState, useEffect, useRef } from 'react';
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

const expenseHistory: ExpenseItem[] = [
  { id: '1', month: 'Май', amount: '4 120 ₽', percentage: 65 },
  { id: '2', month: 'Июнь', amount: '4 550 ₽', percentage: 72 },
  { id: '3', month: 'Июль', amount: '5 300 ₽', percentage: 85 },
  { id: '4', month: 'Август', amount: '6 430 ₽', percentage: 100, isCurrent: true },
];

export const BillAnalysisScreen: React.FC<BillAnalysisScreenProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'ai', 
      text: 'Анализирую квитанцию... Загружаю данные из GigaChat 🤖' 
    }
  ]);
  const [, setIsTyping] = useState(true);

  useEffect(() => {
    const fetchAi = async () => {
      const billId = localStorage.getItem('selectedBillId');
      if (!billId) {
        setMessages([{ id: 1, sender: 'ai', text: 'Ошибка: квитанция не выбрана' }]);
        setIsTyping(false);
        return;
      }
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/bills/' + billId + '/ai-analysis');
        if (res.ok) {
          const data = await res.json();
          setMessages([
            { id: 1, sender: 'ai', text: data.summary },
            { id: 2, sender: 'ai', text: '', isChart: true }
          ]);
        }
      } catch (err) {
        setMessages([{ id: 1, sender: 'ai', text: 'Не удалось получить ответ от ИИ.' }]);
      } finally {
        setIsTyping(false);
      }
    };
    fetchAi();
  }, []);
  
  const [showExtendedChart, setShowExtendedChart] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickReply = (type: 'details' | 'dispute') => {
    setShowQuickReplies(false);
    
    if (type === 'details') {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: 'Подробнее' }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: 'Детализация:\n1. Горячая вода: тариф 234 ₽/м³. Расход 8 м³ (в июле было 5 м³).\n2. Электричество: тариф 6.43 ₽/кВтч. Расход 233 кВтч (без изменений).\n3. Отопление: фиксированная ставка по нормативу (изменений нет).\nЕсли вы не передавали показания, был произведен расчет по среднему.' 
        }]);
      }, 600);
    } else {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: 'Оспорить начисления' }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: 'Поняла вас. Формирую официальную заявку в УК на перерасчет и проверку счетчиков воды. Ожидайте уведомление с номером обращения.' 
        }]);
      }, 600);
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
                    <button className={styles.chartToggleBtn} onClick={() => setShowExtendedChart(!showExtendedChart)}>
                      {showExtendedChart ? 'Свернуть' : 'Подробнее'}
                    </button>
                  </div>
                  
                  <div className={styles.chartList}>
                    {(showExtendedChart ? expenseHistory : expenseHistory.slice(-2)).map((item) => (
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
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.chatBubble}>
                  <p>{msg.text}</p>
                </div>
              )}
            </div>
          ))}
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
          <div className={styles.inputContainer}>
            <input 
              type="text" 
              placeholder="Спросить ИИ о квитанции..." 
              className={styles.inputField} 
            />
            <button className={styles.sendButton}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};