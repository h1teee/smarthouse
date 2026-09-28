import React, { useState, useEffect } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import styles from './UKObjectsScreen.module.css';

type HouseStatus = 'ok' | 'repair' | 'critical';

interface MapObject {
  address_id: number;
  full_address: string;
  lat: number;
  lng: number;
  status: HouseStatus;
}

interface RequestItem {
  id: number;
  address_id: number;
  type: string;
  title: string;
  description: string;
  status: string;
}

export const UKObjectsScreen: React.FC = () => {
  const [houses, setHouses] = useState<MapObject[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<HouseStatus | 'all'>('all');
  
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [objRes, reqRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + '/api/uk/objects'),
          fetch(import.meta.env.VITE_API_URL + '/api/uk/requests?status=all')
        ]);
        const objData = await objRes.json();
        const reqData = await reqRes.json();
        if (Array.isArray(objData)) setHouses(objData);
        if (Array.isArray(reqData)) setRequests(reqData);
      } catch (err) {
        console.error('Failed to load map data', err);
      }
    };
    fetchData();
  }, []);

  const filteredHouses = houses.filter(h => {
    const matchesSearch = h.full_address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || h.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const selectedHouse = houses.find(h => h.address_id === selectedHouseId);
  const selectedHouseRequests = requests.filter(r => r.address_id === selectedHouseId && r.status !== 'resolved');

  const getStatusColor = (s: HouseStatus) => {
    if (s === 'ok') return '#30D158';
    if (s === 'repair') return '#FF9F0A';
    if (s === 'critical') return '#FF453A';
    return '#8E8E93';
  };

  const getStatusLabel = (s: HouseStatus) => {
    if (s === 'ok') return 'Всё в порядке';
    if (s === 'repair') return 'Ремонт / Планово';
    if (s === 'critical') return 'Критическая авария';
    return 'Неизвестно';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Объекты УК</h1>
        <p className={styles.subtitle}>Карта домов и статус сетей</p>
      </header>

      <div className={styles.mapWrap}>
        <div className={styles.searchPanel}>
          <div className={styles.searchBar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Поиск адреса..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className={styles.filterBtn} onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
          </div>
          {isFilterOpen && (
            <div className={styles.filterMenu}>
              <button 
                className={`${styles.filterItem} ${filterStatus === 'all' ? styles.filterItemActive : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Все
              </button>
              <button 
                className={`${styles.filterItem} ${filterStatus === 'critical' ? styles.filterItemActive : ''}`}
                onClick={() => setFilterStatus('critical')}
              >
                Аварии
              </button>
              <button 
                className={`${styles.filterItem} ${filterStatus === 'repair' ? styles.filterItemActive : ''}`}
                onClick={() => setFilterStatus('repair')}
              >
                В работе
              </button>
              <button 
                className={`${styles.filterItem} ${filterStatus === 'ok' ? styles.filterItemActive : ''}`}
                onClick={() => setFilterStatus('ok')}
              >
                В норме
              </button>
            </div>
          )}
        </div>

        <YMaps query={{ apikey: 'd66d03f0-fc89-40ea-9ef9-ccba4585c2c7' }}>
          <Map 
            defaultState={{ center: [47.222078, 39.720358], zoom: 12 }} 
            style={{ width: '100%', height: '100%' }}
            options={{ suppressMapOpenBlock: true }}
          >
            {filteredHouses.map(h => (
              <Placemark 
                key={h.address_id}
                geometry={[h.lat, h.lng]}
                options={{
                  preset: h.status === 'ok' ? 'islands#greenCircleDotIcon' : h.status === 'critical' ? 'islands#redCircleDotIcon' : 'islands#yellowCircleDotIcon',
                  iconColor: getStatusColor(h.status)
                }}
                onClick={() => setSelectedHouseId(h.address_id)}
              />
            ))}
          </Map>
        </YMaps>

        {selectedHouse && (
          <div className={styles.bottomSheet}>
            <div className={styles.grabber} />
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>{selectedHouse.full_address}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedHouseId(null)}>✕</button>
            </div>
            
            <div className={styles.sheetStatusWrap}>
              <div className={styles.sheetStatusDot} style={{ background: getStatusColor(selectedHouse.status) }} />
              <span>{getStatusLabel(selectedHouse.status)}</span>
            </div>

            <div className={styles.sheetActiveRequests}>
              <h3 className={styles.reqTitle}>Актуальные заявки</h3>
              {selectedHouseRequests.length === 0 ? (
                <p className={styles.noReqText}>Нет активных заявок или аварий.</p>
              ) : (
                <div className={styles.reqList}>
                  {selectedHouseRequests.map(req => (
                    <div key={req.id} className={styles.reqCard}>
                      <div className={styles.reqCardType}>{req.type === 'water' ? 'Вода' : req.type === 'electricity' ? 'Электричество' : 'Прочее'}</div>
                      <div className={styles.reqCardTitle}>{req.title}</div>
                      <div className={styles.reqCardStatus}>{req.status === 'pending' ? 'Ожидает решения' : 'Одобрено (В работе)'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{height: 90}} />
    </div>
  );
};