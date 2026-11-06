import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabs } from './src/components/BottomTabs';
import { Toast } from './src/components/Toast';
import { listCargos, type CargoListParams } from './src/api';
import { mapCargo } from './src/cargo-map';
import { AuthProvider, useAuth } from './src/auth';
import { CurrencyProvider } from './src/currency';
import { I18nProvider, useI18n } from './src/i18n/index';
import { ChatsScreen } from './src/screens/ChatsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { CreateScreen } from './src/screens/CreateScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { OnboardingScreen } from './src/screens/Onboarding';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RoutesScreen } from './src/screens/RoutesScreen';
import { PAGE_WIDTH, colors } from './src/theme';
import type { Cargo, FeedView, Filters, MainTab, StackScreen } from './src/types';

const FEED_LIMIT = 20;
const FEED_NEAR = { lat: 41.3111, lng: 69.2797 };
const REGION_CITY: Record<string, string> = {
  Tashkent: 'Toshkent',
  Samarkand: 'Samarqand',
  Bukhara: 'Buxoro',
  Fergana: "Farg'ona",
};

function feedParams(query: string, filters: Filters, page: number): CargoListParams {
  return {
    page,
    limit: FEED_LIMIT,
    sort: 'distance',
    nearLat: FEED_NEAR.lat,
    nearLng: FEED_NEAR.lng,
    radiusKm: 500,
    ...(query.trim() ? { q: query.trim() } : {}),
    ...(filters.truck !== 'any'
      ? { vehicleType: filters.truck as CargoListParams['vehicleType'] }
      : {}),
    ...(filters.region !== 'any' ? { from: REGION_CITY[filters.region] ?? filters.region } : {}),
  };
}

function AppShell() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, PAGE_WIDTH);
  const { t } = useI18n();
  const { session } = useAuth();

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasNext, setFeedHasNext] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [feedReload, setFeedReload] = useState(0);
  const feedToken = useRef(0);
  const [tab, setTab] = useState<MainTab>('feed');
  const [stack, setStack] = useState<StackScreen[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({ weight: 'any', truck: 'any', region: 'any' });
  const [view, setView] = useState<FeedView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publishedRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        const requestId = ++feedToken.current;
        setFeedLoading(true);
        setFeedError(false);
        listCargos(feedParams(query, filters, 1))
          .then((result) => {
            if (requestId !== feedToken.current) return;
            setCargos(result.items.map(mapCargo));
            setFeedPage(1);
            setFeedHasNext(result.hasNext);
          })
          .catch(() => {
            if (requestId !== feedToken.current) return;
            setCargos([]);
            setFeedHasNext(false);
            setFeedError(true);
          })
          .finally(() => {
            if (requestId === feedToken.current) setFeedLoading(false);
          });
      },
      query.trim() ? 350 : 0,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters.weight, filters.truck, filters.region, session?.accessToken, feedReload]);

  const loadMoreFeed = () => {
    if (feedLoading || feedLoadingMore || !feedHasNext || feedError) return;
    const nextPage = feedPage + 1;
    const requestId = feedToken.current;
    setFeedLoadingMore(true);
    listCargos(feedParams(query, filters, nextPage))
      .then((result) => {
        if (requestId !== feedToken.current) return;
        setCargos((prev) => {
          const known = new Set(prev.map((item) => item.id));
          return [...prev, ...result.items.map(mapCargo).filter((item) => !known.has(item.id))];
        });
        setFeedPage(nextPage);
        setFeedHasNext(result.hasNext);
      })
      .catch(() => setFeedHasNext(false))
      .finally(() => {
        if (requestId === feedToken.current) setFeedLoadingMore(false);
      });
  };

  const retryFeed = () => setFeedReload((value) => value + 1);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const openCargo = (id: string) => {
    setSelectedId(id);
    setStack((prev) => [...prev, { name: 'details', cargoId: id }]);
  };

  const openChat = (cargoId: string, chatId?: string, title?: string) => {
    setStack((prev) => [...prev, { name: 'chat', cargoId, chatId, title }]);
  };

  const openCreate = () => {
    setStack((prev) => [...prev, { name: 'create' }]);
  };

  const pop = () => setStack((prev) => prev.slice(0, -1));

  const changeTab = (next: MainTab) => {
    setTab(next);
    setStack([]);
  };

  const handlePublish = (cargo: Cargo) => {
    publishedRef.current = cargo.id;
    setCargos((prev) => [cargo, ...prev]);
    setSelectedId(cargo.id);
    setQuery('');
    setFilters({ weight: 'any', truck: 'any', region: 'any' });
  };

  const exitCreate = () => {
    const published = publishedRef.current;
    publishedRef.current = null;
    setStack([]);
    if (published) {
      setTab('feed');
      showToast(t('app.published', { id: published }));
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) {
        setStack((prev) => prev.slice(0, -1));
        return true;
      }
      if (tab !== 'feed') {
        setTab('feed');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab]);

  const overlay = stack[stack.length - 1];
  const overlayCargo =
    overlay && overlay.name !== 'create' ? cargos.find((c) => c.id === overlay.cargoId) : undefined;

  const renderMain = () => {
    switch (tab) {
      case 'routes':
        return <RoutesScreen onOpenCargo={openCargo} showToast={showToast} />;
      case 'chats':
        return (
          <ChatsScreen
            onOpenChat={(chat) => openChat(chat.cargo.id, chat.id, chat.cargo.title)}
          />
        );
      case 'profile':
        return <ProfileScreen showToast={showToast} />;
      default:
        return (
          <FeedScreen
            cargos={cargos}
            query={query}
            setQuery={setQuery}
            filters={filters}
            setFilters={setFilters}
            view={view}
            setView={setView}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            onOpenCargo={openCargo}
            onPost={openCreate}
            showToast={showToast}
            loading={feedLoading}
            loadingMore={feedLoadingMore}
            error={feedError}
            hasNext={feedHasNext}
            onLoadMore={loadMoreFeed}
            onRetry={retryFeed}
          />
        );
    }
  };

  return (
    <View style={styles.stage}>
      <View style={[styles.device, { width: pageWidth }]}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
          {overlay ? (
            overlay.name === 'details' && overlayCargo ? (
              <DetailsScreen
                cargo={overlayCargo}
                onBack={pop}
                onContact={() => openChat(overlayCargo.id)}
                showToast={showToast}
              />
            ) : overlay.name === 'chat' ? (
              <ChatScreen
                cargoId={overlay.cargoId}
                chatId={overlay.chatId}
                title={overlay.title}
                cargo={overlayCargo}
                onBack={pop}
                showToast={showToast}
              />
            ) : overlay.name === 'create' ? (
              <CreateScreen
                onClose={exitCreate}
                onPublish={handlePublish}
                onDone={exitCreate}
              />
            ) : null
          ) : (
            <>
              <View style={{ flex: 1 }}>{renderMain()}</View>
              <BottomTabs active={tab} onChange={changeTab} bottomInset={insets.bottom} />
            </>
          )}
        </View>
        <Toast message={toast} />
      </View>
    </View>
  );
}

function Root() {
  const { ready, session, vehicle } = useAuth();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, PAGE_WIDTH);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!session || !vehicle) {
    return (
      <View style={styles.stage}>
        <View style={[styles.device, { width: pageWidth }]}>
          <StatusBar style="dark" />
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <OnboardingScreen />
          </View>
        </View>
      </View>
    );
  }

  return <AppShell />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <CurrencyProvider>
          <AuthProvider>
            <Root />
          </AuthProvider>
        </CurrencyProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: '#e6e9ee',
    alignItems: 'center',
  },
  device: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
});
