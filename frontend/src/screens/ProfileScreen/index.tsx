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
    desc: 'Скидка на доставку продуктов',
    gradient: 'linear-gradient(145deg, #0d2818 0%, #05120a 100%)',
    borderColor: 'rgba(48, 209, 88, 0.4)',
    promoCode: 'DOM-VKUS-42'
  },
  {
    id: 'yandex',
    partner: 'Яндекс Go',
    tag: 'Такси',
    rate: '15%',
    desc: 'Кешбэк на поездки от дома',
    gradient: 'linear-gradient(145deg, #1f1b0a 0%, #0c0a03 100%)',
    borderColor: 'rgba(255, 204, 0, 0.4)',
    promoCode: 'DOM-YATAXI'
  }
];

interface ProfileScreenProps {
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showAvatarSheet, setShowAvatarSheet] = useState<boolean>(false);
  const [showLogout, setShowLogout] = useState<boolean>(false);
  const [showApplyCashback, setShowApplyCashback] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const swipeAvatar = useSwipeClose(() => setShowAvatarSheet(false));
  const swipeSettings = useSwipeClose(() => setShowSettingsModal(false));
  const swipeModal = useSwipeClose(() => setActiveModal(null));
  const swipeLogout = useSwipeClose(() => setShowLogout(false));

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.ambientGlow} />

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.avatarWrap} onClick={() => setShowAvatarSheet(true)}>
            <div className={styles.avatar}>
              <span>И</span>
            </div>
            <div className={styles.avatarBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>Иван Иванов</h1>
            <p className={styles.userMeta}>Квартира 15 • Л/С 61-0001-0015</p>
          </div>
          <button className={styles.settingsBtn} onClick={() => setShowSettingsModal(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.scrollContent}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <span className={styles.balanceLabel}>Накоплено кешбэка</span>
            <div className={styles.balanceHelp} onClick={() => setActiveModal('cashbackHelp')}>
              ?
            </div>
          </div>
          <div className={styles.balanceAmount}>1 450 <span className={styles.balanceCurrency}>₽</span></div>
          <div className={styles.balanceFooter}>
            <span className={styles.balanceSub}>Можно оплатить до 30% ЖКУ</span>
            <button 
              className={styles.applyCashbackBtn}
              onClick={() => setShowApplyCashback(true)}
            >
              Списать
            </button>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Предложения партнеров</h2>
            <button className={styles.seeAllBtn}>Все</button>
          </div>
          <div className={styles.offersGrid}>
            {OFFERS.map(offer => (
              <div 
                key={offer.id} 
                className={styles.offerCard}
                style={{ background: offer.gradient, borderColor: offer.borderColor }}
                onClick={() => setActiveModal(`offer_${offer.id}`)}
              >
                <div className={styles.offerTag}>{offer.tag}</div>
                <div className={styles.offerHeader}>
                  <h3 className={styles.offerPartner}>{offer.partner}</h3>
                  <div className={styles.offerRate}>{offer.rate}</div>
                </div>
                <p className={styles.offerDesc}>{offer.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Управление</h2>
          <div className={styles.menuList}>
            <div className={styles.menuItem}>
              <div className={styles.menuIconWrap} style={{background: 'rgba(48, 209, 88, 0.1)', color: '#30D158'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className={styles.menuText}>
                <div className={styles.menuTitle}>Жильцы и доступ</div>
                <div className={styles.menuSubtitle}>Управление доступом в квартиру</div>
              </div>
              <div className={styles.menuArrow}>›</div>
            </div>

            <div className={styles.menuItem}>
              <div className={styles.menuIconWrap} style={{background: 'rgba(10, 132, 255, 0.1)', color: '#0A84FF'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className={styles.menuText}>
                <div className={styles.menuTitle}>Контакты УК</div>
                <div className={styles.menuSubtitle}>Телефоны служб и диспетчерской</div>
              </div>
              <div className={styles.menuArrow}>›</div>
            </div>

            <div className={styles.menuItem}>
              <div className={styles.menuIconWrap} style={{background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </div>
              <div className={styles.menuText}>
                <div className={styles.menuTitle}>Сообщить о проблеме</div>
                <div className={styles.menuSubtitle}>Оставить жалобу на работу сервиса</div>
              </div>
              <div className={styles.menuArrow}>›</div>
            </div>
          </div>
        </section>

        <button 
          className={styles.logoutBtn}
          onClick={() => setShowLogout(true)}
        >
          Выйти из аккаунта
        </button>

        <div className={styles.bottomSpacer} aria-hidden="true" />

        {showLogout && createPortal(
          <div className={styles.modalBackdrop} onClick={() => setShowLogout(false)}>
            <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()} {...swipeLogout}>
              <div className={styles.grabber} />
              <div style={{ textAlign: 'center', margin: '8px 0 20px' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#FFF' }}>Выйти из аккаунта?</div>
                <div style={{ fontSize: 13, color: 'rgba(235, 235, 245, 0.55)', marginTop: 4 }}>
                  Вам потребуется заново ввести данные лицевого счета
                </div>
              </div>
              <button 
                className={styles.primaryBtnAction}
                style={{ background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A' }}
                onClick={() => {
                  setShowLogout(false);
                  localStorage.removeItem('user_id');
                  localStorage.removeItem('role');
                  if (onLogout) onLogout();
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

      {toast && createPortal(
        <div className={styles.toast}>
          {toast}
        </div>,
        document.body
      )}
    </div>
  );
};