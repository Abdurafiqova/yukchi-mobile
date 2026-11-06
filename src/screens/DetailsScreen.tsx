import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { listMyOffers, withdrawOffer, type OfferApi } from '../api';
import { useAuth } from '../auth';
import { vehicleIcon } from '../cargo-map';
import { OfferSheet } from '../components/OfferSheet';
import { useCurrency } from '../currency';
import { Icon, type IconName } from '../components/Icon';
import { Badge, Button, IconButton } from '../components/ui';
import { useI18n, type MessageKey } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';
import type { Cargo } from '../types';

const OFFER_BADGES: Record<OfferApi['status'], { key: MessageKey; tone: 'amber' | 'green' | 'red' | 'navy' }> = {
  PENDING: { key: 'offer.pending', tone: 'amber' },
  ACCEPTED: { key: 'offer.accepted', tone: 'green' },
  REJECTED: { key: 'offer.rejected', tone: 'red' },
  WITHDRAWN: { key: 'offer.withdrawn', tone: 'navy' },
};

export function DetailsScreen({
  cargo,
  onBack,
  onContact,
  showToast,
}: {
  cargo: Cargo;
  onBack: () => void;
  onContact: () => void;
  showToast: (message: string) => void;
}) {
  const { t, statusLabel, vehicleLabel, paymentLabel, formatDate } = useI18n();
  const { currency, formatPrice } = useCurrency();
  const { session } = useAuth();
  const token = session?.accessToken;
  const [width, setWidth] = useState(0);
  const [slide, setSlide] = useState(0);
  const [offer, setOffer] = useState<OfferApi | null>(null);
  const [offerSheet, setOfferSheet] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const slides = cargo.photos;

  useEffect(() => {
    let alive = true;
    setOffer(null);
    if (!token) return;
    listMyOffers(token, cargo.id)
      .then((result) => {
        if (alive) setOffer(result.items[0] ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [cargo.id, token]);

  const withdraw = async () => {
    if (!token || !offer || withdrawing) return;
    setWithdrawing(true);
    try {
      const updated = await withdrawOffer(token, offer.id);
      setOffer(updated);
      showToast(t('offer.withdrawnToast'));
    } catch {
      showToast(t('offer.error'));
    } finally {
      setWithdrawing(false);
    }
  };

  const offerBadge = offer ? OFFER_BADGES[offer.status] : null;
  const pending = offer?.status === 'PENDING';
  const canOffer = cargo.status === 'Published' && !pending;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / width) + 1;
    setSlide(Math.min(slides.length, idx));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.head}>
        <IconButton name="back" plain onPress={onBack} accessibilityLabel={t('detail.backA11y')} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.docId}>{cargo.code ?? cargo.id}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {cargo.title}
          </Text>
        </View>
        <Badge label={statusLabel(cargo.status)} tone={cargo.status === 'Pending review' ? 'amber' : 'green'} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
        <View style={styles.carousel} onLayout={onLayout}>
          {slides.length ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScrollEnd}
            >
              {slides.map((p, i) => (
                <View key={i} style={[styles.slide, width ? { width } : null]}>
                  <Image source={p.src} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noPhoto}>
              <View style={styles.noPhotoIco}>
                <Icon name={vehicleIcon(cargo.vehicle)} size={52} color={colors.navy} strokeWidth={1.5} />
              </View>
              <Text style={styles.noPhotoText}>{t('cargo.noPhoto')}</Text>
            </View>
          )}
          {slides.length > 1 ? (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {slide || 1} / {slides.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceXl}>
              {cargo.priceNegotiable || !cargo.price ? t('cargo.negotiable') : formatPrice(cargo.price, cargo.currency)}
              {!cargo.priceNegotiable && cargo.price ? (
                <Text style={styles.cur}> {currency}</Text>
              ) : null}
            </Text>
            <View style={styles.priceSide}>
              <Text style={styles.priceNote}>
                {cargo.priceNegotiable ? t('cargo.negotiable') : t('detail.fixedPrice')}
              </Text>
              <View style={styles.payChip}>
                <Text style={styles.payChipText}>{paymentLabel(cargo.paymentMethod)}</Text>
              </View>
            </View>
          </View>

          {offer && offerBadge ? (
            <View style={styles.panel}>
              <View style={styles.offerHead}>
                <Text style={styles.panelTitle}>{t('offer.yourOffer')}</Text>
                <Badge label={t(offerBadge.key)} tone={offerBadge.tone} />
              </View>
              <Text style={styles.offerPrice}>
                {formatPrice(offer.price, cargo.currency)} <Text style={styles.offerCur}>{currency}</Text>
              </Text>
              <Text style={styles.offerMeta}>
                {offer.vehicle ? `${offer.vehicle.plateNumber} · ${vehicleLabel(offer.vehicle.vehicleType)}` : ''}
              </Text>
              {offer.status === 'PENDING' ? (
                <Text style={styles.offerAwait}>{t('offer.awaiting')}</Text>
              ) : null}
              {offer.message ? <Text style={styles.offerMessage}>{offer.message}</Text> : null}
              {offer.status === 'PENDING' ? (
                <Button
                  label={t('offer.withdraw')}
                  variant="ghost"
                  onPress={() => void withdraw()}
                  disabled={withdrawing}
                  style={{ marginTop: 10, minHeight: 44 }}
                  testID="offer-withdraw"
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('detail.route')}</Text>
            <View style={styles.route}>
              <View style={styles.routeLine}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <View key={i} style={styles.routeDash} />
                ))}
              </View>
              <View style={styles.stop}>
                <View style={[styles.stopDot, { borderColor: colors.navy }]} />
                <Text style={styles.stopLabel}>{t('detail.pickup')}</Text>
                <Text style={styles.stopCity}>{cargo.pickup}</Text>
                <Text style={styles.stopMeta}>
                  {cargo.readyToLoad ? t('cargo.ready') : formatDate(cargo.pickupDate)}
                </Text>
              </View>
              <View style={styles.stop}>
                <View style={[styles.stopDot, { borderColor: colors.orange }]} />
                <Text style={styles.stopLabel}>{t('detail.dropoff')}</Text>
                <Text style={styles.stopCity}>{cargo.drop}</Text>
                <Text style={styles.stopMeta}>{cargo.distance}</Text>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('cargo.payment')}</Text>
            <View style={styles.infoRows}>
              <InfoRow label={t('detail.paymentMethod')} value={paymentLabel(cargo.paymentMethod)} />
              <InfoRow
                label={t('detail.advance')}
                value={cargo.advanceAmount ? `${formatPrice(cargo.advanceAmount, cargo.currency)} ${currency}` : '—'}
              />
              <InfoRow label={t('detail.trucksNeeded')} value={String(cargo.trucksNeeded)} />
              <InfoRow
                label={cargo.readyToLoad ? t('detail.readyToLoad') : t('detail.scheduledFor')}
                value={cargo.readyToLoad ? t('create.readyYes') : formatDate(cargo.pickupDate)}
                strong={cargo.readyToLoad}
              />
              {cargo.isAdditionalLoad ? (
                <InfoRow label={t('detail.additionalLoad')} value={t('create.readyYes')} warm />
              ) : null}
            </View>
          </View>

          <View style={styles.specs}>
            <Spec icon="box" label={t('detail.weight')} value={cargo.weight} />
            <Spec icon="volume" label={t('detail.volume')} value={cargo.volume} />
            <Spec icon="truck" label={t('detail.vehicle')} value={vehicleLabel(cargo.vehicle)} />
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('detail.owner')}</Text>
            <View style={styles.owner}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{cargo.initials}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.ownerName}>{cargo.owner}</Text>
                <Text style={styles.ownerMeta}>{cargo.ownerMeta}</Text>
              </View>
              <View style={styles.rating}>
                <Icon name="star" size={12} color={colors.green} />
                <Text style={styles.ratingText}>{cargo.rating}</Text>
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>{t('detail.notes')}</Text>
            <Text style={styles.notes}>{cargo.notes}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionbar}>
        {canOffer ? (
          <Button
            label={t(offer ? 'offer.edit' : 'offer.cta')}
            icon="send"
            iconSize={16}
            fontSize={12.5}
            onPress={() => setOfferSheet(true)}
            style={{ flex: 1 }}
            testID="offer-cta"
          />
        ) : null}
        <Button
          label={t('detail.contact')}
          variant={canOffer ? 'outline' : 'primary'}
          icon="chat"
          iconSize={16}
          fontSize={12.5}
          onPress={onContact}
          style={{ flex: 1 }}
          testID="contact-owner"
        />
      </View>

      <OfferSheet
        visible={offerSheet}
        cargo={cargo}
        initial={offer}
        onClose={() => setOfferSheet(false)}
        onSubmitted={setOffer}
        showToast={showToast}
      />
    </View>
  );
}

function Spec({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.spec}>
      <Icon name={icon} size={19} color={colors.orangeDeep} />
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  strong,
  warm,
}: {
  label: string;
  value: string;
  strong?: boolean;
  warm?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          strong && { color: colors.green, fontFamily: font.extrabold },
          warm && { color: colors.orangeDeep },
        ]}
      >
        {value}
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  docId: {
    fontSize: 10.5,
    fontFamily: font.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  title: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
    lineHeight: 23,
  },
  scroll: {
    flex: 1,
  },
  carousel: {
    height: 260,
    backgroundColor: colors.navySoft,
    overflow: 'hidden',
  },
  slide: {
    height: 260,
    backgroundColor: '#e8eef7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
  },
  noPhotoIco: {
    width: 96,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navySoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noPhotoText: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  counter: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(15,27,45,0.78)',
  },
  counterText: {
    color: '#fff',
    fontSize: 11.5,
    fontFamily: font.bold,
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 14,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  priceXl: {
    fontSize: 30,
    fontFamily: font.extrabold,
    letterSpacing: -0.9,
    color: colors.navy,
    fontVariant: ['tabular-nums'],
    lineHeight: 32,
  },
  cur: {
    fontSize: 13,
    fontFamily: font.bold,
    letterSpacing: 0.5,
    color: colors.ink3,
  },
  priceNote: {
    fontSize: 12,
    fontFamily: font.bold,
    color: colors.green,
    paddingBottom: 4,
  },
  priceSide: {
    alignItems: 'flex-end',
    gap: 4,
  },
  payChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: colors.navySoft,
  },
  payChipText: {
    fontSize: 11,
    fontFamily: font.bold,
    color: colors.navy,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
  },
  panelTitle: {
    fontSize: 11,
    fontFamily: font.bold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 12,
  },
  infoRows: {
    gap: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f5',
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: font.medium,
    color: colors.ink3,
  },
  infoValue: {
    fontSize: 13.5,
    fontFamily: font.bold,
    color: colors.ink,
  },
  route: {
    position: 'relative',
    paddingLeft: 26,
    gap: 20,
  },
  routeLine: {
    position: 'absolute',
    left: 7,
    top: 8,
    bottom: 8,
    width: 2,
    justifyContent: 'space-between',
    overflow: 'hidden',
    opacity: 0.9,
  },
  routeDash: {
    width: 2,
    height: 5,
    backgroundColor: colors.navyLine,
  },
  stop: {
    gap: 1,
  },
  stopDot: {
    position: 'absolute',
    left: -26,
    top: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    backgroundColor: colors.surface,
  },
  stopLabel: {
    fontSize: 10.5,
    fontFamily: font.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  stopCity: {
    fontSize: 15.5,
    fontFamily: font.bold,
    letterSpacing: -0.1,
    color: colors.ink,
    lineHeight: 20,
  },
  stopMeta: {
    fontSize: 12.5,
    color: colors.ink3,
    fontFamily: font.regular,
  },
  specs: {
    flexDirection: 'row',
    gap: 8,
  },
  spec: {
    flex: 1,
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  specLabel: {
    fontSize: 10,
    fontFamily: font.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  specValue: {
    fontSize: 14.5,
    fontFamily: font.bold,
    letterSpacing: -0.1,
    color: colors.ink,
  },
  owner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  ownerName: {
    fontSize: 15,
    fontFamily: font.bold,
    color: colors.ink,
    lineHeight: 20,
  },
  ownerMeta: {
    fontSize: 12.5,
    color: colors.ink3,
    fontFamily: font.regular,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 7,
    backgroundColor: colors.greenBg,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: font.bold,
    color: colors.green,
  },
  notes: {
    fontSize: 14.5,
    lineHeight: 23,
    color: colors.ink2,
    fontFamily: font.regular,
  },
  offerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  offerPrice: {
    fontSize: 24,
    fontFamily: font.extrabold,
    letterSpacing: -0.6,
    color: colors.navy,
    fontVariant: ['tabular-nums'],
    lineHeight: 28,
  },
  offerCur: {
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: 0.5,
    color: colors.ink3,
  },
  offerMeta: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: font.semibold,
    color: colors.ink2,
  },
  offerAwait: {
    marginTop: 4,
    fontSize: 12.5,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  offerMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: font.regular,
    color: colors.ink2,
  },
  actionbar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    ...shadow.card,
  },
});
