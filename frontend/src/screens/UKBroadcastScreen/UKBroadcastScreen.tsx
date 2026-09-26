import React, { useState, useMemo, useRef } from 'react';
import styles from './UKBroadcastScreen.module.css';

const MOCK_ADDRESSES = [
  { id: '1', name: 'ул. Космонавтов 34а', district: 'Центральный' },
  { id: '2', name: 'ул. Космонавтов 34б', district: 'Центральный' },
  { id: '3', name: 'ул. Садовая 15', district: 'Северный' },
  { id: '4', name: 'ул. Садовая 17', district: 'Северный' },
  { id: '5', name: 'ЖК "Изумрудный"', district: 'Южный' },
  { id: '6', name: 'ЖК "Акварель"', district: 'Южный' },
  { id: '7', name: 'ул. Ленина 10', district: 'Центральный' },
];

const FILTER_TABS = [
  { id: 'all', label: 'Все' },
  { id: 'Центральный', label: 'Центральный р-н' },
  { id: 'Северный', label: 'Северный р-н' },
  { id: 'Южный', label: 'Южный р-н' },
];

const categoryOptions = [
  { id: 'water', label: 'Вода (Отключение / Авария)' },
  { id: 'electro', label: 'Свет (Электричество)' },
  { id: 'elevator', label: 'Лифт (Ремонт)' },
  { id: 'other', label: 'Другое' },
];

export const UKBroadcastScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState(categoryOptions[0].id);
  const [message, setMessage] = useState('');

  const [errorAddress, setErrorAddress] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);
  
  const addressRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const filteredAddresses = useMemo(() => {
    return MOCK_ADDRESSES.filter(addr => {
      const matchesSearch = addr.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            addr.district.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || addr.district === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  const allFilteredSelected = filteredAddresses.length > 0 && filteredAddresses.every(addr => selectedIds.has(addr.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredAddresses.forEach(addr => next.delete(addr.id));
    } else {
      filteredAddresses.forEach(addr => next.add(addr.id));
    }
    setSelectedIds(next);
    if (next.size > 0) setErrorAddress(false);
  };

  const toggleAddress = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    if (next.size > 0) setErrorAddress(false);
  };

  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async () => {
    let hasError = false;
    if (!someSelected) {
      setErrorAddress(true);
      hasError = true;
      addressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setErrorAddress(false);
    }

    if (!message.trim()) {
      setErrorMessage(true);
      if (!hasError) {
        hasError = true;
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setErrorMessage(false);
    }

    if (hasError) return;

    setIsSending(true);
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (message.toLowerCase().includes('error') || message.toLowerCase().includes('ошибка')) {
            reject(new Error('Simulated error'));
          } else {
            resolve(true);
          }
        }, 2000);
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setMessage("");
        setSelectedIds(new Set());
      }, 2500);
    } catch (e) {
      console.error(e);
      setIsError(true);
      setTimeout(() => {
        setIsError(false);
      }, 2500);
    } finally {
      setIsSending(false);
    }
  };

  const handleImproveText = () => {
    if (!message) {
      setMessage('Уважаемые жители! Уведомляем вас о временном отключении водоснабжения в связи с проведением плановых технических работ. Приносим извинения за неудобства.');
      setErrorMessage(false);
    }
  };

  if (isSending && !isSuccess) {
    return (
      <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.ambientGlow} aria-hidden="true" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          <div className={styles.spinner} style={{ width: 48, height: 48, border: '3px solid rgba(191,90,242,0.3)', borderTopColor: '#BF5AF2', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 24, fontSize: 18, fontWeight: 600, color: '#FFF' }}>Отправка рассылки...</div>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.ambientGlow} aria-hidden="true" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(48, 209, 88, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#30D158' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#FFF', textAlign: 'center' }}>Рассылка успешно отправлена</h2>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.ambientGlow} aria-hidden="true" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(255, 69, 58, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: '#FF453A' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#FFF', textAlign: 'center' }}>Ошибка при отправке</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <header className={`${styles.header} ${styles.animateStagger1}`}>
          <h1 className={styles.title}>Рассылка</h1>
        </header>

        <section className={styles.animateStagger2} ref={addressRef}>
          <h2 className={styles.sectionTitle}>Адресаты</h2>
          <div className={styles.targetBlock} style={{ border: errorAddress ? '1px solid #FF453A' : undefined }}>
            
            <div className={styles.searchWrapper}>
              <div className={styles.searchIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input 
                type="text" 
                className={styles.searchInput} 
                placeholder="Поиск по улице или району..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.filterScroll}>
              {FILTER_TABS.map(tab => (
                <button 
                  key={tab.id}
                  className={`${styles.filterChip} ${activeFilter === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.checkboxRow} onClick={toggleAll} style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className={`${styles.checkboxIcon} ${allFilteredSelected ? styles.checked : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className={styles.checkboxLabel} style={{ fontWeight: 600 }}>
                {allFilteredSelected ? 'Снять выделение со всех' : 'Выбрать все отфильтрованные'}
              </span>
            </div>

            <div className={styles.addressList}>
              {filteredAddresses.length > 0 ? (
                filteredAddresses.map(addr => (
                  <div key={addr.id} className={styles.checkboxRow} onClick={() => toggleAddress(addr.id)}>
                    <div className={`${styles.checkboxIcon} ${selectedIds.has(addr.id) ? styles.checked : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={`${styles.checkboxLabel} ${selectedIds.has(addr.id) ? '' : styles.dimmed}`}>
                        {addr.name}
                      </span>
                      <span style={{ fontSize: '12px', color: 'rgba(235,235,245,0.4)', marginTop: '2px' }}>
                        {addr.district} район
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <span style={{ color: 'rgba(235,235,245,0.4)', fontSize: '15px', textAlign: 'center', padding: '16px 0' }}>
                  Ничего не найдено
                </span>
              )}
            </div>

          </div>
          {errorAddress && <div style={{ color: '#FF453A', fontSize: 13, marginTop: 4, paddingLeft: 16 }}>Не указаны адресаты</div>}
        </section>

        <section className={styles.animateStagger3} ref={messageRef}>
          <h2 className={styles.sectionTitle}>Сообщение</h2>
          <div className={styles.messageBuilder} style={{ border: errorMessage ? '1px solid #FF453A' : undefined }}>
            <div className={styles.selectWrapper}>
              <select 
                className={styles.select} 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryOptions.map(cat => (
                  <option key={cat.id} value={cat.id} style={{ color: '#000' }}>{cat.label}</option>
                ))}
              </select>
              <div className={styles.selectIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <textarea 
              className={styles.textarea}
              placeholder="Введите суть сообщения (например: отключаем воду завтра в 10:00 из-за прорыва)"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) setErrorMessage(false);
              }}
            />

            <button className={styles.aiButton} onClick={handleImproveText}>
              <svg className={styles.aiIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className={styles.aiText}>Улучшить текст с ИИ</span>
            </button>
          </div>
          {errorMessage && <div style={{ color: '#FF453A', fontSize: 13, marginTop: 4, paddingLeft: 16 }}>Не указан комментарий</div>}
        </section>

        <div className={styles.animateStagger4}>
          <button className={styles.submitButton} onClick={handleSubmit} disabled={isSending}>
            {isSending ? "Отправка..." : `Запустить рассылку ${someSelected ? '(' + selectedIds.size + ')' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};
