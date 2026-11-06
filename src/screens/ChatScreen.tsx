import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatMiniMap } from '../components/MapArt';
import { Icon } from '../components/Icon';
import { Button, IconButton } from '../components/ui';
import {
  ApiError,
  getChatByCargo,
  listChatMessages,
  markChatRead,
  sendChatMessage,
  type ChatCargoSummary,
  type ChatCounterpart,
  type ChatMessageApi,
} from '../api';
import { initialsOf, useAuth } from '../auth';
import { chatTimeLabel } from '../chat-time';
import { useI18n } from '../i18n/index';
import { colors, font } from '../theme';
import type { Cargo } from '../types';

type ChatConversation = {
  id: string;
  counterpart: ChatCounterpart;
  cargo?: ChatCargoSummary;
};

export function ChatScreen({
  cargoId,
  chatId,
  title,
  cargo,
  onBack,
  showToast,
}: {
  cargoId: string;
  chatId?: string;
  title?: string;
  cargo?: Cargo;
  onBack: () => void;
  showToast: (message: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessageApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'none' | 'load' | 'unavailable'>('none');
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('none');
    (async () => {
      try {
        let found: ChatConversation | null = null;
        if (!chatId) {
          const byCargo = await getChatByCargo(token, cargoId);
          found = byCargo;
        }
        const targetId = chatId ?? found?.id;
        if (!targetId) throw new ApiError(404, 'chat not found');
        const result = await listChatMessages(token, targetId);
        if (cancelled) return;
        setConversation({
          id: result.conversation.id,
          counterpart: result.conversation.counterpart,
          cargo: found?.cargo,
        });
        setMessages(result.items);
        setLoading(false);
        markChatRead(token, result.conversation.id).catch(() => {});
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError && err.status === 404 ? 'unavailable' : 'load');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, cargoId, chatId, reload]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const sendText = async () => {
    const value = draft.trim();
    const targetId = conversation?.id;
    if (!value || !token || !targetId || sending) return;
    setSending(true);
    try {
      const message = await sendChatMessage(token, targetId, value);
      setMessages((prev) => [...prev, message]);
      setDraft('');
      scrollToEnd();
    } catch {
      showToast(t('chat.sendError'));
    } finally {
      setSending(false);
    }
  };

  const sendPhoto = () => {
    showToast(t('chat.photoSoon'));
  };

  const sendLocation = () => {
    if (!cargo?.pickup) {
      showToast(t('chat.locationUnavailable'));
      return;
    }
    setDraft((prev) => (prev.trim() ? prev : `${t('chat.pickupPoint')}: ${cargo.pickup}`));
  };

  const counterpart = conversation?.counterpart;
  const displayName = counterpart?.name ?? cargo?.owner ?? '';
  const headerTitle = title ?? conversation?.cargo?.title ?? cargo?.title ?? '';
  const roleLabel = counterpart
    ? counterpart.role === 'CARGO_OWNER'
      ? t('chat.ownerLabel')
      : t('chat.driverLabel')
    : cargo
      ? t('chat.ownerLabel')
      : '';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.head}>
        <IconButton name="back" plain onPress={onBack} accessibilityLabel={t('chat.backA11y')} />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(displayName)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName || t('chat.ownerLabel')}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {roleLabel}
            {headerTitle ? ` · ${headerTitle}` : ''}
          </Text>
        </View>
        <IconButton
          name="phone"
          plain
          onPress={() => showToast(t('chat.calling', { name: displayName }))}
          accessibilityLabel={t('chat.callA11y')}
        />
      </View>

      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator color={colors.navy} />
        </View>
      ) : error !== 'none' ? (
        <View style={styles.statusBox}>
          <View style={styles.statusIcon}>
            <Icon name={error === 'unavailable' ? 'truck' : 'search'} size={24} color={colors.navy} />
          </View>
          <Text style={styles.statusTitle}>
            {error === 'unavailable' ? t('chat.unavailableTitle') : t('chat.loadErrorTitle')}
          </Text>
          <Text style={styles.statusText}>
            {error === 'unavailable' ? t('chat.unavailableText') : t('chat.loadErrorText')}
          </Text>
          {error === 'load' ? (
            <Button
              label={t('chat.retry')}
              variant="outline"
              onPress={() => setReload((value) => value + 1)}
              style={{ marginTop: 10, minHeight: 48 }}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.chatArea}>
          <LinearGradient
            colors={['rgba(232,238,247,0.55)', 'rgba(243,244,246,0)']}
            pointerEvents="none"
            style={styles.chatGlow}
          />
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            onContentSizeChange={scrollToEnd}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dayDivider}>
              <Text style={styles.dayText}>{t('chat.today')}</Text>
            </View>
            {messages.length ? (
              messages.map((m) => <Message key={m.id} message={m} />)
            ) : (
              <Text style={styles.empty}>{t('chat.empty')}</Text>
            )}
          </ScrollView>
        </View>
      )}

      {conversation && error === 'none' ? (
        <View style={[styles.composer, { paddingBottom: 9 + insets.bottom }]}>
          <Pressable style={styles.composerBtn} onPress={sendPhoto} accessibilityLabel={t('chat.attachA11y')}>
            <Icon name="paperclip" size={21} color={colors.ink2} />
          </Pressable>
          <Pressable
            style={styles.composerBtn}
            onPress={sendLocation}
            accessibilityLabel={t('chat.locationA11y')}
          >
            <Icon name="pin" size={21} color={colors.ink2} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={sendText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.ink3}
            style={styles.input}
            returnKeyType="send"
            testID="chat-input"
          />
          <Pressable
            style={[styles.send, (sending || !draft.trim()) && styles.sendDisabled]}
            onPress={sendText}
            accessibilityLabel={t('chat.sendA11y')}
            testID="chat-send"
          >
            {sending ? (
              <ActivityIndicator color={colors.orangeInk} />
            ) : (
              <Icon name="send" size={20} color={colors.orangeInk} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Message({ message }: { message: ChatMessageApi }) {
  const { t } = useI18n();
  const mine = message.mine;
  return (
    <View style={[styles.msg, mine ? styles.msgDriver : styles.msgOwner]}>
      {message.kind === 'LOCATION' ? (
        <View style={[styles.locCard, !mine && styles.locCardOwner]}>
          <View style={styles.locMap}>
            <ChatMiniMap />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text style={[styles.locTitle, mine && { color: '#fff' }]}>{t('chat.pickupPoint')}</Text>
            <Text style={[styles.locSub, mine && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={2}>
              {message.text}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.msgText, mine && { color: '#fff' }]}>{message.text}</Text>
      )}
      <Text style={[styles.msgTime, mine && { color: 'rgba(255,255,255,0.7)' }]}>
        {chatTimeLabel(message.createdAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: font.bold,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 15,
    fontFamily: font.bold,
    letterSpacing: -0.15,
    color: colors.ink,
    lineHeight: 20,
  },
  sub: {
    fontSize: 11.5,
    color: colors.ink3,
    fontFamily: font.regular,
  },
  statusBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 6,
  },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: font.regular,
    color: colors.ink3,
    textAlign: 'center',
    maxWidth: 280,
  },
  chatArea: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  chatGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
    minHeight: '100%',
  },
  dayDivider: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: '#e6eaf0',
  },
  dayText: {
    fontSize: 11,
    fontFamily: font.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  empty: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  msg: {
    maxWidth: '82%',
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  msgOwner: {
    alignSelf: 'flex-start',
    backgroundColor: colors.msgOwner,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 5,
  },
  msgDriver: {
    alignSelf: 'flex-end',
    backgroundColor: colors.navy,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 16,
  },
  msgText: {
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.ink,
    fontFamily: font.regular,
  },
  msgTime: {
    fontSize: 10,
    fontFamily: font.semibold,
    letterSpacing: 0.2,
    color: colors.ink3,
    alignSelf: 'flex-end',
  },
  locCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  locCardOwner: {
    backgroundColor: '#fff',
    borderColor: colors.line,
  },
  locMap: {
    width: 64,
    height: 48,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#dfe7ef',
  },
  locTitle: {
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: 0.2,
    color: colors.ink,
  },
  locSub: {
    fontSize: 12,
    fontFamily: font.regular,
    color: colors.ink2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 9,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  composerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface2,
    fontSize: 15,
    color: colors.ink,
    fontFamily: font.regular,
    outlineStyle: 'none',
  } as object,
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.55,
  },
});
