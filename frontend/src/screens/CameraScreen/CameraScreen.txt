import React, { useState, useRef } from 'react';
import styles from './CameraScreen.module.css';

export const DEFAULT_ANNOUNCEMENT_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850">
  <rect width="600" height="850" fill="#F8F8FA"/>
  <rect x="25" y="25" width="550" height="800" fill="#FFFFFF" stroke="#D1D1D6" stroke-width="1.5" rx="6"/>
  
  <!-- Header Stamp -->
  <rect x="50" y="55" width="160" height="32" rx="6" fill="#000000" opacity="0.06"/>
  <text x="60" y="76" font-family="-apple-system, sans-serif" font-size="13" font-weight="bold" fill="#2C2C2E">УК «СМАРТ СИТИ»</text>
  <text x="440" y="76" font-family="-apple-system, sans-serif" font-size="13" fill="#8E8E93">15.09.2026</text>

  <!-- Big Title -->
  <text x="300" y="160" font-family="-apple-system, sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="3">ОБЪЯВЛЕНИЕ</text>
  <line x1="140" y1="185" x2="460" y2="185" stroke="#BF5AF2" stroke-width="4" stroke-linecap="round"/>

  <!-- Subtitle -->
  <text x="300" y="235" font-family="-apple-system, sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="#1C1C1E">Уважаемые жители дома!</text>
  
  <!-- Main text -->
  <text x="65" y="290" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">Уведомляем вас, что через 2 недели,</text>
  <text x="65" y="325" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" fill="#FF3B30">с 15 по 19 октября 2026 г. (на 4 дня)</text>
  <text x="65" y="360" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">в связи с проведением плановых гидравлических испытаний</text>
  <text x="65" y="395" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">будет временно прекращена подача</text>
  <text x="65" y="435" font-family="-apple-system, sans-serif" font-size="21" font-weight="900" fill="#000000">ГОРЯЧЕГО ВОДОСНАБЖЕНИЯ</text>
  <text x="65" y="475" font-family="-apple-system, sans-serif" font-size="17" fill="#3A3A3C">по адресу: ул. Космонавтов, д. 34а (все подъезды).</text>

  <!-- Notice block -->
  <rect x="55" y="520" width="490" height="90" rx="10" fill="#F2F2F7"/>
  <text x="75" y="555" font-family="-apple-system, sans-serif" font-size="15" font-weight="bold" fill="#1C1C1E">Время проведения работ:</text>
  <text x="75" y="585" font-family="-apple-system, sans-serif" font-size="15" fill="#3A3A3C">ежедневно с 09:00 до 18:00</text>

  <!-- Contacts -->
  <line x1="55" y1="650" x2="545" y2="650" stroke="#E5E5EA" stroke-width="1.5"/>
  <text x="65" y="690" font-family="-apple-system, sans-serif" font-size="15" font-weight="bold" fill="#1C1C1E">МУП «Теплосеть» / УК «Смарт Сити»</text>
  <text x="65" y="720" font-family="-apple-system, sans-serif" font-size="14" fill="#8E8E93">Диспетчерская служба (круглосуточно):</text>
  <text x="65" y="750" font-family="-apple-system, sans-serif" font-size="18" font-weight="bold" fill="#0A84FF">+7 (495) 777-12-34</text>
  
  <!-- Stamp circle -->
  <circle cx="480" cy="725" r="42" fill="none" stroke="#0040DD" stroke-width="2.5" opacity="0.6"/>
  <text x="480" y="722" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#0040DD" opacity="0.75" text-anchor="middle">МУП ТЕПЛОСЕТЬ</text>
  <text x="480" y="736" font-family="-apple-system, sans-serif" font-size="8" fill="#0040DD" opacity="0.75" text-anchor="middle">ДЛЯ ДОКУМЕНТОВ</text>
</svg>
`)}`;

interface CameraScreenProps {
  onClose?: () => void;
  onCapture?: (imageData?: string) => void;
  onGallery?: () => void;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  onClose,
  onCapture,
}) => {
  const [flashMode, setFlashMode] = useState<'auto' | 'on' | 'off'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cycleFlash = () => {
    setFlashMode((prev) => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onCapture?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShutterClick = () => {
    onCapture?.(DEFAULT_ANNOUNCEMENT_IMAGE);
  };

  return (
    <div className={styles.screen}>
      {/* Hidden file input for native device gallery */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />

      {/* ── Viewfinder background ── */}
      <div className={styles.viewfinder}>
        <div className={styles.cameraScene}>
          <div className={styles.viewfinderLiveGrid} />
          <div className={styles.scannerCenterReticle} />
        </div>
      </div>

      {/* ── Top bar ───────────────────────────────────── */}
      <header className={styles.topBar}>
        <button
          className={styles.topBtn}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.topPill}>
          <span>ДОКУМЕНТ</span>
        </div>

        <button
          className={styles.topBtn}
          onClick={cycleFlash}
          aria-label={`Вспышка: ${flashMode}`}
        >
          <svg width="15" height="22" viewBox="0 0 14 22" fill="none">
            <path
              d="M8 1L1 12.5H6.5L5.5 21L13 9.5H7.5L8 1Z"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinejoin="round"
              fill={flashMode === 'on' ? '#FFFFFF' : 'none'}
            />
          </svg>
          {flashMode === 'auto' && (
            <span className={styles.flashLabel}>A</span>
          )}
          {flashMode === 'off' && (
            <span className={styles.flashSlash}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <line
                  x1="2"
                  y1="20"
                  x2="20"
                  y2="2"
                  stroke="#FFFFFF"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          )}
        </button>
      </header>

      {/* ── Scanner overlay ───────────────────────────── */}
      <div className={styles.scannerOverlay}>
        <div className={styles.scannerFrame}>
          {/* Four corner brackets with vibrant Apple accent */}
          <span className={`${styles.corner} ${styles.cornerTL}`} />
          <span className={`${styles.corner} ${styles.cornerTR}`} />
          <span className={`${styles.corner} ${styles.cornerBL}`} />
          <span className={`${styles.corner} ${styles.cornerBR}`} />
        </div>
        <p className={styles.hint}>Наведите камеру на бумажное объявление</p>
      </div>

      {/* ── Bottom bar ────────────────────────────────── */}
      <footer className={styles.bottomBar}>
        <div className={styles.bottomGradient} aria-hidden="true" />

        <div className={styles.bottomControls}>
          {/* Gallery button */}
          <button
            className={styles.galleryBtn}
            onClick={handleGalleryClick}
            aria-label="Загрузить из галереи"
            title="Загрузить из галереи"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect
                x="2"
                y="3"
                width="20"
                height="18"
                rx="4"
                stroke="#FFFFFF"
                strokeWidth="1.8"
              />
              <circle cx="8.5" cy="9.5" r="2" stroke="#FFFFFF" strokeWidth="1.8" />
              <path
                d="M2 17L7.5 12.5C8.33 11.83 9.67 11.83 10.5 12.5L16 17"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 15L15.88 13.12C16.71 12.29 18.04 12.29 18.88 13.12L22 16.25"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Shutter button */}
          <button
            className={styles.shutterBtn}
            onClick={handleShutterClick}
            aria-label="Сделать снимок"
          >
            <span className={styles.shutterInner} />
          </button>

          {/* Hidden placeholder for spacing to keep the shutter button centered */}
          <div style={{ width: 44, height: 44 }} />
        </div>
      </footer>

      {/* ── Home Indicator ────────────────────────────── */}
      <div className={styles.homeIndicator} aria-hidden="true" />
    </div>
  );
};
