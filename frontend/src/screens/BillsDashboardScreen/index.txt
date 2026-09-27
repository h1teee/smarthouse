import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './BillsDashboardScreen.module.css';
import { useSwipeClose } from '../../hooks/useSwipeClose';

interface BillsDashboardScreenProps {
  onDetailedAnalysis: () => void;
  onNavigate?: (screen: any) => void;
}

interface Receipt {
  id: string;
  month: string;
  provider: string;
  amount: string;
  status: string;
  date: string;
  water: string;
  electricity: string;
  heating: string;
}

const MOCK_RECEIPTS: Receipt[] = [
  { id: '1', month: 'Июль 2026', provider: 'УК Смарт Сити', amount: '- 4 800 ₽', status: 'Оплачено', date: '10 авг 2026, 14:20', water: '1 200 ₽', electricity: '900 ₽', heating: '2 700 ₽' },
  { id: '2', month: 'Июнь 2026', provider: 'УК Смарт Сити', amount: '- 4 650 ₽', status: 'Оплачено', date: '08 июл 2026, 09:15', water: '1 100 ₽', electricity: '850 ₽', heating: '2 700 ₽' }
];

export const BillsDashboardScreen: React.FC<BillsDashboardScreenProps> = ({ onDetailedAnalysis, onNavigate }) => {
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  const selectedReceipt = MOCK_RECEIPTS.find(r => r.id === selectedReceiptId) || null;

  const swipeHandlers = useSwipeClose(() => setSelectedReceiptId(null));

  return (
    <div className={styles.container}>
      {/* Unified Ambient Glow */}
      <div className={styles.ambientGlow} />
      
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h1 className={styles.header}>Коммуналка</h1>
        </div>
        
        {/* The Premium Metallic Card */}
        <div className={styles.premiumCard}>
          <div className={styles.cardNoise} />
          <div className={styles.cardHeader}>
            <div className={styles.providerInfo}>
              <div className={styles.providerLogo}>УК</div>
              <div className={styles.providerName}>УК «Смарт Сити»</div>
            </div>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot} />
              Не оплачено
            </div>
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.monthBadge}>Счет за август 2026</div>
            
            <div className={styles.amountContainer}>
              <span className={styles.amountValue}>5 430</span>
              <span className={styles.amountCurrency}>₽</span>
            </div>
            
            <div className={styles.miniBreakdown}>
              <div className={styles.breakdownRow}>
                <span className={styles.bdLabel}>Водоснабжение</span>
                <span className={styles.bdValue}>1 450 ₽</span>
              </div>
              <div className={styles.breakdownRow}>
                <span className={styles.bdLabel}>Электроэнергия</span>
                <span className={styles.bdValue}>980 ₽</span>
              </div>
              <div className={styles.breakdownRow}>
                <span className={styles.bdLabel}>Отопление и прочее</span>
                <span className={styles.bdValue}>3 000 ₽</span>
              </div>
            </div>
          </div>
          
          <button className={styles.payButton}>
            Оплатить до 10 сентября
          </button>
        </div>
        
        {/* AI Alert Component */}
        <div className={styles.aiAlertCard} onClick={onDetailedAnalysis}>
          <div className={styles.aiAlertHeaderRow}>
            <div className={styles.aiIconWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#sparkleGradient)" />
                <defs>
                  <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#BF5AF2" />
                    <stop offset="100%" stopColor="#0A84FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3 className={styles.aiHeader}>Внимание от ИИ</h3>
            <div className={styles.chevronIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
          <p className={styles.aiText}>
            За горячую воду вышло на 20% больше, чем в прошлом месяце. Возможна утечка или ошибка в показаниях.
          </p>
          <div className={styles.aiLinkButton}>
            Смотреть подробный разбор
          </div>
        </div>

        {/* Meters Widget */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Счетчики</h2>
          <span className={styles.sectionLink} onClick={() => onNavigate && onNavigate('meters')}>Все</span>
        </div>
        <div className={styles.metersGrid}>
          <div className={styles.meterCard}>
            <div className={styles.meterHeader}>
              <div className={`${styles.meterIcon} ${styles.blue}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className={styles.meterStatus}>Передано</span>
            </div>
            <div className={styles.meterData}>
              <span className={styles.meterValue}>142</span>
              <span className={styles.meterUnit}>м³</span>
            </div>
            <div className={styles.meterName}>Водоснабжение</div>
          </div>

          <div className={styles.meterCard}>
            <div className={styles.meterHeader}>
              <div className={`${styles.meterIcon} ${styles.yellow}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className={styles.meterStatusAlert}>До 25 авг</span>
            </div>
            <div className={styles.meterData}>
              <span className={styles.meterValue}>8 450</span>
              <span className={styles.meterUnit}>кВт</span>
            </div>
            <div className={styles.meterName}>Электроэнергия</div>
          </div>
        </div>

        {/* History Widget */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>История платежей</h2>
        </div>
        <div className={styles.historyList}>
          {MOCK_RECEIPTS.map(receipt => (
            <div 
              key={receipt.id} 
              className={styles.historyItem} 
              onClick={() => setSelectedReceiptId(receipt.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.historyIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.historyInfo}>
                <span className={styles.historyTitle}>{receipt.month}</span>
                <span className={styles.historySub}>{receipt.provider}</span>
              </div>
              <span className={styles.historyAmount}>{receipt.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Portal Bottom Sheet for Receipt Details */}
      {selectedReceipt && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setSelectedReceiptId(null)}>
          <div 
            className={styles.modalSheet}
            onClick={(e) => e.stopPropagation()}
            {...swipeHandlers}
          >
            <div className={styles.grabberWrap} onClick={() => setSelectedReceiptId(null)}>
              <div className={styles.grabber} />
            </div>
            
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>Квитанция</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedReceiptId(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.receiptCard}>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Статус</span>
                <span className={styles.receiptValue} style={{ color: '#34C759' }}>{selectedReceipt.status}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Дата и время</span>
                <span className={styles.receiptValue}>{selectedReceipt.date}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Водоснабжение</span>
                <span className={styles.receiptValue}>{selectedReceipt.water}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Электроэнергия</span>
                <span className={styles.receiptValue}>{selectedReceipt.electricity}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Отопление</span>
                <span className={styles.receiptValue}>{selectedReceipt.heating}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptTotalRow}>
                <span>Итого к оплате</span>
                <span>{selectedReceipt.amount.replace('- ', '')}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};


