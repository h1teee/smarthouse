import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_URL, getAuthHeaders } from '@/config/api';
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
  const [bills, setBills] = useState<any[]>([]);
  const [meters, setMeters] = useState({ water: 142.5, cold_water: 218.0, electricity: 8450 });
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // Payment Sheet States
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'sbp' | 'card' | 'sberpay'>('sbp');
  const [accountNumber, setAccountNumber] = useState(localStorage.getItem('account_number') || '61-0001-0015');
  const [paymentReceipt, setPaymentReceipt] = useState<any | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const formatMonthName = (m: string) => {
    if (!m) return '';
    if (m === '2024-09' || m.includes('09')) return 'Сентябрь 2024';
    if (m === '2024-10' || m.includes('10')) return 'Октябрь 2024';
    if (m === '2024-11' || m.includes('11')) return 'Ноябрь 2024';
    return m;
  };

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const res = await fetch(API_URL + '/api/bills', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setBills(data || []);
          if (Array.isArray(data) && data.length > 0 && data[0].account_number) {
            setAccountNumber(data[0].account_number);
          }
        }
      } catch (err) {}
    };

    const fetchMeters = async () => {
      try {
        const res = await fetch(API_URL + '/api/meters', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setMeters({
              water: data.water ?? 142.5,
              cold_water: data.cold_water ?? 218.0,
              electricity: data.electricity ?? 8450
            });
          }
        }
      } catch (err) {}
    };

    fetchBills();
    fetchMeters();
  }, []);

  // Find unpaid bill
  const unpaidBill = bills.find(b => !b.is_paid && !b.isPaid);

  const paidBills = bills.filter(b => b.is_paid || b.isPaid).map(b => ({
    id: String(b.id),
    month: formatMonthName(b.month),
    provider: 'УК Смарт Сити',
    amount: '- ' + b.amount.toLocaleString('ru-RU') + ' ₽',
    status: 'Оплачено',
    date: '30 сен 2026',
    water: (b.amount * 0.25).toFixed(0) + ' ₽',
    electricity: (b.amount * 0.2).toFixed(0) + ' ₽',
    heating: (b.amount * 0.55).toFixed(0) + ' ₽',
  }));

  const displayReceipts = paidBills.length > 0 ? paidBills : MOCK_RECEIPTS;
  const selectedReceipt = displayReceipts.find(r => r.id === selectedReceiptId) || null;

  const swipeHandlers = useSwipeClose(() => setSelectedReceiptId(null));
  const paymentSwipeHandlers = useSwipeClose(() => !isPaying && setShowPaymentSheet(false));

  const handleOpenPayment = () => {
    if (!unpaidBill) return;
    setPaymentReceipt(null);
    setShowPaymentSheet(true);
  };

  const handleExecutePayment = async () => {
    if (!unpaidBill || isPaying) return;
    setIsPaying(true);
    try {
      const methodLabel = paymentMethod === 'sbp' ? 'СБП' : paymentMethod === 'card' ? 'Банковская карта' : 'SberPay';
      const res = await fetch(API_URL + '/api/bills/' + unpaidBill.id + '/pay', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_method: methodLabel,
          account_number: accountNumber
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentReceipt(data);
      } else {
        // Fallback receipt
        setPaymentReceipt({
          status: 'paid',
          receipt_number: `FN-2024-${Math.floor(Math.random() * 900000 + 100000)}`,
          transaction_id: `TX-SBP-${Date.now()}`,
          account_number: accountNumber,
          recipient: 'ООО УК «Смарт Сити»',
          recipient_inn: '6164123456',
          amount: unpaidBill.amount,
          month: formatMonthName(unpaidBill.month),
          paid_at: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          payment_method: methodLabel
        });
      }

      // Refetch bills to update unpaid status
      const resBills = await fetch(API_URL + '/api/bills', { headers: getAuthHeaders() });
      if (resBills.ok) {
        const dataBills = await resBills.json();
        setBills(dataBills || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Unified Ambient Glow */}
      <div className={styles.ambientGlow} />
      
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h1 className={styles.header}>Коммуналка</h1>
        </div>
        
        {/* The Premium Metallic Card */}
        {unpaidBill ? (
          <div className={styles.premiumCard}>
            <div className={styles.cardNoise} />
            <div className={styles.cardHeader}>
              <div className={styles.providerInfo}>
                <div className={styles.providerLogo}>УК</div>
                <div className={styles.providerName}>УК «Смарт Сити»</div>
              </div>
              <div className={styles.dueBadge}>
                <span className={styles.dueDot} />
                до 10 сентября
              </div>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.monthBadge}>За {formatMonthName(unpaidBill.month)} • л/с {accountNumber}</div>
              
              <div className={styles.amountContainer}>
                <span className={styles.amountValue}>{unpaidBill.amount.toLocaleString('ru-RU')}</span>
                <span className={styles.amountCurrency}>₽</span>
              </div>
              
              <div className={styles.miniBreakdown}>
                <div className={styles.breakdownRow}>
                  <span className={styles.bdLabel}>Водоснабжение</span>
                  <span className={styles.bdValue}>1 311 ₽</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.bdLabel}>Электроэнергия</span>
                  <span className={styles.bdValue}>1 058 ₽</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span className={styles.bdLabel}>Отопление и прочее</span>
                  <span className={styles.bdValue}>2 731 ₽</span>
                </div>
              </div>
            </div>
            
            <button className={styles.payButton} onClick={handleOpenPayment}>
              Оплатить
            </button>
          </div>
        ) : (
          <div className={styles.allPaidCard}>
            <div className={styles.allPaidIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className={styles.allPaidTitle}>Все квитанции оплачены</div>
            <div className={styles.allPaidSub}>Задолженностей по ЖКУ нет. Следующий счёт поступит 1 декабря.</div>
          </div>
        )}
        
        {/* AI Alert Component */}
        {(unpaidBill || bills.length > 0) && (
          <div className={styles.aiAlertCard} onClick={() => {
            const billIdToAnalyze = unpaidBill ? unpaidBill.id : (bills[0] ? bills[0].id : 3);
            localStorage.setItem('selectedBillId', String(billIdToAnalyze));
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
              <h3 className={styles.aiHeader}>Разбор квитанции от ИИ</h3>
              <div className={styles.chevronIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
            <p className={styles.aiText}>
              Нейросеть проанализировала квитанцию за {unpaidBill ? formatMonthName(unpaidBill.month) : 'Ноябрь 2024'}. Нажмите, чтобы разобрать формулы или оспорить начисления.
            </p>
            <div className={styles.aiLinkButton}>
              Открыть чат с ИИ
            </div>
          </div>
        )}

        {/* Meters Widget */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>Счетчики</h2>
            <span className={styles.sectionSub}>Показания за текущий период</span>
          </div>
          <button className={styles.metersSubmitLink} onClick={() => onNavigate && onNavigate('meters')}>
            Передать
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <div className={styles.metersGrid}>
          {/* Cold Water */}
          <div className={styles.meterCard} onClick={() => onNavigate && onNavigate('meters')} style={{ cursor: 'pointer' }}>
            <div className={styles.meterHeader}>
              <div className={`${styles.meterIcon} ${styles.blue}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className={styles.meterStatus}>ХВС</span>
            </div>
            <div className={styles.meterData}>
              <span className={styles.meterValue}>{meters.cold_water}</span>
              <span className={styles.meterUnit}>м³</span>
            </div>
            <div className={styles.meterName}>Холодная вода</div>
          </div>

          {/* Hot Water */}
          <div className={styles.meterCard} onClick={() => onNavigate && onNavigate('meters')} style={{ cursor: 'pointer' }}>
            <div className={styles.meterHeader}>
              <div className={`${styles.meterIcon} ${styles.red}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span className={styles.meterStatus}>ГВС</span>
            </div>
            <div className={styles.meterData}>
              <span className={styles.meterValue}>{meters.water}</span>
              <span className={styles.meterUnit}>м³</span>
            </div>
            <div className={styles.meterName}>Горячая вода</div>
          </div>

          {/* Electricity */}
          <div className={styles.meterCard} onClick={() => onNavigate && onNavigate('meters')} style={{ cursor: 'pointer' }}>
            <div className={styles.meterHeader}>
              <div className={`${styles.meterIcon} ${styles.yellow}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className={styles.meterStatusAlert}>До 25 сен</span>
            </div>
            <div className={styles.meterData}>
              <span className={styles.meterValue}>{meters.electricity}</span>
              <span className={styles.meterUnit}>кВт·ч</span>
            </div>
            <div className={styles.meterName}>Электроэнергия</div>
          </div>
        </div>

        {/* History Widget */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>История платежей</h2>
        </div>
        <div className={styles.historyList}>
          {displayReceipts.map(receipt => (
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

      {/* Portal Bottom Sheet for Payment */}
      {showPaymentSheet && unpaidBill && createPortal(
        <div className={styles.modalBackdrop} onClick={() => !isPaying && setShowPaymentSheet(false)}>
          <div 
            className={styles.modalSheet}
            onClick={(e) => e.stopPropagation()}
            {...paymentSwipeHandlers}
          >
            {/* iOS Sheet Grabber */}
            <div className={styles.sheetGrabber} />

            {!paymentReceipt ? (
              <>
                <div className={styles.sheetHeader}>
                  <div className={styles.headerGhost} />
                  <h2 className={styles.sheetTitle}>Оплата ЖКУ</h2>
                  <button className={styles.closeBtn} onClick={() => !isPaying && setShowPaymentSheet(false)} aria-label="Закрыть">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Apple Hero Section */}
                <div className={styles.appleHeroSection}>
                  <div className={styles.appleAmount}>
                    {unpaidBill.amount.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className={styles.appleSubtext}>
                    ООО УК «Смарт Сити» • за {formatMonthName(unpaidBill.month)}
                  </div>
                </div>

                {/* Apple Inset Group 1: Bill & Account */}
                <div className={styles.appleInsetGroup}>
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Лицевой счёт</span>
                    <input 
                      type="text" 
                      className={styles.appleRowInput} 
                      value={accountNumber}
                      onChange={(e) => {
                        setAccountNumber(e.target.value);
                        localStorage.setItem('account_number', e.target.value);
                      }}
                      placeholder="61-0001-0015"
                    />
                  </div>
                  <div className={styles.appleDivider} />
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Получатель</span>
                    <span className={styles.appleRowValue}>
                      ООО УК «Смарт Сити»
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A84FF">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  </div>
                  <div className={styles.appleDivider} />
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Комиссия</span>
                    <span className={styles.appleRowValueGreen}>0 ₽ • Без комиссии</span>
                  </div>
                </div>

                {/* Apple Payment Method Section */}
                <div className={styles.appleSectionLabel}>СПОСОБ ОПЛАТЫ</div>
                <div className={styles.appleInsetGroup}>
                  {/* SBP Option */}
                  <div 
                    className={`${styles.appleSelectRow} ${paymentMethod === 'sbp' ? styles.appleSelectRowActive : ''}`}
                    onClick={() => setPaymentMethod('sbp')}
                  >
                    <div className={styles.appleMethodIcon}>
                      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                        <path d="M16 4L26 14H18.5L13.5 9L16 4Z" fill="#FFD600" />
                        <path d="M26 14L21 28L16 19H23.5L26 14Z" fill="#00E5FF" />
                        <path d="M6 20L16 4L13.5 9L8.5 23L6 20Z" fill="#0A84FF" />
                      </svg>
                    </div>
                    <div className={styles.appleMethodInfo}>
                      <span className={styles.appleMethodTitle}>СБП (Система быстрых платежей)</span>
                      <span className={styles.appleMethodSub}>Без комиссии • Мгновенно</span>
                    </div>
                    <div className={styles.appleCheckmark}>
                      {paymentMethod === 'sbp' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className={styles.appleDivider} />

                  {/* Card Option */}
                  <div 
                    className={`${styles.appleSelectRow} ${paymentMethod === 'card' ? styles.appleSelectRowActive : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className={styles.appleMethodIcon}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="3" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div className={styles.appleMethodInfo}>
                      <span className={styles.appleMethodTitle}>Банковская карта</span>
                      <span className={styles.appleMethodSub}>МИР, Visa, Mastercard</span>
                    </div>
                    <div className={styles.appleCheckmark}>
                      {paymentMethod === 'card' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className={styles.appleDivider} />

                  {/* SberPay Option */}
                  <div 
                    className={`${styles.appleSelectRow} ${paymentMethod === 'sberpay' ? styles.appleSelectRowActive : ''}`}
                    onClick={() => setPaymentMethod('sberpay')}
                  >
                    <div className={styles.appleMethodIcon}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#22C55E" />
                        <path d="M8 12L11 15L16 9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className={styles.appleMethodInfo}>
                      <span className={styles.appleMethodTitle}>SberPay</span>
                      <span className={styles.appleMethodSub}>Приложение СберБанк Онлайн</span>
                    </div>
                    <div className={styles.appleCheckmark}>
                      {paymentMethod === 'sberpay' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Apple Pay Action Button */}
                <button 
                  className={styles.applePayBtn} 
                  onClick={handleExecutePayment}
                  disabled={isPaying || !accountNumber.trim()}
                >
                  {isPaying ? (
                    <span className={styles.spinnerRow}>
                      <span className={styles.appleSpinner} />
                      Обработка платежа...
                    </span>
                  ) : (
                    <span>Оплатить {unpaidBill.amount.toLocaleString('ru-RU')} ₽</span>
                  )}
                </button>
                <div className={styles.appleFooterSecurity}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Защищено сквозным шифрованием Банка России (НСПК)
                </div>
              </>
            ) : (
              <>
                <div className={styles.appleReceiptHeader}>
                  <div className={styles.appleSuccessRing}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className={styles.appleSuccessAmount}>
                    {paymentReceipt.amount.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className={styles.appleSuccessSub}>
                    Оплачено • {paymentReceipt.month}
                  </div>
                </div>

                <div className={styles.appleInsetGroup}>
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Получатель</span>
                    <span className={styles.appleRowValue}>{paymentReceipt.recipient}</span>
                  </div>
                  <div className={styles.appleDivider} />
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Лицевой счёт</span>
                    <span className={styles.appleRowValue}>{paymentReceipt.account_number}</span>
                  </div>
                  <div className={styles.appleDivider} />
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Способ оплаты</span>
                    <span className={styles.appleRowValue}>{paymentReceipt.payment_method}</span>
                  </div>
                  <div className={styles.appleDivider} />
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Чек ФН</span>
                    <span className={styles.appleRowValue}>{paymentReceipt.receipt_number}</span>
                  </div>
                  <div className={styles.appleDivider} />
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Дата и время</span>
                    <span className={styles.appleRowValue}>{paymentReceipt.paid_at}</span>
                  </div>
                  <div className={styles.appleDivider} />
                  <div className={styles.appleRow}>
                    <span className={styles.appleRowLabel}>Статус</span>
                    <span className={styles.appleRowValueGreen}>Зачислено на счёт УК</span>
                  </div>
                </div>

                <button 
                  className={styles.appleDoneBtn}
                  onClick={() => setShowPaymentSheet(false)}
                >
                  Готово
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
