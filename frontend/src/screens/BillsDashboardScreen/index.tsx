import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './BillsDashboardScreen.module.css';
import { useSwipeClose } from '../../hooks/useSwipeClose';

interface BillsDashboardScreenProps {
  onDetailedAnalysis: () => void;
  onNavigate?: (screen: any) => void;
}

interface Bill {
  id: number;
  month: string;
  amount: number;
  isPaid: boolean;
}

export const BillsDashboardScreen: React.FC<BillsDashboardScreenProps> = ({ onDetailedAnalysis, onNavigate }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/bills', {
        headers: { 'X-User-ID': localStorage.getItem('user_id') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = (data || []).map((b: any) => ({
          id: b.id,
          month: b.month,
          amount: b.amount,
          isPaid: b.is_paid
        }));
        setBills(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id: number) => {
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + `/api/bills/${id}/pay`, {
        method: 'POST',
        headers: { 'X-User-ID': localStorage.getItem('user_id') || '' }
      });
      if (res.ok) {
        notify('Счет успешно оплачен!');
        setBills(bills.map(b => b.id === id ? { ...b, isPaid: true } : b));
      } else {
        notify('Ошибка оплаты');
      }
    } catch (err) {
      notify('Ошибка сети');
    }
  };

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const unpaidBill = bills.find(b => !b.isPaid);
  const paidBills = bills.filter(b => b.isPaid).map(b => ({
    id: String(b.id),
    month: b.month,
    provider: 'УК "СМАРТ ДОМ"',
    amount: `${b.amount.toLocaleString('ru-RU')} ₽`,
    status: 'Оплачен',
    date: 'Недавно',
    water: '850 ₽',
    electricity: '920 ₽',
    heating: '2 500 ₽'
  }));

  const handleOpenDetailedAnalysis = () => {
    if (unpaidBill) {
      localStorage.setItem('selectedBillId', String(unpaidBill.id));
      onDetailedAnalysis();
    } else if (bills.length > 0) {
      localStorage.setItem('selectedBillId', String(bills[0].id));
      onDetailedAnalysis();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.ambientGlow} />

      <header className={styles.navBar}>
        <h2 className={styles.navTitle}>Счета</h2>
      </header>

      <div className={styles.content}>
        <div className={styles.summarySection}>
          <div className={styles.summaryHeader}>
            <h3 className={styles.summaryTitle}>К оплате</h3>
            <span className={styles.summaryMonth}>{unpaidBill ? unpaidBill.month : 'Нет счетов'}</span>
          </div>
          
          {unpaidBill ? (
            <div className={styles.premiumCard}>
              <div className={styles.amountDisplay}>
                <div className={styles.amountWrap}>
                  <span className={styles.amountVal}>{unpaidBill.amount.toLocaleString('ru-RU')}</span>
                  <span className={styles.amountCurrency}>₽</span>
                </div>
              </div>
              
              <button className={styles.payButton} onClick={() => handlePay(unpaidBill.id)}>
                Оплатить
              </button>
            </div>
          ) : (
            <div className={styles.premiumCard} style={{justifyContent: 'center', alignItems: 'center', minHeight: 120}}>
              <div style={{color: 'rgba(255,255,255,0.7)', fontSize: 16}}>Все счета оплачены</div>
            </div>
          )}
          
          {(unpaidBill || bills.length > 0) && (
            <button className={styles.aiAnalysisBtn} onClick={handleOpenDetailedAnalysis}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Разбор счета от ИИ
            </button>
          )}

          <button className={styles.metersBtn} onClick={() => onNavigate && onNavigate('meters')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
            Внести показания
          </button>
        </div>

        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>История платежей</h3>
          </div>
          
          <div className={styles.historyList}>
            {loading ? <div style={{color:'#fff', textAlign:'center'}}>Загрузка...</div> : null}
            {!loading && paidBills.length === 0 && <div style={{color:'rgba(255,255,255,0.5)', textAlign:'center'}}>Нет истории платежей</div>}
            {paidBills.map((r, i) => (
              <div key={r.id} className={styles.historyItem} style={{animationDelay: `${i * 0.05}s`}}>
                <div className={styles.historyItemIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className={styles.historyItemContent}>
                  <div className={styles.historyItemTop}>
                    <span className={styles.historyItemMonth}>{r.month}</span>
                    <span className={styles.historyItemAmount}>{r.amount}</span>
                  </div>
                  <div className={styles.historyItemBottom}>
                    <span className={styles.historyItemProvider}>{r.provider}</span>
                    <span className={styles.historyItemDate}>{r.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{height: 100}} />

      {toast && createPortal(
        <div className={styles.toast}>
          {toast}
        </div>,
        document.body
      )}
    </div>
  );
};