import React, { useState, useMemo, TouchEvent } from 'react';
import styles from './UKObjectsScreen.module.css';

type HouseStatus = 'critical' | 'repair' | 'ok';
type ProblemCategory = 'water' | 'electricity' | 'heating' | 'info';

interface Problem {
  id: string;
  type: HouseStatus | 'info';
  category: ProblemCategory;
  title: string;
  desc: string;
}

interface House {
  id: string;
  address: string;
  top: string;
  left: string;
  status: HouseStatus;
  problems: Problem[];
}

const MOCK_HOUSES: House[] = [
  { 
    id: '1', 
    address: 'ул. Космонавтов 34а', 
    top: '35%', left: '45%', 
    status: 'critical', 
    problems: [
      { id: 'p1', type: 'critical', category: 'water', title: 'Авария ГВС', desc: 'Прорыв трубы (3 заявки от жителей)' }
    ] 
  },
  { 
    id: '2', 
    address: 'ул. Садовая 15', 
    top: '55%', left: '65%', 
    status: 'repair', 
    problems: [
      { id: 'p2', type: 'repair', category: 'electricity', title: 'Плановый ремонт', desc: 'Отключено электричество (до 15:00)' },
      { id: 'p3', type: 'info', category: 'info', title: 'Рассылка', desc: 'Уведомление о завтрашнем отключении воды доставлено' }
    ] 
  },
  { 
    id: '3', 
    address: 'ул. Ленина 10', 
    top: '25%', left: '20%', 
    status: 'ok', 
    problems: [] 
  },
  { 
    id: '4', 
    address: 'ЖК Изумрудный', 
    top: '70%', left: '30%', 
    status: 'ok', 
    problems: [] 
  }
];

export const UKObjectsScreen: React.FC = () => {
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'repair' | 'ok'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'water' | 'electricity'>('all');

  // Swipe handling
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const filteredHouses = useMemo(() => {
    return MOCK_HOUSES.filter(h => {
      const matchSearch = h.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'all' || h.status === filterStatus;
      
      let matchCategory = filterCategory === 'all';
      if (!matchCategory && filterCategory !== 'all') {
        // If filtering by category, check if any problem matches
        matchCategory = h.problems.some(p => p.category === filterCategory);
        // Also if a house is 'ok', it has no problems, so it won't show in specific category filters
      }

      return matchSearch && matchStatus && matchCategory;
    });
  }, [searchQuery, filterStatus, filterCategory]);

  const selectedHouse = MOCK_HOUSES.find(h => h.id === selectedHouseId) || null;

  const handleMapClick = () => {
    if (selectedHouseId) setSelectedHouseId(null);
    if (isFilterOpen) setIsFilterOpen(false);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    // If swiped down more than 50px, close
    if (diff > 50) {
      setSelectedHouseId(null);
      setTouchStartY(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  const getPinIcon = (status: HouseStatus) => {
    switch (status) {
      case 'critical': return (
        <svg className={styles.pinIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      );
      case 'repair': return (
        <svg className={styles.pinIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
      case 'ok': return (
        <svg className={styles.pinIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    }
  };

  const getProblemIcon = (type: HouseStatus | 'info') => {
    if (type === 'critical') return getPinIcon('critical');
    if (type === 'repair') return getPinIcon('repair');
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    );
  };

  return (
    <div className={styles.container}>
      {/* Background click catcher */}
      <div className={styles.mapBase} onClick={handleMapClick} />

      {/* Floating Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Найти адрес: ул. Космонавтов..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterBtnWrapper}>
          <button className={styles.filterBtn} onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
          
          <div className={`${styles.filterDropdown} ${isFilterOpen ? styles.open : ''}`}>
            
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupTitle}>Статус</div>
              <button className={`${styles.filterOption} ${filterStatus === 'all' ? styles.active : ''}`} onClick={() => setFilterStatus('all')}>
                Любой статус {filterStatus === 'all' && <span>✓</span>}
              </button>
              <button className={`${styles.filterOption} ${filterStatus === 'critical' ? styles.active : ''}`} onClick={() => setFilterStatus('critical')}>
                Аварии {filterStatus === 'critical' && <span>✓</span>}
              </button>
              <button className={`${styles.filterOption} ${filterStatus === 'repair' ? styles.active : ''}`} onClick={() => setFilterStatus('repair')}>
                В ремонте {filterStatus === 'repair' && <span>✓</span>}
              </button>
              <button className={`${styles.filterOption} ${filterStatus === 'ok' ? styles.active : ''}`} onClick={() => setFilterStatus('ok')}>
                Штатно {filterStatus === 'ok' && <span>✓</span>}
              </button>
            </div>

            <div className={styles.filterGroup}>
              <div className={styles.filterGroupTitle}>Категория</div>
              <button className={`${styles.filterOption} ${filterCategory === 'all' ? styles.active : ''}`} onClick={() => setFilterCategory('all')}>
                Все категории {filterCategory === 'all' && <span>✓</span>}
              </button>
              <button className={`${styles.filterOption} ${filterCategory === 'water' ? styles.active : ''}`} onClick={() => setFilterCategory('water')}>
                Водоснабжение {filterCategory === 'water' && <span>✓</span>}
              </button>
              <button className={`${styles.filterOption} ${filterCategory === 'electricity' ? styles.active : ''}`} onClick={() => setFilterCategory('electricity')}>
                Электричество {filterCategory === 'electricity' && <span>✓</span>}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Map Pins */}
      {filteredHouses.map(house => (
        <div 
          key={house.id}
          className={`${styles.pin} ${styles[house.status]} ${selectedHouseId === house.id ? styles.selected : ''}`} 
          style={{ top: house.top, left: house.left }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedHouseId(house.id);
            setIsFilterOpen(false);
          }}
        >
          {getPinIcon(house.status)}
        </div>
      ))}

      {/* Bottom Sheet */}
      <div 
        className={`${styles.bottomSheet} ${selectedHouse ? styles.show : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.grabberWrap} onClick={() => setSelectedHouseId(null)}>
          <div className={styles.grabber} />
        </div>
        
        {selectedHouse && (
          <>
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>{selectedHouse.address}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedHouseId(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            {selectedHouse.problems.length > 0 ? (
              <div className={styles.cardList}>
                {selectedHouse.problems.map(prob => (
                  <div key={prob.id} className={styles.problemCard}>
                    <div className={`${styles.cardIconWrap} ${styles[prob.type]}`}>
                      {getProblemIcon(prob.type)}
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardTitle}>{prob.title}</div>
                      <div className={styles.cardDesc}>{prob.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div className={styles.emptyTitle}>Всё в порядке</div>
                <div className={styles.emptyDesc}>На объекте штатная ситуация. Проблем и активных рассылок нет.</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
