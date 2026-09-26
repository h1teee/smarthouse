import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ProfileScreen.module.css';
import { useSwipeClose } from '../../hooks/useSwipeClose';

interface Offer {
  id: string;
  partner: string;
  tag: string;
  rate: string;
  desc: string;
  gradient: string;
  borderColor: string;
  promoCode: string;
}

const OFFERS: Offer[] = [
  {
    id: 'vkusvill',
    partner: 'ВкусВилл',
    tag: 'В доме',
    rate: '10%',
    desc: 'Кешбэк на продукты и доставку',
    gradient: 'linear-gradient(145deg, #0d2818 0%, #05120a 100%)',
    borderColor: 'rgba(48, 209, 88, 0.4)',
    promoCode: 'DOM-VKUS-42'
  },
  {
    id: 'yandex',
    partner: 'Яндекс Go',
    tag: 'Город',
    rate: '15%',
    desc: 'Скидка на поездки и доставку',
    gradient: 'linear-gradient(145deg, #2b1f07 0%, #140d02 100%)',
    borderColor: 'rgba(255, 214, 10, 0.4)',
    promoCode: 'YANGO-RESIDENT'
  },
  {
    id: 'sbp',
    partner: 'СБП',
    tag: 'Финансы',
    rate: '0%',
    desc: 'Оплата ЖКУ без комиссии + кешбэк',
    gradient: 'linear-gradient(145deg, #0c203b 0%, #040c17 100%)',
    borderColor: 'rgba(100, 210, 255, 0.4)',
    promoCode: 'SBP-ZERO-FEE'
  },
  {
    id: 'surfcoffee',
    partner: 'Surf Coffee',
    tag: 'В доме',
    rate: '20%',
    desc: 'Специальный тариф в кофейне лобби',
    gradient: 'linear-gradient(145deg, #280a22 0%, #12030f 100%)',
    borderColor: 'rgba(191, 90, 242, 0.4)',
    promoCode: 'SURF-NEIGHBOR-42'
  }
];

export const ProfileScreen: React.FC = () => {
  const [debt, setDebt] = useState<number>(0);
  const [cashback, setCashback] = useState<number>(4850);
  const [notifications, setNotifications] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Рефы и модальные окна
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState<boolean>(false);
  const [showLogout, setShowLogout] = useState<boolean>(false);
  const [showApplyCashback, setShowApplyCashback] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const swipeAvatar = useSwipeClose(() => setShowAvatarSheet(false));
  const swipeSettings = useSwipeClose(() => setShowSettingsModal(false));
  const swipeOffer = useSwipeClose(() => setActiveOffer(null));
  const swipeCashback = useSwipeClose(() => setShowApplyCashback(false));
  const swipeModal = useSwipeClose(() => setActiveModal(null));
  const swipeLogout = useSwipeClose(() => setShowLogout(false));

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAvatarClick = () => {
    if (avatarUrl) {
      setShowAvatarSheet(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
          notify('Фото профиля обновлено');
          setShowAvatarSheet(false);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDeleteAvatar = () => {
    setAvatarUrl(null);
    setShowAvatarSheet(false);
    notify('Фото профиля удалено');
  };

  const handleApplyCashback = () => {
    const amount = cashback;
    setCashback(0);
    setShowApplyCashback(false);
    notify(`${amount.toLocaleString('ru-RU')} ₽ списаны в счёт ЖКУ`);
  };

  return (
    <div className={styles.container}>
      {/* Скрытый input для выбора фото */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Деликатный фоновый свет */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Dynamic Island Toast */}
      {toast && (
        <div className={styles.dynamicToast}>
          <span className={styles.toastDot} />
          <span>{toast}</span>
        </div>
      )}

      {/* Верхний бар */}
      <header className={styles.navBar}>
        <h1 className={styles.screenTitle}>Профиль</h1>
        <button
          className={styles.demoToggleBtn}
          data-active={debt > 0}
          onClick={() => {
            const nextDebt = debt === 0 ? 5430 : 0;
            setDebt(nextDebt);
            notify(nextDebt > 0 ? 'Имитация долга включена' : 'Задолженность погашена');
          }}
        >
          {debt > 0 ? 'Долг 5 430 ₽' : 'Долга нет'}
        </button>
      </header>

      {/* Карточка Apple ID (с возможностью смены аватара) */}
      <div className={styles.profileHeader}>
        <div 
          className={styles.avatarWrapper}
          onClick={handleAvatarClick}
          title="Нажмите, чтобы изменить фото профиля"
        >
          <div className={styles.avatar}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Аватар профиля" className={styles.avatarImg} />
            ) : (
              'АА'
            )}
          </div>
          <div className={styles.avatarEditBadge}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </div>

        <h2 className={styles.name}>Александр Александров</h2>
        <div className={styles.metaRow}>
          <span>кв. 42</span>
          <span>•</span>
          <span className={styles.metaBadge}>УК «Смарт Сити»</span>
        </div>
      </div>

      {/* Баланс кешбэка */}
      <div className={styles.balanceBar}>
        <div>
          <div className={styles.balanceLabel}>Кешбэк на ЖКУ</div>
          <div className={styles.balanceAmount}>
            <span>{cashback.toLocaleString('ru-RU')}</span>
            <span style={{ fontSize: 18, fontWeight: 500 }}>₽</span>
          </div>
        </div>

        {debt > 0 ? (
          <div className={styles.debtIndicator}>
            Задолженность 5 430 ₽
          </div>
        ) : cashback > 0 ? (
          <button 
            className={styles.balanceActionBtn}
            onClick={() => setShowApplyCashback(true)}
          >
            Списать
          </button>
        ) : (
          <div className={styles.successPill}>
            <span>Списано</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Быстрые карточки (Карты и Бонусы — Консьерж и Пропуск убраны по запросу) */}
      <div className={styles.quickTilesRow}>
        <button 
          className={styles.quickTile}
          onClick={() => setActiveModal('cards')}
        >
          <div className={styles.quickTileIcon} style={{ background: 'linear-gradient(135deg, #0A84FF, #0056B3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className={styles.quickTileInfo}>
            <span className={styles.quickTileTitle}>Мои карты</span>
            <span className={styles.quickTileSubtitle}>МИР •• 9012</span>
          </div>
          <svg className={styles.chevronSmall} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button 
          className={styles.quickTile}
          onClick={() => setActiveModal('history')}
        >
          <div className={styles.quickTileIcon} style={{ background: 'linear-gradient(135deg, #30D158, #1C8234)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className={styles.quickTileInfo}>
            <span className={styles.quickTileTitle}>Бонусы</span>
            <span className={styles.quickTileSubtitle}>+840 ₽ в авг</span>
          </div>
          <svg className={styles.chevronSmall} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Секция: Партнеры и Привилегии */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Привилегии</h3>
          <span className={styles.sectionCount}>{OFFERS.length} предложения</span>
        </div>

        <div className={styles.carousel}>
          {OFFERS.map(offer => (
            <div 
              key={offer.id}
              className={styles.card}
              style={{
                background: offer.gradient,
                borderColor: offer.borderColor
              }}
              onClick={() => {
                if (debt === 0) setActiveOffer(offer);
              }}
            >
              <div className={styles.cardTop}>
                <span className={styles.partnerTitle}>{offer.partner}</span>
                <span className={styles.cardTag}>{offer.tag}</span>
              </div>

              <div className={styles.cardCenter}>
                <div className={styles.cardRate}>{offer.rate}</div>
                <div className={styles.cardDesc}>{offer.desc}</div>
              </div>

              <div className={styles.cardBottom}>
                <div className={styles.cardChip} />
                <span className={styles.cardArrow}>
                  Подробнее
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>

              {/* Заблокированное состояние при долге */}
              {debt > 0 && (
                <div className={styles.lockOverlay} onClick={(e) => e.stopPropagation()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF453A" strokeWidth="2.2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className={styles.lockText}>Оплатите задолженность</span>
                  <button 
                    className={styles.unlockBtn}
                    onClick={() => {
                      setDebt(0);
                      notify('Задолженность оплачена! Доступ открыт');
                    }}
                  >
                    Оплатить 5 430 ₽
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Горизонтальная кнопка "Настройки" с красивой иконкой (над Выйти из аккаунта) */}
      <button 
        className={styles.settingsButton}
        onClick={() => setShowSettingsModal(true)}
      >
        <div className={styles.settingsButtonIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <span className={styles.settingsButtonLabel}>Настройки</span>
        <svg className={styles.settingsButtonChevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Кнопка выхода из аккаунта */}
      <button 
        className={styles.logoutBtn}
        onClick={() => setShowLogout(true)}
      >
        Выйти из аккаунта
      </button>

      <div className={styles.bottomSpacer} aria-hidden="true" />

      {/* ══════════════════════════════════════════════════════════════════
          PORTAL МОДАЛКИ (РЕНДЕРЯТСЯ ПОВЕРХ TABBAR ЧЕРЕЗ DOCUMENT.BODY)
          ══════════════════════════════════════════════════════════════════ */}

      {/* 1. Модалка: Смена аватара */}
      {showAvatarSheet && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setShowAvatarSheet(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()} {...swipeAvatar}>
            <div className={styles.grabber} />
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Фото профиля</h3>
              <button className={styles.closeBtn} onClick={() => setShowAvatarSheet(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <button 
              className={styles.primaryBtn}
              onClick={() => {
                setShowAvatarSheet(false);
                fileInputRef.current?.click();
              }}
            >
              Выбрать другое фото
            </button>
            <button 
              className={styles.destructiveBtn}
              style={{ marginTop: 8 }}
              onClick={handleDeleteAvatar}
            >
              Удалить фото
            </button>
            <button 
              className={styles.secondaryBtn} 
              onClick={() => setShowAvatarSheet(false)}
            >
              Отмена
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Модалка: Настройки (открывается по кнопке) */}
      {showSettingsModal && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setShowSettingsModal(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()} {...swipeSettings}>
            <div className={styles.grabber} />
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Настройки</h3>
              <button className={styles.closeBtn} onClick={() => setShowSettingsModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.settingsListModal}>
              <div 
                className={styles.modalSettingsRow}
                onClick={() => {
                  const next = !notifications;
                  setNotifications(next);
                  notify(next ? 'Уведомления включены' : 'Уведомления отключены');
                }}
              >
                <span>Push-уведомления</span>
                <div className={styles.switchTrack} data-checked={notifications}>
                  <div className={styles.switchKnob} />
                </div>
              </div>

              <div 
                className={styles.modalSettingsRow}
                onClick={() => {
                  notify('Договор с УК «Смарт Сити» открыт');
                  setShowSettingsModal(false);
                }}
              >
                <span>Документы УК</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(235, 235, 245, 0.4)" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              <div 
                className={styles.modalSettingsRow}
                onClick={() => {
                  notify('Приложение обновлено до актуальной версии');
                }}
              >
                <span>О приложении</span>
                <span style={{ fontSize: 13, color: 'rgba(235, 235, 245, 0.5)' }}>v2.4.0</span>
              </div>
            </div>

            <button 
              className={styles.primaryBtn}
              onClick={() => setShowSettingsModal(false)}
            >
              Готово
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 3. Модалка: Детали предложения кешбэка */}
      {activeOffer && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setActiveOffer(null)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()} {...swipeOffer}>
            <div className={styles.grabber} />
            
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{activeOffer.partner}</h3>
              <button className={styles.closeBtn} onClick={() => setActiveOffer(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.promoBox}>
              <div style={{ fontSize: 13, color: 'rgba(235, 235, 245, 0.6)' }}>Промокод жителя</div>
              <div className={styles.promoCode}>{activeOffer.promoCode}</div>
              <div style={{ fontSize: 14, color: '#FFFFFF', textAlign: 'center' }}>
                {activeOffer.desc}
              </div>
            </div>

            <button 
              className={styles.primaryBtn}
              onClick={() => {
                navigator.clipboard?.writeText(activeOffer.promoCode);
                notify(`Промокод ${activeOffer.promoCode} скопирован`);
                setActiveOffer(null);
              }}
            >
              Скопировать промокод
            </button>
            <button 
              className={styles.secondaryBtn}
              onClick={() => setActiveOffer(null)}
            >
              Закрыть
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Модалка: Списание кешбэка */}
      {showApplyCashback && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setShowApplyCashback(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()} {...swipeCashback}>
            <div className={styles.grabber} />
            
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Списать кешбэк</h3>
              <button className={styles.closeBtn} onClick={() => setShowApplyCashback(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
              <div style={{ fontSize: 34, fontWeight: 700, color: '#30D158' }}>
                {cashback.toLocaleString('ru-RU')} ₽
              </div>
              <p style={{ fontSize: 14, color: 'rgba(235, 235, 245, 0.6)', margin: '8px 0 0' }}>
                Сумма будет учтена в следующей квитанции УК «Смарт Сити».
              </p>
            </div>

            <button className={styles.primaryBtn} onClick={handleApplyCashback}>
              Подтвердить списание
            </button>
            <button className={styles.secondaryBtn} onClick={() => setShowApplyCashback(false)}>
              Отмена
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 5. Модалка: Быстрые действия (Карты, Бонусы) */}
      {activeModal && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()} {...swipeModal}>
            <div className={styles.grabber} />
            
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {activeModal === 'cards' ? 'Банковские карты' : 'История бонусов'}
              </h3>
              <button className={styles.closeBtn} onClick={() => setActiveModal(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {activeModal === 'cards' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#FFF' }}>МИР Сбербанк •• 9012</div>
                    <div style={{ fontSize: 12, color: '#30D158' }}>Автоплатёж включен</div>
                  </div>
                  <span style={{ fontSize: 20 }}>💳</span>
                </div>
                <button 
                  className={styles.primaryBtn}
                  onClick={() => {
                    notify('Привязка новой карты...');
                    setActiveModal(null);
                  }}
                >
                  Привязать новую карту
                </button>
              </div>
            )}

            {activeModal === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>ВкусВилл</div>
                    <div style={{ fontSize: 12, color: 'rgba(235,235,245,0.5)' }}>18 авг 2026</div>
                  </div>
                  <span style={{ fontSize: 15, color: '#30D158', fontWeight: 700 }}>+350 ₽</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>Surf Coffee</div>
                    <div style={{ fontSize: 12, color: 'rgba(235,235,245,0.5)' }}>14 авг 2026</div>
                  </div>
                  <span style={{ fontSize: 15, color: '#30D158', fontWeight: 700 }}>+210 ₽</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>Оплата через СБП</div>
                    <div style={{ fontSize: 12, color: 'rgba(235,235,245,0.5)' }}>10 авг 2026</div>
                  </div>
                  <span style={{ fontSize: 15, color: '#30D158', fontWeight: 700 }}>+280 ₽</span>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 6. Диалог подтверждения выхода */}
      {showLogout && createPortal(
        <div className={styles.modalBackdrop} onClick={() => setShowLogout(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()} {...swipeLogout}>
            <div className={styles.grabber} />
            
            <div style={{ textAlign: 'center', margin: '8px 0 20px' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#FFF' }}>Выйти из аккаунта?</div>
              <div style={{ fontSize: 13, color: 'rgba(235, 235, 245, 0.55)', marginTop: 4 }}>
                Потребуется повторный вход в приложение
              </div>
            </div>

            <button 
              className={styles.destructiveBtn}
              onClick={() => {
                setShowLogout(false);
                notify('Сессия завершена');
              }}
            >
              Выйти
            </button>
            <button className={styles.secondaryBtn} onClick={() => setShowLogout(false)}>
              Отмена
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
