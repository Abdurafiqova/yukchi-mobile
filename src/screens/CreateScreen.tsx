import React, { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { CreateMap } from '../components/MapArt';
import { DisplayField, FloatingField, SelectField } from '../components/Form';
import { Icon } from '../components/Icon';
import { Button, IconButton, SectionLabel } from '../components/ui';
import { CITIES, PICKUP_TIMES, VEHICLES } from '../data';
import { CURRENCY_CODES, formatCurrencyAmount, type CurrencyCode } from '../currency';
import { useCurrency } from '../currency';
import { useI18n, type MessageKey } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';
import type { Cargo, CargoPaymentMethod, VehicleType } from '../types';

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const today = new Date();
const tomorrow = new Date(today.getTime() + 86400000);

type Errors = { address?: string; desc?: string; weight?: string; price?: string; phone?: string };

type PickerOption = { value: string; label: string };

type PickerState = {
  title: string;
  options: PickerOption[];
  value: string;
  onPick: (value: string) => void;
} | null;

export function CreateScreen({
  onClose,
  onPublish,
  onDone,
}: {
  onClose: () => void;
  onPublish: (cargo: Cargo) => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { t, cityLabel, vehicleLabel, paymentLabel, formatDate } = useI18n();
  const { currency: displayCurrency } = useCurrency();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [desc, setDesc] = useState('');
  const [dest, setDest] = useState('Samarkand');
  const [vehicle, setVehicle] = useState<VehicleType>('TENT');
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [trucks, setTrucks] = useState('1');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(displayCurrency);
  const [negotiable, setNegotiable] = useState(true);
  const [payment, setPayment] = useState<CargoPaymentMethod>('CASH');
  const [advance, setAdvance] = useState('');
  const [additional, setAdditional] = useState(false);
  const [readyNow, setReadyNow] = useState(true);
  const [date, setDate] = useState(isoOf(today));
  const [time, setTime] = useState('14:00');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [pin, setPin] = useState({ left: 52, top: 58 });
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [photos, setPhotos] = useState<string[]>([]);
  const [publishedId, setPublishedId] = useState('');
  const [picker, setPicker] = useState<PickerState>(null);

  const setField = (name: keyof Errors, clear: boolean) => {
    if (clear && errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const stepLabels: Record<number, string> = {
    1: t('create.step1'),
    2: t('create.step2'),
    3: t('create.step3'),
    4: t('create.step4'),
  };

  const goStep = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const validateStep1 = () => {
    const next: Errors = {};
    if (address.trim().length < 5) next.address = t('create.errAddress');
    if (desc.trim().length < 10) next.desc = t('create.errDesc');
    if (!(Number(weight) > 0)) next.weight = t('create.errWeight');
    if (!(Number(price) > 0)) next.price = t('create.errPrice');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = () => {
    const next: Errors = {};
    if (phone.replace(/\D/g, '').length < 9) next.phone = t('create.errPhone');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reviewRows = [
    [t('create.reviewAddress'), address || '—'],
    [t('create.reviewDestination'), cityLabel(dest)],
    [t('create.reviewCargo'), desc || '—'],
    [t('create.reviewVehicle'), vehicleLabel(vehicle)],
    [t('create.reviewWeight'), `${weight || '0'} t`],
    [t('create.reviewTrucks'), String(trucks)],
    [t('create.reviewPickup'), readyNow ? t('create.readyNow') : `${formatDate(date)} · ${time}`],
    [t('create.reviewPayment'), paymentLabel(payment)],
    [t('create.reviewReady'), readyNow ? t('create.readyYes') : t('create.readyNo')],
    [t('create.reviewAdditional'), additional ? t('create.readyYes') : t('create.readyNo')],
    [t('create.reviewContact'), phone || '—'],
    [t('create.reviewNegotiable'), negotiable ? t('create.reviewYes') : t('create.reviewFixed')],
  ];

  const publish = () => {
    const words = (desc || 'cargo')
      .replace(/[^\w\sʻʼ‘’'-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join(' ')
      .toLowerCase();
    const id = `YC-${1044 + Math.floor(Math.random() * 40)}`;
    const photoSources = photos.map((uri) => ({ src: { uri }, alt: t('create.photoAlt') }));
    const now = new Date();
    const cargo: Cargo = {
      id,
      title: `${weight || '0'} t ${words || 'cargo'}`,
      from: 'Tashkent',
      to: dest,
      pickup: address,
      drop: t('create.dropPoint', { city: cityLabel(dest) }),
      distance: 'Just now',
      price: Number(price),
      currency,
      priceNegotiable: negotiable,
      weight: `${weight || '0'} t`,
      minWeight: Number(weight) || 1,
      volume: volume ? `${volume} m³` : '—',
      vehicle,
      region: 'Tashkent',
      owner: 'Aziz Tursunov',
      initials: 'AT',
      rating: '4.8',
      ownerMeta: t('create.ownerMeta'),
      posted: 'Just now',
      postedTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      views: 0,
      paymentMethod: payment,
      advanceAmount: Number(advance) || 0,
      trucksNeeded: Math.max(1, Number(trucks) || 1),
      readyToLoad: readyNow,
      pickupDate: date,
      isAdditionalLoad: additional,
      photos: photoSources,
      photo: photoSources[0]?.src ?? null,
      marker: pin,
      notes: notes || desc,
      status: 'Pending review',
    };
    setPublishedId(id);
    onPublish(cargo);
    goStep(4);
  };

  const pickPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 0.7,
      });
      if (!result.canceled) {
        setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 8));
      }
    } catch {
      // Picker is unavailable in this environment; the sheet still works without photos.
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setErrors({});
        goStep(2);
      }
      return;
    }
    if (step === 2) {
      if (validateStep2()) {
        setErrors({});
        goStep(3);
      }
      return;
    }
    if (step === 3) publish();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View>
        <View style={styles.head}>
          <IconButton
            name={step === 4 ? 'back' : 'close'}
            plain
            onPress={onClose}
            accessibilityLabel={t('create.closeA11y')}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>{t('create.title')}</Text>
            <Text style={styles.stepLabel}>{stepLabels[step]}</Text>
          </View>
        </View>
        <View style={styles.progress}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                i < step && { backgroundColor: colors.orange },
                i === step && { backgroundColor: colors.navy },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <View style={styles.form}>
            <SectionLabel>{t('create.pickupSection')}</SectionLabel>
            <FloatingField
              label={t('create.address')}
              value={address}
              testID="field-address"
              onChangeText={(v) => {
                setAddress(v);
                setField('address', v.trim().length >= 5);
              }}
              error={errors.address}
            />
            <Pressable
              style={styles.minimap}
              onLayout={(e) => setMapSize(e.nativeEvent.layout)}
              onPress={(e) => {
                const { locationX, locationY } = e.nativeEvent;
                if (!mapSize.width || !mapSize.height) return;
                setPin({
                  left: Math.min(92, Math.max(8, (locationX / mapSize.width) * 100)),
                  top: Math.min(88, Math.max(10, (locationY / mapSize.height) * 100)),
                });
              }}
              accessibilityLabel={t('create.mapA11y')}
            >
              <CreateMap />
              <View
                pointerEvents="none"
                style={[
                  styles.pin,
                  { left: `${pin.left}%` as unknown as number, top: `${pin.top}%` as unknown as number },
                ]}
              >
                <Svg width={30} height={30} viewBox="0 0 24 24">
                  <Path
                    d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
                    fill={colors.orange}
                    stroke={colors.orangeDeep}
                    strokeWidth={1.2}
                  />
                  <Circle cx={12} cy={10} r={2.6} fill="#fff" />
                </Svg>
              </View>
            </Pressable>
            <Text style={styles.cap}>{t('create.mapHint')}</Text>

            <SectionLabel style={{ marginTop: 6 }}>{t('create.detailsSection')}</SectionLabel>
            <FloatingField
              label={t('create.description')}
              value={desc}
              testID="field-desc"
              onChangeText={(v) => {
                setDesc(v);
                setField('desc', v.trim().length >= 10);
              }}
              error={errors.desc}
              multiline
            />
            <SelectField
              label={t('create.destination')}
              value={cityLabel(dest)}
              onPress={() =>
                setPicker({
                  title: t('create.destination'),
                  options: CITIES.map((city) => ({ value: city, label: cityLabel(city) })),
                  value: dest,
                  onPick: setDest,
                })
              }
            />
            <SelectField
              label={t('create.vehicleNeeded')}
              value={vehicleLabel(vehicle)}
              onPress={() =>
                setPicker({
                  title: t('create.vehiclePicker'),
                  options: VEHICLES.map((name) => ({ value: name, label: vehicleLabel(name) })),
                  value: vehicle,
                  onPick: (value) => setVehicle(value as VehicleType),
                })
              }
            />
            <View style={styles.twocol}>
              <View style={{ flex: 1 }}>
                <FloatingField
                  label={t('create.weightT')}
                  value={weight}
                  testID="field-weight"
                  onChangeText={(v) => {
                    setWeight(v);
                    setField('weight', Number(v) > 0);
                  }}
                  error={errors.weight}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FloatingField
                  label={t('create.price')}
                  value={price}
                  testID="field-price"
                  onChangeText={(v) => {
                    setPrice(v);
                    setField('price', Number(v) > 0);
                  }}
                  error={errors.price}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <DisplayField
              label={t('currency.viewIn')}
              value={`${currency} · ${t(`currency.${currency.toLowerCase()}` as MessageKey)}`}
              onPress={() =>
                setPicker({
                  title: t('currency.viewIn'),
                  options: CURRENCY_CODES.map((value) => ({
                    value,
                    label: `${value} · ${t(`currency.${value.toLowerCase()}` as MessageKey)}`,
                  })),
                  value: currency,
                  onPick: (value) => setCurrency(value as CurrencyCode),
                })
              }
            />

            <View style={styles.twocol}>
              <View style={{ flex: 1 }}>
                <FloatingField
                  label={t('create.volumeM3')}
                  value={volume}
                  onChangeText={(v) => setVolume(v.replace(/[^\d.,]/g, '').slice(0, 6))}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <DisplayField
                  label={t('create.trucksNeeded')}
                  value={trucks}
                  onPress={() =>
                    setPicker({
                      title: t('create.trucksNeeded'),
                      options: ['1', '2', '3', '4', '5'].map((value) => ({ value, label: value })),
                      value: trucks,
                      onPick: setTrucks,
                    })
                  }
                />
              </View>
            </View>

            <Pressable style={styles.switchrow} onPress={() => setNegotiable((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: negotiable }}>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={styles.switchTitle}>{t('create.negotiable')}</Text>
                <Text style={styles.switchSub}>{t('create.negotiableSub')}</Text>
              </View>
              <View style={[styles.switch, negotiable && { backgroundColor: colors.navy }]}>
                <View style={[styles.knob, negotiable && { transform: [{ translateX: 20 }] }]} />
              </View>
            </Pressable>

            <Pressable style={styles.switchrow} onPress={() => setReadyNow((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: readyNow }}>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={styles.switchTitle}>{t('create.readyNow')}</Text>
                <Text style={styles.switchSub}>{t('create.readyNowSub')}</Text>
              </View>
              <View style={[styles.switch, readyNow && { backgroundColor: colors.green }]}>
                <View style={[styles.knob, readyNow && { transform: [{ translateX: 20 }] }]} />
              </View>
            </Pressable>

            <Pressable style={styles.switchrow} onPress={() => setAdditional((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: additional }}>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={styles.switchTitle}>{t('create.additionalLoad')}</Text>
                <Text style={styles.switchSub}>{t('create.additionalLoadSub')}</Text>
              </View>
              <View style={[styles.switch, additional && { backgroundColor: colors.orange }]}>
                <View style={[styles.knob, additional && { transform: [{ translateX: 20 }] }]} />
              </View>
            </Pressable>

            <SelectField
              label={t('create.paymentMethod')}
              value={paymentLabel(payment)}
              onPress={() =>
                setPicker({
                  title: t('create.paymentMethod'),
                  options: ['CASH', 'TRANSFER', 'MIXED'].map((value) => ({
                    value,
                    label: paymentLabel(value),
                  })),
                  value: payment,
                  onPick: (value) => setPayment(value as CargoPaymentMethod),
                })
              }
            />
            <FloatingField
              label={t('create.advance')}
              value={advance}
              onChangeText={(v) => setAdvance(v.replace(/\D/g, '').slice(0, 12))}
              keyboardType="numeric"
            />
            <Text style={styles.cap}>{t('create.advanceHint')}</Text>

            <Pressable style={styles.upload} onPress={pickPhotos} accessibilityRole="button">
              <View style={styles.uIco}>
                <Icon name="camera" size={23} color={colors.navy} />
              </View>
              <Text style={styles.uploadStrong}>{t('create.addPhotos')}</Text>
              <Text style={styles.uploadSpan}>{t('create.uploadHint')}</Text>
            </Pressable>
            <Text style={styles.cap}>{t('create.photosOptional')}</Text>
            {photos.length ? (
              <View style={styles.thumbs}>
                {photos.map((uri, i) => (
                  <Image key={`${uri}-${i}`} source={{ uri }} style={styles.thumb} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.form}>
            <SectionLabel>{t('create.schedule')}</SectionLabel>
            {readyNow ? (
              <View style={styles.readyCard}>
                <View style={styles.readyIco}>
                  <Icon name="check" size={16} color={colors.green} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.readyTitle}>{t('create.readyNow')}</Text>
                  <Text style={styles.readySub}>{t('create.readyNowSub')}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.twocol}>
                <View style={{ flex: 1 }}>
                  <DisplayField
                    label={t('create.pickupDate')}
                    value={formatDate(date)}
                    onPress={() =>
                      setPicker({
                        title: t('create.pickupDate'),
                        options: [
                          { value: isoOf(today), label: t('create.today') },
                          { value: isoOf(tomorrow), label: t('create.tomorrow') },
                        ],
                        value: date,
                        onPick: setDate,
                      })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DisplayField
                    label={t('create.readyTime')}
                    value={time}
                    onPress={() =>
                      setPicker({
                        title: t('create.readyTime'),
                        options: PICKUP_TIMES.map((slot) => ({ value: slot, label: slot })),
                        value: time,
                        onPick: setTime,
                      })
                    }
                  />
                </View>
              </View>
            )}

            <SectionLabel style={{ marginTop: 6 }}>{t('create.contactSection')}</SectionLabel>
            <FloatingField
              label={t('create.phone')}
              value={phone}
              testID="field-phone"
              onChangeText={(v) => {
                setPhone(v);
                setField('phone', v.replace(/\D/g, '').length >= 9);
              }}
              error={errors.phone}
              keyboardType="phone-pad"
            />
            <Text style={styles.cap}>{t('create.phoneHint')}</Text>

            <FloatingField label={t('create.notes')} value={notes} onChangeText={setNotes} multiline />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.form}>
            <SectionLabel>{t('create.reviewSection')}</SectionLabel>
            <View style={styles.review}>
              {reviewRows.map(([label, value]) => (
                <View key={label} style={styles.reviewRow}>
                  <Text style={styles.reviewDt}>{label}</Text>
                  <Text style={styles.reviewDd}>{value}</Text>
                </View>
              ))}
              <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.reviewDt}>{t('create.reviewPrice')}</Text>
                <Text style={styles.reviewPrice}>
                  {formatCurrencyAmount(Number(price) || 0, currency)} {currency}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => goStep(1)} style={styles.editBtn} accessibilityRole="button">
              <Icon name="back" size={16} color={colors.ink2} strokeWidth={2} />
              <Text style={styles.editText}>{t('create.edit')}</Text>
            </Pressable>
            <Text style={styles.cap}>{t('create.moderationNote')}</Text>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.success}>
            <View style={styles.successIco}>
              <Icon name="check" size={38} color={colors.green} strokeWidth={2} />
            </View>
            <Text style={styles.successTitle}>{t('create.successTitle')}</Text>
            <Text style={styles.successText}>{t('create.successText')}</Text>
            <View style={styles.idChip}>
              <Text style={styles.idChipText}>{publishedId}</Text>
            </View>
            <Button label={t('create.backToLoads')} onPress={onDone} block style={{ marginTop: 12 }} />
          </View>
        ) : null}
      </ScrollView>

      {step < 4 ? (
        <View style={[styles.foot, { paddingBottom: 12 + insets.bottom }]}>
          {step > 1 ? (
            <Button label={t('create.back')} variant="ghost" onPress={() => goStep(step - 1)} />
          ) : null}
          <Button
            label={step === 3 ? t('create.publish') : t('create.continue')}
            onPress={handleNext}
            style={{ flex: 1 }}
            testID="create-next"
          />
        </View>
      ) : null}

      <PickerSheet picker={picker} onClose={() => setPicker(null)} bottomInset={insets.bottom} />
    </KeyboardAvoidingView>
  );
}

function PickerSheet({
  picker,
  onClose,
  bottomInset,
}: {
  picker: PickerState;
  onClose: () => void;
  bottomInset: number;
}) {
  return (
    <Modal visible={!!picker} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.pickerRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.pickerSheet, { paddingBottom: 18 + bottomInset }]}>
          <View style={styles.pickerGrab} />
          <Text style={styles.pickerTitle}>{picker?.title}</Text>
          {(picker?.options || []).map((opt) => {
            const on = picker?.value === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  picker?.onPick(opt.value);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.pickerRow,
                  on && { backgroundColor: colors.navySoft },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.pickerOption, on && { color: colors.navy, fontFamily: font.bold }]}>
                  {opt.label}
                </Text>
                {on ? <Icon name="check" size={18} color={colors.navy} strokeWidth={2} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
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
    paddingBottom: 6,
  },
  title: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
    lineHeight: 23,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#dbe1e8',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  form: {
    gap: 14,
  },
  minimap: {
    height: 152,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
    backgroundColor: colors.mapBg,
  },
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -30,
  },
  cap: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  twocol: {
    flexDirection: 'row',
    gap: 10,
  },
  switchrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  readyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.greenBg,
  },
  readyIco: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    fontSize: 15,
    fontFamily: font.bold,
    color: colors.ink,
  },
  readySub: {
    fontSize: 12,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  switchTitle: {
    fontSize: 15,
    fontFamily: font.bold,
    color: colors.ink,
    lineHeight: 20,
  },
  switchSub: {
    fontSize: 12,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  switch: {
    width: 52,
    height: 32,
    borderRadius: 99,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    ...shadow.card,
  },
  upload: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 13,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#b8c4d3',
    backgroundColor: colors.surface2,
  },
  uIco: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadStrong: {
    fontSize: 14.5,
    fontFamily: font.bold,
    color: colors.navy,
  },
  uploadSpan: {
    fontSize: 12,
    fontFamily: font.medium,
    color: colors.ink3,
  },
  thumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  thumb: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
  },
  review: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f5',
  },
  reviewDt: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  reviewDd: {
    fontSize: 14,
    fontFamily: font.semibold,
    color: colors.ink,
    textAlign: 'right',
    flexShrink: 1,
  },
  reviewPrice: {
    fontSize: 17,
    fontFamily: font.extrabold,
    color: colors.navy,
    fontVariant: ['tabular-nums'],
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  editText: {
    fontSize: 14,
    fontFamily: font.semibold,
    color: colors.ink2,
  },
  success: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 8,
    gap: 8,
  },
  successIco: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 23,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  successText: {
    fontSize: 14.5,
    fontFamily: font.regular,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  idChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: colors.navySoft,
  },
  idChipText: {
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: 1,
    color: colors.navy,
  },
  foot: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  pickerRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 20,
    ...shadow.sheet,
  },
  pickerGrab: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#d6dce4',
    alignSelf: 'center',
    marginBottom: 14,
  },
  pickerTitle: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOption: {
    fontSize: 15,
    fontFamily: font.medium,
    color: colors.ink,
  },
});
