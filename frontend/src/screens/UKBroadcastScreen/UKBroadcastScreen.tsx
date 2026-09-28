import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './UKBroadcastScreen.module.css';

interface Address {
  id: number;
  full_address: string;
}

const categoryOptions = [
  { id: 'water', label: 'Вода (горячая / холодная)' },
  { id: 'electricity', label: 'Свет (электричество)' },
  { id: 'info', label: 'Информация / Собрания' },
  { id: 'other', label: 'Прочее' },
];

export const UKBroadcastScreen: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddrs, setLoadingAddrs] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [category, setCategory] = useState(categoryOptions[0].id);
  const [message, setMessage] = useState('');
  
  const [improving, setImproving] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [errorAddress, setErrorAddress] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);
  
  const addressRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/api/addresses')
      .then(r => r.json())
      .then(data => {
        setAddresses(data || []);
        setLoadingAddrs(false);
      })
      .catch(e => {
        console.error(e);
        setLoadingAddrs(false);
      });
  }, []);

  const filteredAddresses = useMemo(() => {
    return addresses.filter(addr => addr.full_address.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, addresses]);

  const allFilteredSelected = filteredAddresses.length > 0 && filteredAddresses.every(addr => selectedIds.has(addr.id));

  const handleToggleSelectAll = () => {
    const newSet = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredAddresses.forEach(addr => newSet.delete(addr.id));
    } else {
      filteredAddresses.forEach(addr => newSet.add(addr.id));
    }
    setSelectedIds(newSet);
    if (newSet.size > 0) setErrorAddress(false);
  };

  const handleToggleAddress = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    if (newSet.size > 0) setErrorAddress(false);
  };

  const handleImproveWithAI = async () => {
    if (!message) return;
    setImproving(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/ai/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      const data = await res.json();
      if (data.improved_text) {
        setMessage(data.improved_text);
        setErrorMessage(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImproving(false);
    }
  };

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSend = async () => {
    let hasError = false;
    if (selectedIds.size === 0) {
      setErrorAddress(true);
      addressRef.current?.scrollIntoView({ behavior: 'smooth' });
      hasError = true;
    }
    if (!message.trim()) {
      setErrorMessage(true);
      if (!hasError) messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasError = true;
    }

    if (hasError) return;

    setSending(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/uk/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedIds: Array.from(selectedIds),
          category: category,
          text: message
        })
      });
      if (res.ok) {
        notify('Рассылка успешно отправлена!');
        setMessage('');
        setSelectedIds(new Set());
      } else {
        notify('Ошибка отправки');
      }
    } catch (e) {
      notify('Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Создать рассылку</h1>
        <p className={styles.subtitle}>Информирование жильцов</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section} ref={addressRef}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>1. Получатели</h2>
            <span className={styles.selectedCount}>Выбрано: {selectedIds.size}</span>
          </div>

          <div className={`${styles.addressBox} ${errorAddress ? styles.errorBorder : ''}`}>
            <div className={styles.searchBar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Поиск по адресу..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.addressListWrap}>
              <div className={styles.selectAllRow}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={allFilteredSelected}
                    onChange={handleToggleSelectAll}
                  />
                  <div className={styles.checkboxCustom} />
                  <span>Выбрать все из списка</span>
                </label>
              </div>
              <div className={styles.addressList}>
                {loadingAddrs && <div style={{padding: 10, color: '#aaa'}}>Загрузка...</div>}
                {filteredAddresses.map(addr => (
                  <label key={addr.id} className={styles.addressItem}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(addr.id)}
                      onChange={() => handleToggleAddress(addr.id)}
                    />
                    <div className={styles.checkboxCustom} />
                    <div className={styles.addressInfo}>
                      <span className={styles.addrName}>{addr.full_address}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          {errorAddress && <p className={styles.errorText}>Выберите хотя бы один адрес</p>}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>2. Категория</h2>
          </div>
          <div className={styles.categoryGrid}>
            {categoryOptions.map(cat => (
              <button 
                key={cat.id}
                className={`${styles.categoryChip} ${category === cat.id ? styles.categoryChipActive : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section} ref={messageRef}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>3. Текст сообщения</h2>
            <button className={styles.aiButton} onClick={handleImproveWithAI} disabled={improving || !message}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              {improving ? 'Улучшаем...' : 'Улучшить ИИ'}
            </button>
          </div>
          
          <div className={styles.textareaWrapper}>
            <textarea
              className={`${styles.textarea} ${errorMessage ? styles.errorBorder : ''}`}
              placeholder="Введите текст рассылки..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) setErrorMessage(false);
              }}
              rows={6}
            />
          </div>
          {errorMessage && <p className={styles.errorText}>Текст не может быть пустым</p>}
        </section>

        <button 
          className={styles.sendButton} 
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? 'Отправка...' : 'Отправить рассылку'}
        </button>
        <div style={{height: 100}} />
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