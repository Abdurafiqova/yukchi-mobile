import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Button, PageHead } from '../components/ui';
import { listChats, type ChatSummary } from '../api';
import { initialsOf, useAuth } from '../auth';
import { chatTimeLabel } from '../chat-time';
import { useI18n } from '../i18n/index';
import { colors, font, radius } from '../theme';

export function ChatsScreen({ onOpenChat }: { onOpenChat: (chat: ChatSummary) => void }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    listChats(token)
      .then((result) => {
        if (!cancelled) setChats(result.items);
      })
      .catch(() => {
        if (!cancelled) {
          setChats([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, reload]);

  const q = query.trim().toLowerCase();
  const list = q
    ? chats.filter((chat) =>
        `${chat.counterpart.name} ${chat.counterpart.companyName ?? ''} ${chat.cargo.title} ${chat.cargo.code}`
          .toLowerCase()
          .includes(q),
      )
    : chats;

  return (
    <View style={styles.screen}>
      <PageHead title={t('chats.title')} sub={t('chats.sub')} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View style={styles.search}>
          <Icon name="search" size={20} color={colors.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('chats.search')}
            placeholderTextColor="#6c7a8c"
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.navy} />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="search" size={24} color={colors.navy} />
            </View>
            <Text style={styles.emptyTitle}>{t('chats.loadErrorTitle')}</Text>
            <Text style={styles.emptyText}>{t('chats.loadErrorText')}</Text>
            <Button
              label={t('chats.retry')}
              variant="outline"
              onPress={() => setReload((value) => value + 1)}
              style={{ marginTop: 10, minHeight: 48 }}
            />
          </View>
        ) : list.length ? (
          <View style={styles.card}>
            {list.map((chat, idx) => {
              const last = chat.lastMessage;
              const snippet = last
                ? `${last.mine ? `${t('chats.you')}: ` : ''}${last.text ?? ''}`
                : t('chats.noMessages');
              return (
                <Pressable
                  key={chat.id}
                  onPress={() => onOpenChat(chat)}
                  accessibilityRole="button"
                  accessibilityLabel={t('chats.openA11y', { name: chat.counterpart.name })}
                  style={({ pressed }) => [
                    styles.row,
                    idx < list.length - 1 && styles.rowBorder,
                    pressed && { backgroundColor: '#f7f9fc' },
                  ]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initialsOf(chat.counterpart.name)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {chat.counterpart.name} · {chat.cargo.title}
                    </Text>
                    <Text style={styles.snippet} numberOfLines={1}>
                      {snippet}
                    </Text>
                  </View>
                  <View style={styles.side}>
                    <Text style={styles.time}>{chatTimeLabel(chat.updatedAt)}</Text>
                    {chat.unreadCount > 0 ? (
                      <View style={styles.unread}>
                        <Text style={styles.unreadText}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="search" size={24} color={colors.navy} />
            </View>
            <Text style={styles.emptyTitle}>{t('chats.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('chats.emptyText')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  search: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 16,
    color: colors.ink,
    fontFamily: font.regular,
    outlineStyle: 'none',
  } as object,
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 20,
  },
  statusBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f5',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: font.bold,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 14.5,
    fontFamily: font.bold,
    color: colors.ink,
  },
  snippet: {
    fontSize: 12.5,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  side: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    fontSize: 11,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  unread: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 99,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontFamily: font.extrabold,
    color: colors.orangeInk,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.bold,
    color: colors.ink,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: font.regular,
    color: colors.ink3,
    textAlign: 'center',
    maxWidth: 260,
  },
});
