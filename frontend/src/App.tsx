import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { AuthScreen } from '@/screens/AuthScreen';
import { AddressScreen } from '@/screens/AddressScreen';
import { AccountScreen } from '@/screens/AccountScreen';
import { MainFeedScreen } from '@/screens/MainFeedScreen';
import { CameraScreen } from '@/screens/CameraScreen';
import { RequestPreviewScreen } from '@/screens/RequestPreviewScreen';
import { UKDashboardScreen } from '@/screens/UKDashboardScreen';
import { UKBroadcastScreen } from '@/screens/UKBroadcastScreen';
import { UKObjectsScreen } from '@/screens/UKObjectsScreen';
import { UKProfileScreen } from '@/screens/UKProfileScreen';
import { UKAnalyticsScreen } from '@/screens/UKAnalyticsScreen';
import { UKNotificationsScreen } from '@/screens/UKNotificationsScreen';
import { UKArchiveScreen } from '@/screens/UKArchiveScreen';
import { UKModerationScreen } from '@/screens/UKModerationScreen';
import { BillsDashboardScreen } from '@/screens/BillsDashboardScreen';
import { BillAnalysisScreen } from '@/screens/BillAnalysisScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { MetersScreen } from '@/screens/MetersScreen';
import { TabBar } from '@/components/TabBar/TabBar';
import { UKTabBar } from '@/components/UKTabBar/UKTabBar';
import './App.css';

type ScreenType = 
  | 'auth' 
  | 'address' 
  | 'account' 
  | 'mainFeed' 
  | 'residentNotifications'
  | 'billsDashboard'
  | 'billAnalysis'
  | 'meters'
  | 'profile'
  | 'camera' 
  | 'requestPreview' 
  | 'ukDashboard' 
  | 'ukBroadcast'
  | 'ukObjects'
  | 'ukProfile'
  | 'ukModeration'
  | 'ukAnalytics'
  | 'ukNotifications'
  | 'ukArchive';

type Role = 'resident' | 'uk';

const residentScreens: ScreenType[] = [
  'auth', 'address', 'account', 'mainFeed', 'residentNotifications',
  'billsDashboard', 'billAnalysis', 'meters', 'profile', 
  'camera', 'requestPreview'
];

const screenOrder: ScreenType[] = [
  'auth',
  'address',
  'account',
  'mainFeed',
  'residentNotifications',
  'billsDashboard',
  'billAnalysis',
  'meters',
  'profile',
  'camera',
  'requestPreview',
  'ukDashboard',
  'ukBroadcast',
  'ukObjects',
  'ukProfile',
  'ukModeration',
  'ukAnalytics',
  'ukNotifications',
  'ukArchive',
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      const role = localStorage.getItem('role');
      return role === 'uk' ? 'ukDashboard' : 'mainFeed';
    }
    return 'auth';
  });
  const [lastResidentScreen, setLastResidentScreen] = useState<ScreenType>('mainFeed');
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>(undefined);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // 1. Инициализация MAX Bridge
    bridge.send('VKWebAppInit');

    // 2. Роутинг (Deep Linking из чат-бота)
    const urlParams = new URLSearchParams(window.location.search);
    const initialScreen = urlParams.get('screen') as ScreenType;
    if (initialScreen && screenOrder.includes(initialScreen)) {
      setCurrentScreen(initialScreen);
    }
    
    // Авто-авторизация из чат-бота (TamTam передает user_id или vk_id)
    const botUserId = urlParams.get('user_id') || urlParams.get('vk_id') || urlParams.get('chat_id');
    if (botUserId) {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://smarthouse-backend.onrender.com';
      fetch(apiUrl + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: botUserId })
      }).then(res => res.json()).then(data => {
        if (data && data.user_id) {
          localStorage.setItem('user_id', String(data.user_id));
          localStorage.setItem('role', data.role || 'resident');
        }
      }).catch(() => {});
    }

    // 3. Отслеживание клавиатуры и фокуса ввода
    const handleResize = () => {
      if (window.visualViewport) {
        setIsKeyboardOpen(window.innerHeight - window.visualViewport.height > 150 || window.innerHeight < 600);
      } else {
        setIsKeyboardOpen(window.innerHeight < 600);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardOpen(false);
      window.scrollTo(0, 0);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const currentRole: Role = residentScreens.includes(currentScreen) ? 'resident' : 'uk';

  const handleRoleChange = (newRole: Role) => {
    if (newRole === 'resident') {
      setCurrentScreen(lastResidentScreen);
    } else {
      setCurrentScreen('ukDashboard');
    }
  };

  const navigateTo = (screen: ScreenType) => {
    if (residentScreens.includes(screen)) {
      setLastResidentScreen(screen);
    }
    setCurrentScreen(screen);
  };

  const getScreenClass = (screen: ScreenType) => {
    const currentIndex = screenOrder.indexOf(currentScreen);
    const screenIndex = screenOrder.indexOf(screen);
    if (screenIndex === currentIndex) return 'active';
    if (screenIndex < currentIndex) return 'slide-left';
    return 'slide-right';
  };

  return (
    <div className="appRoot">
      {/* Демо-ползунок переключения ролей — только для тестового аккаунта вне экрана авторизации */}
      {localStorage.getItem('account_number') === '61-0001-0015' && currentScreen !== 'auth' && (
        <header className="demoHeader">
          <div className="roleSegmentedControl">
            <button
              className={`roleSegment ${currentRole === 'resident' ? 'active' : ''}`}
              onClick={() => handleRoleChange('resident')}
            >
              👤 Житель
            </button>
            <button
              className={`roleSegment ${currentRole === 'uk' ? 'active' : ''}`}
              onClick={() => handleRoleChange('uk')}
            >
              🏢 УК Модератор
            </button>
          </div>
        </header>
      )}

      <div className="appContainer">
        {/* Экран 1.1: Авторизация */}
        <div className={`screenWrapper ${getScreenClass('auth')}`}>
          <AuthScreen onNext={() => navigateTo('mainFeed')} />
        </div>

        {/* Экран 1.2: Адрес */}
        <div className={`screenWrapper ${getScreenClass('address')}`}>
          <AddressScreen 
            onBack={() => navigateTo('auth')} 
            onConfirm={() => navigateTo('account')} 
          />
        </div>

        {/* Экран 1.3: Лицевой счёт */}
        <div className={`screenWrapper ${getScreenClass('account')}`}>
          <AccountScreen 
            onBack={() => navigateTo('address')} 
            onNext={() => navigateTo('mainFeed')} 
            onSkip={() => navigateTo('mainFeed')} 
          />
        </div>

        {/* Экран 2.1: Главная лента жителя */}
        <div className={`screenWrapper ${getScreenClass('mainFeed')}`}>
          <MainFeedScreen 
            onBack={() => navigateTo('account')} 
            onOpenCamera={() => navigateTo('camera')} 
            onOpenNotifications={() => navigateTo('residentNotifications')}
          />
        </div>

        {/* Экран Уведомлений Жителя */}
        <div className={`screenWrapper ${getScreenClass('residentNotifications')}`}>
          <UKNotificationsScreen onBack={() => navigateTo('mainFeed')} isResidentMode={true} />
        </div>

        {/* Экран 4.1: Счета ЖКХ */}
        <div className={`screenWrapper ${getScreenClass('billsDashboard')}`}>
          <BillsDashboardScreen 
            onDetailedAnalysis={() => navigateTo('billAnalysis')} 
            onNavigate={navigateTo}
          />
        </div>

        {/* Экран 4.2: ИИ Анализ квитанции */}
        <div className={`screenWrapper ${getScreenClass('billAnalysis')}`} style={{ overflow: 'hidden' }}>
          <BillAnalysisScreen onBack={() => navigateTo('billsDashboard')} />
        </div>
        
        {/* Экран Счетчики */}
        <div className={`screenWrapper ${getScreenClass('meters')}`}>
          <MetersScreen onBack={() => navigateTo('billsDashboard')} />
        </div>

        {/* Профиль */}
        <div className={`screenWrapper ${getScreenClass('profile')}`}>
          <ProfileScreen onLogout={() => navigateTo('auth')} />
        </div>

        {/* Экран 2.2: Камера */}
        <div className={`screenWrapper ${getScreenClass('camera')}`}>
          {currentScreen === 'camera' && (
            <CameraScreen 
              onClose={() => navigateTo('mainFeed')} 
              onCapture={(img) => {
                setCapturedPhoto(img);
                navigateTo('requestPreview');
              }} 
            />
          )}
        </div>

        {/* Экран 2.3 + 2.4: Распознавание и превью заявки */}
        <div className={`screenWrapper ${getScreenClass('requestPreview')}`}>
          {currentScreen === 'requestPreview' && (
            <RequestPreviewScreen 
              onBack={() => navigateTo('camera')} 
              onSubmit={() => navigateTo('mainFeed')} 
              capturedImage={capturedPhoto}
            />
          )}
        </div>

        {/* Экран 3.1: Главная панель УК */}
        <div className={`screenWrapper ${getScreenClass('ukDashboard')}`}>
          <UKDashboardScreen onOpenRequest={(id?: number) => { if (id) localStorage.setItem('selectedRequestId', String(id)); navigateTo('ukModeration'); }} onNavigate={navigateTo} />
        </div>

        {/* Экран 3.3: Рассылка УК */}
        <div className={`screenWrapper ${getScreenClass('ukBroadcast')}`}>
          <UKBroadcastScreen />
        </div>

        {/* Экран 3.4: Объекты УК (Карта) */}
        <div className={`screenWrapper ${getScreenClass('ukObjects')}`}>
          <UKObjectsScreen />
        </div>

        {/* Экран 3.5: Профиль УК */}
        <div className={`screenWrapper ${getScreenClass('ukProfile')}`}>
          <UKProfileScreen onNavigate={navigateTo} onLogout={() => navigateTo('auth')} />
        </div>

        {/* Экран Аналитики УК */}
        <div className={`screenWrapper ${getScreenClass('ukAnalytics')}`}>
          <UKAnalyticsScreen onBack={() => navigateTo('ukProfile')} />
        </div>

        {/* Экран Уведомлений УК */}
        <div className={`screenWrapper ${getScreenClass('ukNotifications')}`}>
          <UKNotificationsScreen onBack={() => navigateTo('ukDashboard')} />
        </div>

        {/* Экран Архива рассылок УК */}
        <div className={`screenWrapper ${getScreenClass('ukArchive')}`}>
          <UKArchiveScreen onBack={() => navigateTo('ukProfile')} />
        </div>

        {/* Экран 3.2: Проверка и публикация УК */}
        <div className={`screenWrapper ${getScreenClass('ukModeration')}`}>
          {currentScreen === 'ukModeration' && (
            <UKModerationScreen 
              onBack={() => navigateTo('ukDashboard')} 
              onConfirm={() => navigateTo('ukDashboard')} 
              onReject={() => navigateTo('ukDashboard')} 
            />
          )}
        </div>
      </div>

      {/* Глобальный TabBar для жителя */}
      {['mainFeed', 'billsDashboard', 'meters', 'profile'].includes(currentScreen) && !isKeyboardOpen && (
        <TabBar 
          currentTab={currentScreen === 'profile' ? 'account' : currentScreen === 'mainFeed' ? 'mainFeed' : 'billsDashboard'} 
          onChangeTab={(tab) => {
            if (tab === 'mainFeed') navigateTo('mainFeed');
            if (tab === 'billsDashboard') navigateTo('billsDashboard');
            if (tab === 'account') navigateTo('profile');
          }} 
        />
      )}

      {/* Глобальный TabBar для УК */}
      {['ukDashboard', 'ukBroadcast', 'ukObjects', 'ukProfile'].includes(currentScreen) && !isKeyboardOpen && (
        <UKTabBar 
          activeTab={
            currentScreen === 'ukDashboard' ? 'requests' : 
            currentScreen === 'ukBroadcast' ? 'broadcast' : 
            currentScreen === 'ukObjects' ? 'objects' : 'profile'
          } 
          onTabChange={(tab) => {
            if (tab === 'requests') navigateTo('ukDashboard');
            if (tab === 'broadcast') navigateTo('ukBroadcast');
            if (tab === 'objects') navigateTo('ukObjects');
            if (tab === 'profile') navigateTo('ukProfile');
          }} 
        />
      )}
    </div>
  );
};

export default App;
