import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ApiError,
  createOffer,
  listVehicles,
  type OfferApi,
  type VehicleApi,
} from '../api';
import { useAuth } from '../auth';
import { useCurrency } from '../currency';
import { useI18n } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';
import type { Cargo } from '../types';
import { Button, Chip, IconButton } from './ui';

type Props = {
  visible: boolean;
  cargo: Cargo;
  initial?: OfferApi | null;
  onClose: () => void;
  onSubmitted: (offer: OfferApi) => void;
  showToast: (message: string) => void;
};

export function OfferSheet({ visible, cargo, initial, onClose, onSubmitted, showToast }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { t, vehicleLabel } = useI18n();
  const { currency, formatPrice } = useCurrency();
  const { session, vehicle } = useAuth();
  const token = session?.accessToken;

  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [vehicles, setVehicles] = useState<VehicleApi[]>([]);
  const [vehicleId, setVehicleId] = useState<string | undefined>(undefined);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setPrice(String(initial?.price ?? cargo.price));
    setMessage(initial?.message ?? '');
    setError(null);
    setVehicleId(initial?.vehicle?.id ?? vehicle?.id);
  }, [visible, initial, cargo.price, vehicle?.id]);

  useEffect(() => {
    if (!visible || !token) return;
    let alive = true;
    setLoadingVehicles(true);
    listVehicles(token)
      .then((result) => {
        if (!alive) return;
        setVehicles(result.items);
        setVehicleId((current) => {
          if (current && result.items.some((item) => item.id === current)) return current;
          const preferred =
            result.items.find((item) => item.status === 'ACTIVE') ?? result.items[0] ?? null;
          return preferred?.id;
        });
      })
      .catch(() => {
        if (alive) setVehicles([]);
      })
      .finally(() => {
        if (alive) setLoadingVehicles(false);
      });
    return () => {
      alive = false;
    };
  }, [visible, token]);

  const submit = async () => {
    if (!token) {
      showToast(t('offer.error'));
      return;
    }

    const amount = Number(price.replace(/[^\d]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t('offer.priceError'));
      return;
    }

    setSending(true);
    setError(null);
    try {
      const offer = await createOffer(token, cargo.id, {
        price: Math.round(amount),
        ...(message.trim() ? { message: message.trim() } : {}),
        ...(vehicleId ? { vehicleId } : {}),
      });
      onSubmitted(offer);
      showToast(t('offer.sent'));
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t('offer.already'));
      } else if (err instanceof ApiError && err.status === 403) {
        setError(t('offer.error'));
      } else {
        setError(t('offer.error'));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('offer.closeA11y')}
        />
        <View
          style={[
            styles.sheet,
            { maxHeight: Math.min(windowHeight * 0.9, 640), paddingBottom: 14 + insets.bottom },
          ]}
        >
          <View style={styles.grab} />
          <View style={styles.headRow}>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={styles.title}>{t(initial ? 'offer.edit' : 'offer.title')}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {cargo.code ?? cargo.id} · {cargo.title}
              </Text>
            </View>
            <IconButton name="close" onPress={onClose} accessibilityLabel={t('offer.closeA11y')} />
          </View>

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <Text style={styles.label}>{t('offer.priceLabel')}</Text>
              <View style={styles.priceRow}>
                <TextInput
                  testID="offer-price"
                  value={price}
                  onChangeText={(value) => {
                    setPrice(value.replace(/[^\d ]/g, ''));
                    setError(null);
                  }}
                  placeholder={t('offer.pricePlaceholder')}
                  placeholderTextColor="#8a97a8"
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
                <Text style={styles.currency}>{cargo.currency}</Text>
              </View>
              <Text style={styles.hint}>
                {t('detail.fixedPrice')}: {formatPrice(cargo.price, cargo.currency)} {currency}
              </Text>
            </View>

            <View style={styles.field}>
              <View style={styles.vehicleHead}>
                <Text style={styles.label}>{t('offer.vehicleLabel')}</Text>
                {loadingVehicles ? <ActivityIndicator size="small" color={colors.navy} /> : null}
              </View>
              {vehicles.length ? (
                <View style={styles.chips}>
                  {vehicles.map((item) => (
                    <Chip
                      key={item.id}
                      label={`${item.plateNumber} · ${vehicleLabel(item.vehicleType)}`}
                      active={vehicleId === item.id}
                      height={40}
                      fontSize={12.5}
                      onPress={() => setVehicleId(item.id)}
                    />
                  ))}
                </View>
              ) : !loadingVehicles ? (
                <Text style={styles.hint}>{t('offer.vehicleMissing')}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('offer.messageLabel')}</Text>
              <TextInput
                testID="offer-message"
                value={message}
                onChangeText={setMessage}
                placeholder={t('offer.messagePlaceholder')}
                placeholderTextColor="#8a97a8"
                style={styles.messageInput}
                multiline
                maxLength={500}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <Button
            label={sending ? t('offer.sending') : t('offer.submit')}
            icon="send"
            block
            onPress={() => void submit()}
            disabled={sending}
            style={{ marginTop: 12, minHeight: 52 }}
            testID="offer-submit"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 10,
    paddingHorizontal: 20,
    ...shadow.sheet,
  },
  grab: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#d6dce4',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  body: {
    gap: 14,
    paddingBottom: 4,
  },
  field: {
    gap: 7,
  },
  label: {
    fontSize: 10.5,
    fontFamily: font.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  vehicleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bg,
  },
  priceInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 22,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
    outlineStyle: 'none',
  } as object,
  currency: {
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: 0.6,
    color: colors.ink3,
  },
  hint: {
    fontSize: 12,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  messageInput: {
    minHeight: 90,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bg,
    fontSize: 15,
    fontFamily: font.regular,
    color: colors.ink,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  } as object,
  error: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: colors.red,
  },
});
