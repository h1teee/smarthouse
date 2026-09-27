import React, { useState, useEffect } from 'react';
import styles from './RequestPreviewScreen.module.css';
import { DEFAULT_ANNOUNCEMENT_IMAGE } from '@/screens/CameraScreen/CameraScreen';

interface RequestPreviewScreenProps {
  onBack?: () => void;
  onSubmit?: () => void;
  capturedImage?: string;
}

const ANALYSIS_STEPS = [
  'Сканирование документа и распознавание текста (OCR)...',
  'Анализ сроков: отключение через 2 недели на 4 дня...',
  'Определение ответственной службы и адресов...',
  'Формирование карточки для модерации...'
];

export const RequestPreviewScreen: React.FC<RequestPreviewScreenProps> = ({
  onBack,
  onSubmit,
  capturedImage: _capturedImage = DEFAULT_ANNOUNCEMENT_IMAGE,
}) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  /* ── Распознанные ИИ характеристики (редактируемые) ── */
  const [eventType, setEventType] = useState('water');
  const [dates, setDates] = useState('15.10.2026 – 19.10.2026 (через 2 недели, на 4 дня)');
  const [workHours, setWorkHours] = useState('ежедневно с 09:00 до 18:00');
  const [address, setAddress] = useState('ул. Космонавтов 34а, все подъезды');
  const [provider, setProvider] = useState('МУП «Теплосеть» / УК «Смарт Сити»');
  const [phone, setPhone] = useState('+7 (495) 777-12-34');
  const [description, setDescription] = useState('');

  const eventLabels: Record<string, string> = {
    water: 'Отключение горячей воды',
    electricity: 'Отключение электроэнергии',
    coldWater: 'Отключение холодной воды',
    heating: 'Плановые работы по отоплению',
    other: 'Другое объявление',
  };

  /* Автоматическое переключение шагов анимации анализа ИИ */
  useEffect(() => {
    if (!isProcessing) return;

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    const finishTimer = setTimeout(() => {
      setIsProcessing(false);
    }, 2800);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(finishTimer);
    };
  }, [isProcessing]);

  const handleSkipAnalysis = () => {
    setIsProcessing(false);
  };

  const [isLoadingSend, setIsLoadingSend] = useState(false);
  const handleSendToModeration = async () => {
    setIsLoadingSend(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setIsSuccess(true);
      setTimeout(() => {
        onSubmit?.();
      }, 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSend(false);
    }
  };

  /* ─────────────────────────────────────────────────── */
  /*  Состояние 1: Анимация ИИ-анализа                  */
  /* ─────────────────────────────────────────────────── */
  if (isProcessing) {
    return (
      <div className={styles.screen}>
        {/* Ambient neural glow */}
        <div className={styles.ambientGlow} aria-hidden="true" />

        <div className={styles.processingContentCenter}>
          <div className={styles.neuralHaloLarge} />
          
          <h2 className={styles.processingTitleMain}>
            Анализ объявления
          </h2>
          <p className={styles.processingSubtitleMain}>
            {ANALYSIS_STEPS[stepIndex]}
          </p>

          <div className={styles.progressBarTrackCenter}>
            <div 
              className={styles.progressBarFillCenter} 
              style={{ width: `${((stepIndex + 1) / ANALYSIS_STEPS.length) * 100}%` }} 
            />
          </div>
        </div>

        {/* Footer с еле заметной демо-кнопкой «Продолжить» */}
        <footer className={styles.footerProcessing}>
          <button
            className={styles.demoContinueBtn}
            onClick={handleSkipAnalysis}
          >
            Продолжить
          </button>
          <div className={styles.homeIndicator} aria-hidden="true" />
        </footer>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────── */
  /*  Состояние 3: Успешная отправка                    */
  /* ─────────────────────────────────────────────────── */
  if (isSuccess) {
    return (
      <div className={styles.screen}>
        <div className={styles.ambientGlowSuccess} aria-hidden="true" />
        <div className={styles.successContentCenter}>
          <div className={styles.successCircle}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className={styles.successTitle}>Успешно отправлено на проверку</h2>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────── */
  /*  Состояние 2: Распознанные характеристики          */
  /* ─────────────────────────────────────────────────── */
  return (
    <div className={styles.screen}>
      {/* Ambient glow */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* ── Navigation bar ──────────────────────────── */}
      <header className={styles.navBar}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Назад">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Назад</span>
        </button>
        <h1 className={styles.navTitle}>Отправить объявление</h1>
        <div className={styles.navSpacer} />
      </header>

      {/* ── Scrollable content ──────────────────────── */}
      <main className={styles.scrollArea}>
        {/* AI Result Header Card */}
        <div className={styles.aiStatusCard}>
          <div className={styles.aiStatusHeader}>
            <div className={styles.aiBadge}>
              <span className={styles.aiSparkle}>✨</span>
              <span>ИИ-анализ выполнен</span>
            </div>
            <span className={styles.confidenceScore}>98% точность</span>
          </div>
          <p className={styles.aiStatusDesc}>
            Проверьте распознанные данные. Вы можете скорректировать любое поле перед отправкой в УК.
          </p>
        </div>

        {/* ── Characteristics Group ──────── */}
        <div className={styles.fieldsGroup}>
          {/* 1. Тип события */}
          <div className={styles.fieldItem}>
            <div className={`${styles.fieldIconWrap} ${styles.iconPurple}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Тип события</span>
              <div className={styles.selectWrapper}>
                <select
                  className={styles.fieldSelect}
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option value="water">Отключение горячей воды</option>
                  <option value="electricity">Отключение электроэнергии</option>
                  <option value="coldWater">Отключение холодной воды</option>
                  <option value="heating">Плановые работы по отоплению</option>
                  <option value="other">Другое объявление</option>
                </select>
                <span className={styles.selectText}>{eventLabels[eventType]}</span>
                <svg className={styles.selectChevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          <div className={styles.rowDivider} />

          {/* 2. Сроки отключения */}
          <div className={styles.fieldItem}>
            <div className={`${styles.fieldIconWrap} ${styles.iconOrange}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Сроки</span>
              <textarea
                className={styles.fieldInputMultiline}
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="Сроки проведения"
                rows={2}
              />
            </div>
          </div>

          <div className={styles.rowDivider} />

          {/* 3. Время проведения */}
          <div className={styles.fieldItem}>
            <div className={`${styles.fieldIconWrap} ${styles.iconBlue}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Время</span>
              <textarea
                className={styles.fieldInputMultiline}
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                placeholder="Время проведения"
                rows={1}
              />
            </div>
          </div>

          <div className={styles.rowDivider} />

          {/* 4. Адрес */}
          <div className={styles.fieldItem}>
            <div className={`${styles.fieldIconWrap} ${styles.iconGreen}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Адрес</span>
              <textarea
                className={styles.fieldInputMultiline}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Адрес (дома, подъезды)"
                rows={2}
              />
            </div>
          </div>

          <div className={styles.rowDivider} />

          {/* 5. Ответственная служба */}
          <div className={styles.fieldItem}>
            <div className={`${styles.fieldIconWrap} ${styles.iconTeal}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <line x1="9" y1="22" x2="9" y2="22.01" />
                <line x1="15" y1="22" x2="15" y2="22.01" />
                <line x1="9" y1="6" x2="9" y2="6.01" />
                <line x1="15" y1="6" x2="15" y2="6.01" />
                <line x1="9" y1="10" x2="9" y2="10.01" />
                <line x1="15" y1="10" x2="15" y2="10.01" />
                <line x1="9" y1="14" x2="9" y2="14.01" />
                <line x1="15" y1="14" x2="15" y2="14.01" />
              </svg>
            </div>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Организация</span>
              <textarea
                className={styles.fieldInputMultiline}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Кто проводит работы"
                rows={1}
              />
            </div>
          </div>

          <div className={styles.rowDivider} />

          {/* 6. Описание */}
          <div className={styles.fieldItem}>
            <div className={`${styles.fieldIconWrap} ${styles.iconYellow}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Описание / Примечание</span>
              <textarea
                className={styles.fieldInputMultiline}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительные детали (по желанию)"
                rows={2}
              />
            </div>
          </div>

          <div className={styles.rowDivider} />

          {/* 7. Телефон */}
          <div className={styles.fieldItem}>
            <div className={`${styles.fieldIconWrap} ${styles.iconPink}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className={styles.fieldContent}>
              <span className={styles.fieldLabel}>Контактный телефон</span>
              <input
                className={styles.fieldInputSingle}
                type="text"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.startsWith('7') || val.startsWith('8')) val = val.substring(1);
                  let formatted = '+7';
                  if (val.length > 0) formatted += ` (${val.substring(0, 3)}`;
                  if (val.length >= 3) formatted += `) ${val.substring(3, 6)}`;
                  if (val.length >= 6) formatted += `-${val.substring(6, 8)}`;
                  if (val.length >= 8) formatted += `-${val.substring(8, 10)}`;
                  setPhone(val.length === 0 ? '' : formatted);
                }}
                placeholder="+7 (___) ___-__-__"
                maxLength={18}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer с кнопками ──────────────────────────── */}
      <footer className={styles.footerForm}>
        <button 
          className={styles.submitBtn} 
          onClick={handleSendToModeration}
          type="button"
          disabled={isLoadingSend}
        >
          {isLoadingSend ? "Отправка на модерацию..." : "Отправить на модерацию"}
        </button>

        <button 
          className={styles.cancelActionBtn} 
          onClick={onSubmit}
          type="button"
        >
          Отменить
        </button>

        <div className={styles.homeIndicator} aria-hidden="true" />
      </footer>
    </div>
  );
};
