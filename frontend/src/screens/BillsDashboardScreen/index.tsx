import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './BillsDashboardScreen.module.css';
import { useSwipeClose } from '../../hooks/useSwipeClose';

interface BillsDashboardScreenProps {
  onDetailedAnalysis: () => void;
  onNavigate?: (screen: any) => void;
}

export const BillsDashboardScreen: React.FC<BillsDashboardScreenProps> = ({ onDetailedAnalysis }) => {
  const [bills, setBills] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + '/api/bills');
        if (res.ok) {
          const data = await res.json();
          setBills(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBills();
  }, []);

  const unpaidBill = bills.find(b => !b.isPaid);
  const paidBills = bills.filter(b => b.isPaid).map(b => ({
    id: String(b.id),
    month: b.month,
    provider: 'УК Смарт Хаус',
    amount: '- ' + b.amount + ' ₽',
    status: 'Оплачено',
    date: '—',
    water: (b.amount * 0.25).toFixed(0) + ' ₽',
    electricity: (b.amount * 0.2).toFixed(0) + ' ₽',
    heating: (b.amount * 0.55).toFixed(0) + ' ₽',
  }));

  const selectedReceipt = paidBills.find(r => r.id === selectedReceiptId) || null;
  const swipeHandlers = useSwipeClose(() => setSelectedReceiptId(null));

  return (
    <div className={styles.container}>
      <div className={styles.ambientGlow} />
      
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h1 className={styles.header}>Квитанции</h1>
        </div>
        
        {unpaidBill ? (
          <div className={styles.premiumCard}>
            <div className={styles.cardNoise} />
            <div className={styles.cardHeader}>
              <div className={styles.providerInfo}>
                <div className={styles.providerLogo}>УК</div>
                <div className={styles.providerName}>УК Смарт Хаус</div>
              </div>
              <div className={styles.statusBadge}>
                <span className={styles.statusDot} />
                Не оплачено
              </div>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.monthBadge}>За {unpaidBill.month}</div>
              
              <div className={styles.amountContainer}>
                <span className={styles.amountValue}>{unpaidBill.amount}</span>
                <span className={styles.amountCurrency}>₽</span>
              </div>
              
              <div className={styles.miniBreakdown}>
                <div className={styles.breakdownRow}>
                  <span className={styles.bdLabel}>Водоснабжение</span>
                  <span className={styles.bdValue}>{(unpaidBill.amount * 0.25).toFixed(0)} ₽</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.bdLabel}>Электричество</span>
                  <span className={styles.bdValue}>{(unpaidBill.amount * 0.2).toFixed(0)} ₽</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.bdLabel}>Отопление и общ.</span>
                  <span className={styles.bdValue}>{(unpaidBill.amount * 0.55).toFixed(0)} ₽</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.premiumCard} style={{justifyContent: 'center', alignItems: 'center', opacity: 0.8}}>
             <div style={{color: '#fff', fontSize: 18, marginTop: 40, marginBottom: 40}}>Все квитанции оплачены</div>
          </div>
        )}

        <div className={styles.actionGrid}>
          <button className={styles.actionBtn}>
            <div className={`${styles.actionIcon} ${styles.payIcon}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <span className={styles.actionLabel}>Оплатить</span>
          </button>
          <button className={styles.actionBtn}>
            <div className={`${styles.actionIcon} ${styles.historyBtnIcon}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className={styles.actionLabel}>История</span>
          </button>
        </div>
        
        {unpaidBill && (
          <div className={styles.aiAlertCard} onClick={() => {
            localStorage.setItem('selectedBillId', unpaidBill.id);
            onDetailedAnalysis();
          }}>
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
              <h3 className={styles.aiHeader}>Разбор начислений</h3>
              <div className={styles.chevronIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
            <p className={styles.aiText}>
              Узнайте почему сумма в этом месяце выросла. ИИ проверит тарифы и начисления.
            </p>
            <div className={styles.aiLinkButton}>
              Смотреть подробный разбор
            </div>
          </div>
        )}

        <div className={styles.historySection}>
          <h2 className={styles.historyTitle}>История оплат</h2>
          <div className={styles.historyList}>
            {paidBills.map(receipt => (
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
      </div>

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
              <h2 className={styles.sheetTitle}>Детали чека</h2>
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
                <span className={styles.receiptLabel}>Дата оплаты</span>
                <span className={styles.receiptValue}>{selectedReceipt.date}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Водоснабжение</span>
                <span className={styles.receiptValue}>{selectedReceipt.water}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Электричество</span>
                <span className={styles.receiptValue}>{selectedReceipt.electricity}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Отопление</span>
                <span className={styles.receiptValue}>{selectedReceipt.heating}</span>
              </div>
              <hr className={styles.receiptDivider} />
              <div className={styles.receiptTotalRow}>
                <span>Итого</span>
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
