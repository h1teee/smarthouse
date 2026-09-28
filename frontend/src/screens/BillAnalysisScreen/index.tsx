import React, { useState, useRef, useEffect } from 'react';
import styles from './BillAnalysisScreen.module.css';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  isChart?: boolean;
}

interface BillAnalysisScreenProps {
  onBack: () => void;
}

interface ExpenseItem {
  id: string;
  month: string;
  amount: string;
  percentage: number;
  isCurrent?: boolean;
}

const expenseHistory: ExpenseItem[] = [
  { id: 'mar', month: 'РњР°СЂС‚', amount: '4 200 в‚Ѕ', percentage: 55 },
  { id: 'apr', month: 'РђРїСЂРµР»СЊ', amount: '4 150 в‚Ѕ', percentage: 54 },
  { id: 'may', month: 'РњР°Р№', amount: '4 300 в‚Ѕ', percentage: 56 },
  { id: 'jun', month: 'РСЋРЅСЊ', amount: '4 500 в‚Ѕ', percentage: 59 },
  { id: 'jul', month: 'РСЋР»СЊ', amount: '4 580 в‚Ѕ', percentage: 60 },
  { id: 'aug', month: 'РђРІРіСѓСЃС‚', amount: '5 430 в‚Ѕ', percentage: 85, isCurrent: true },
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
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: 'РџРѕРґСЂРѕР±РЅРµРµ' }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: 'Р”РµС‚Р°Р»РёР·Р°С†РёСЏ:\n1. Р“РѕСЂСЏС‡Р°СЏ РІРѕРґР°: С‚Р°СЂРёС„ 234 в‚Ѕ/РјВі. Р Р°СЃС…РѕРґ 8 РјВі (РІ РёСЋР»Рµ Р±С‹Р»Рѕ 5 РјВі).\n2. Р­Р»РµРєС‚СЂРёС‡РµСЃС‚РІРѕ: С‚Р°СЂРёС„ 6.43 в‚Ѕ/РєР’С‚С‡. Р Р°СЃС…РѕРґ 233 РєР’С‚С‡ (Р±РµР· РёР·РјРµРЅРµРЅРёР№).\n3. РћС‚РѕРїР»РµРЅРёРµ: С„РёРєСЃРёСЂРѕРІР°РЅРЅР°СЏ СЃС‚Р°РІРєР° РїРѕ РЅРѕСЂРјР°С‚РёРІСѓ (РёР·РјРµРЅРµРЅРёР№ РЅРµС‚).\nР•СЃР»Рё РІС‹ РЅРµ РїРµСЂРµРґР°РІР°Р»Рё РїРѕРєР°Р·Р°РЅРёСЏ, Р±С‹Р» РїСЂРѕРёР·РІРµРґРµРЅ СЂР°СЃС‡РµС‚ РїРѕ СЃСЂРµРґРЅРµРјСѓ.' 
        }]);
      }, 600);
    } else {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: 'РћСЃРїРѕСЂРёС‚СЊ РЅР°С‡РёСЃР»РµРЅРёСЏ' }]);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          sender: 'ai', 
          text: 'РџРѕРЅСЏР»Р° РІР°СЃ. Р¤РѕСЂРјРёСЂСѓСЋ РѕС„РёС†РёР°Р»СЊРЅСѓСЋ Р·Р°СЏРІРєСѓ РІ РЈРљ РЅР° РїРµСЂРµСЂР°СЃС‡РµС‚ Рё РїСЂРѕРІРµСЂРєСѓ СЃС‡РµС‚С‡РёРєРѕРІ РІРѕРґС‹. РћР¶РёРґР°Р№С‚Рµ СѓРІРµРґРѕРјР»РµРЅРёРµ СЃ РЅРѕРјРµСЂРѕРј РѕР±СЂР°С‰РµРЅРёСЏ.' 
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
          РќР°Р·Р°Рґ
        </button>
        <h2 className={styles.navTitle}>Р Р°Р·Р±РѕСЂ РєРІРёС‚Р°РЅС†РёРё</h2>
        <div className={styles.navSpacer} />
      </header>

      <div className={styles.content}>
        <div className={styles.chatArea}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.messageWrapper} ${msg.sender === 'user' ? styles.messageUser : styles.messageAi}`}>
              {msg.isChart ? (
                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Р”РёРЅР°РјРёРєР° СЂР°СЃС…РѕРґРѕРІ</h3>
                    <button className={styles.chartToggleBtn} onClick={() => setShowExtendedChart(!showExtendedChart)}>
                      {showExtendedChart ? 'РЎРІРµСЂРЅСѓС‚СЊ' : 'РџРѕРґСЂРѕР±РЅРµРµ'}
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
                            {item.isCurrent && <span className={styles.currentMonthBadge}>РўРµРєСѓС‰РёР№</span>}
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
            <button className={styles.quickReplyBtn} onClick={() => handleQuickReply('details')}>РџРѕРґСЂРѕР±РЅРµРµ</button>
            <button className={styles.quickReplyBtn} onClick={() => handleQuickReply('dispute')}>РћСЃРїРѕСЂРёС‚СЊ</button>
          </div>
        )}
        
        <div className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <input 
              type="text" 
              placeholder="РЎРїСЂРѕСЃРёС‚СЊ РР Рѕ РєРІРёС‚Р°РЅС†РёРё..." 
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

