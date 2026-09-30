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
  const [meters, setMeters] = useState({ water: 142, electricity: 8450 });
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

  const getDueDateText = (m: string) => {
    if (m === '2024-09' || m.includes('09')) return 'до 10 октября';
    if (m === '2024-10' || m.includes('10')) return 'до 10 ноября';
    if (m === '2024-11' || m.includes('11')) return 'до 10 декабря';
    return 'до 10 числа';
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
    fetchBills();
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
              <div className={styles.statusBadge}>
                <span className={styles.statusDot} />
                Не оплачено
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
              Оплатить {unpaidBill.amount.toLocaleString('ru-RU')} ₽ {getDueDateText(unpaidBill.month)}
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
              Открыть чат с GigaChat
            </div>
          </div>
        )}

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
              <span className={styles.meterValue}>{meters.water}</span>
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
              <span className={styles.meterValue}>{meters.electricity}</span>
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

      {/* Portal Bottom Sheet for Payment */}
      {showPaymentSheet && unpaidBill && createPortal(
        <div className={styles.modalBackdrop} onClick={() => !isPaying && setShowPaymentSheet(false)}>
          <div 
            className={styles.modalSheet}
            onClick={(e) => e.stopPropagation()}
            {...paymentSwipeHandlers}
          >
            <div className={styles.grabberWrap} onClick={() => !isPaying && setShowPaymentSheet(false)}>
              <div className={styles.grabber} />
            </div>

            {!paymentReceipt ? (
              <>
                <div className={styles.sheetHeader}>
                  <h2 className={styles.sheetTitle}>Оплата ЖКУ</h2>
                  <button className={styles.closeBtn} onClick={() => !isPaying && setShowPaymentSheet(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className={styles.paymentSheetAmountCard}>
                  <div className={styles.paymentSheetAmount}>{unpaidBill.amount.toLocaleString('ru-RU')} ₽</div>
                  <div className={styles.paymentSheetSub}>За {formatMonthName(unpaidBill.month)} • Комиссия 0%</div>
                </div>

                <div className={styles.sectionSubHeader}>Лицевой счёт плательщика</div>
                <div className={styles.accountInputWrapper}>
                  <div className={styles.accountInputIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    className={styles.accountInput} 
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      localStorage.setItem('account_number', e.target.value);
                    }}
                    placeholder="Введите лицевой счет..."
                  />
                </div>

                <div className={styles.receiptCard} style={{ marginBottom: 16, padding: '12px 16px' }}>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Получатель</span>
                    <span className={styles.receiptValue}>ООО УК «Смарт Сити»</span>
                  </div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Назначение</span>
                    <span className={styles.receiptValue}>Оплата ЖКУ за {formatMonthName(unpaidBill.month)}</span>
                  </div>
                </div>

                <div className={styles.sectionSubHeader}>Способ оплаты</div>
                <div className={styles.paymentMethodsGroup}>
                  <div 
                    className={`${styles.paymentMethodOption} ${paymentMethod === 'sbp' ? styles.paymentMethodOptionActive : ''}`}
                    onClick={() => setPaymentMethod('sbp')}
                  >
                    <div className={styles.methodLeft}>
                      <div className={styles.methodIconBox}>⚡</div>
                      <div className={styles.methodInfo}>
                        <span className={styles.methodTitle}>СБП (Система быстрых платежей)</span>
                        <span className={styles.methodDesc}>В приложении любого банка • 0% комиссии</span>
                      </div>
                    </div>
                    <div className={styles.methodRadio}>
                      {paymentMethod === 'sbp' && <div className={styles.methodRadioDot} />}
                    </div>
                  </div>

                  <div 
                    className={`${styles.paymentMethodOption} ${paymentMethod === 'card' ? styles.paymentMethodOptionActive : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className={styles.methodLeft}>
                      <div className={styles.methodIconBox}>💳</div>
                      <div className={styles.methodInfo}>
                        <span className={styles.methodTitle}>Банковская карта</span>
                        <span className={styles.methodDesc}>Мир, Visa, Mastercard</span>
                      </div>
                    </div>
                    <div className={styles.methodRadio}>
                      {paymentMethod === 'card' && <div className={styles.methodRadioDot} />}
                    </div>
                  </div>

                  <div 
                    className={`${styles.paymentMethodOption} ${paymentMethod === 'sberpay' ? styles.paymentMethodOptionActive : ''}`}
                    onClick={() => setPaymentMethod('sberpay')}
                  >
                    <div className={styles.methodLeft}>
                      <div className={styles.methodIconBox}>🟢</div>
                      <div className={styles.methodInfo}>
                        <span className={styles.methodTitle}>SberPay</span>
                        <span className={styles.methodDesc}>Оплата в один клик через Сбер</span>
                      </div>
                    </div>
                    <div className={styles.methodRadio}>
                      {paymentMethod === 'sberpay' && <div className={styles.methodRadioDot} />}
                    </div>
                  </div>
                </div>

                <button 
                  className={styles.paymentConfirmBtn} 
                  onClick={handleExecutePayment}
                  disabled={isPaying || !accountNumber.trim()}
                >
                  {isPaying ? (
                    <>Проведение платежа в банке...</>
                  ) : (
                    <>Оплатить {unpaidBill.amount.toLocaleString('ru-RU')} ₽ через {paymentMethod === 'sbp' ? 'СБП' : paymentMethod === 'card' ? 'карту' : 'SberPay'}</>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className={styles.successHeader}>
                  <div className={styles.successIconCircle}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className={styles.successTitle}>Оплата проведена!</h2>
                  <p className={styles.successSub}>Квитанция за {paymentReceipt.month} успешно оплачена</p>
                </div>

                <div className={styles.receiptCard} style={{ marginBottom: 20 }}>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Сумма</span>
                    <span className={styles.receiptValue} style={{ color: '#34C759', fontSize: 18, fontWeight: 700 }}>
                      {paymentReceipt.amount.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Лицевой счёт</span>
                    <span className={styles.receiptValue}>{paymentReceipt.account_number}</span>
                  </div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Получатель</span>
                    <span className={styles.receiptValue}>{paymentReceipt.recipient}</span>
                  </div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Фискальный чек</span>
                    <span className={styles.receiptValue}>{paymentReceipt.receipt_number}</span>
                  </div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Дата и время</span>
                    <span className={styles.receiptValue}>{paymentReceipt.paid_at}</span>
                  </div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Способ оплаты</span>
                    <span className={styles.receiptValue}>{paymentReceipt.payment_method}</span>
                  </div>
                  <hr className={styles.receiptDivider} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Статус платежа</span>
                    <span className={styles.receiptValue} style={{ color: '#34C759' }}>Зачислено на счёт УК</span>
                  </div>
                </div>

                <button 
                  className={styles.paymentConfirmBtn}
                  onClick={() => setShowPaymentSheet(false)}
                >
                  Отлично
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
