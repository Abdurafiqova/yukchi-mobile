import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError, normalizeUzPhone, requestOtp, verifyOtp } from '../api';
import { useAuth } from '../auth';
import { Icon } from '../components/Icon';
import { Button, Chip } from '../components/ui';
import { VEHICLES } from '../data';
import { LOCALES, LOCALE_CODES, useI18n } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';
import type { VehicleType } from '../types';

type Step = 'phone' | 'code' | 'vehicle';

const STEP_INDEX: Record<Step, number> = { phone: 1, code: 2, vehicle: 3 };

function formatLocal(digits: string): string {
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return `+998 ${parts.join(' ')}`.trim();
}

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale, vehicleLabel } = useI18n();
  const { session, signIn, saveVehicle } = useAuth();

  const [step, setStep] = useState<Step>(session ? 'vehicle' : 'phone');
  const [phoneDigits, setPhoneDigits] = useState(
    session ? session.user.phone.replace(/\D/g, '').slice(-9) : '',
  );
  const [name, setName] = useState(session?.user.fullName ?? '');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>('TENT');
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phone = normalizeUzPhone(phoneDigits);

  const errorMessage = (err: unknown, kind: 'send' | 'verify'): string => {
    if (err instanceof ApiError) {
      if (err.status === 0) return t('onboarding.errNetwork');
      if (err.status === 429) {
        return t('onboarding.errTooMany', { seconds: err.retryAfter ?? 60 });
      }
      if (kind === 'verify') return t('onboarding.errWrongCode');
    }
    return t('onboarding.errGeneric');
  };

  const updatePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setPhoneDigits((digits.startsWith('998') ? digits.slice(3) : digits).slice(0, 9));
  };

  const sendCode = async () => {
    if (!phone) {
      setError(t('onboarding.errPhone'));
      return;
    }
    if (name.trim().length < 2) {
      setError(t('onboarding.errName'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await requestOtp(phone);
      setDevCode(res.devCode ?? null);
      setCode('');
      setStep('code');
    } catch (err) {
      setError(errorMessage(err, 'send'));
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError(t('onboarding.errCode'));
      return;
    }
    if (!phone) {
      setStep('phone');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await verifyOtp(phone, code, name);
      await signIn(res);
      setCode('');
      setStep('vehicle');
    } catch (err) {
      setError(errorMessage(err, 'verify'));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (plate.trim().length < 4) {
      setError(t('onboarding.errPlate'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveVehicle({
        type: vehicleType,
        plate: plate.trim().toUpperCase(),
        weight: Math.max(1, Math.round(Number(capacity.replace(',', '.')) || 20)),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError(t('onboarding.errNetwork'));
      } else if (err instanceof ApiError && err.status === 409) {
        setError(t('onboarding.errPlateTaken'));
      } else {
        setError(t('onboarding.errGeneric'));
      }
    } finally {
      setBusy(false);
    }
  };

  const stepNumber = STEP_INDEX[step];

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandline}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>Y</Text>
              </View>
              <View>
                <Text style={styles.brandName}>YUKCHI.UZ</Text>
                <Text style={styles.brandRole}>{t('onboarding.driver').toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.langRow}>
              {LOCALES.map((code) => {
                const active = code === locale;
                return (
                  <Pressable
                    key={code}
                    onPress={() => setLocale(code)}
                    testID={`lang-${code}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.langPill, active && styles.langPillActive]}
                  >
                    <Text style={[styles.langText, active && styles.langTextActive]}>
                      {LOCALE_CODES[code]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.progress}>
            <View style={styles.progressTrack}>
              {[1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[styles.progressBar, index <= stepNumber && styles.progressBarOn]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>
              {t('onboarding.step', { current: stepNumber, total: 3 })}
            </Text>
          </View>

          <View style={styles.card}>
            {step === 'phone' ? (
              <>
                <Text style={styles.title}>{t('onboarding.phoneTitle')}</Text>
                <Text style={styles.sub}>{t('onboarding.phoneSub')}</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('onboarding.phoneLabel')}</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.prefix}>+998</Text>
                    <TextInput
                      testID="onboarding-phone"
                      value={phoneDigits}
                      onChangeText={updatePhone}
                      placeholder="90 123 45 67"
                      placeholderTextColor="#8b98a8"
                      keyboardType="number-pad"
                      style={styles.input}
                      autoComplete="tel"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('onboarding.nameLabel')}</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      testID="onboarding-name"
                      value={name}
                      onChangeText={setName}
                      placeholder={t('onboarding.namePlaceholder')}
                      placeholderTextColor="#8b98a8"
                      autoCapitalize="words"
                      style={styles.input}
                    />
                  </View>
                  <Text style={styles.hint}>{t('onboarding.nameHint')}</Text>
                </View>

                <ErrorNote message={error} />
                <Button
                  label={busy ? t('onboarding.sending') : t('onboarding.sendCode')}
                  onPress={sendCode}
                  disabled={busy}
                  block
                  style={styles.cta}
                  testID="onboarding-send"
                />
              </>
            ) : null}

            {step === 'code' ? (
              <>
                <Pressable
                  style={styles.backLink}
                  onPress={() => {
                    setError(null);
                    setStep('phone');
                  }}
                  testID="onboarding-change-phone"
                >
                  <Icon name="back" size={16} color={colors.navy} strokeWidth={2} />
                  <Text style={styles.backText}>{t('onboarding.changePhone')}</Text>
                </Pressable>

                <Text style={styles.title}>{t('onboarding.codeTitle')}</Text>
                <Text style={styles.sub}>{t('onboarding.codeSub', { phone: formatLocal(phoneDigits) })}</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('onboarding.codeLabel')}</Text>
                  <View style={[styles.inputRow, styles.codeRow]}>
                    <TextInput
                      testID="onboarding-code"
                      value={code}
                      onChangeText={(raw) => setCode(raw.replace(/\D/g, '').slice(0, 6))}
                      placeholder={t('onboarding.codePlaceholder')}
                      placeholderTextColor="#9aa6b6"
                      keyboardType="number-pad"
                      maxLength={6}
                      style={[styles.input, styles.codeInput]}
                      autoComplete="one-time-code"
                    />
                  </View>
                </View>

                {devCode ? (
                  <View style={styles.demoCard}>
                    <Text style={styles.demoText}>{t('onboarding.demoCode', { code: devCode })}</Text>
                    <Pressable
                      onPress={() => setCode(devCode)}
                      accessibilityRole="button"
                      style={styles.demoBtn}
                      testID="onboarding-demo-fill"
                    >
                      <Text style={styles.demoBtnText}>{t('onboarding.demoFill')}</Text>
                    </Pressable>
                  </View>
                ) : null}

                <ErrorNote message={error} />
                <Button
                  label={busy ? t('onboarding.verifying') : t('onboarding.verify')}
                  onPress={confirmCode}
                  disabled={busy}
                  block
                  style={styles.cta}
                  testID="onboarding-verify"
                />
              </>
            ) : null}

            {step === 'vehicle' ? (
              <>
                <Text style={styles.title}>{t('onboarding.vehicleTitle')}</Text>
                <Text style={styles.sub}>{t('onboarding.vehicleSub')}</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('onboarding.vehicleType')}</Text>
                  <View style={styles.chipWrap}>
                    {VEHICLES.map((item) => (
                      <Chip
                        key={item}
                        label={vehicleLabel(item)}
                        active={vehicleType === item}
                        onPress={() => setVehicleType(item)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('onboarding.plateLabel')}</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      testID="onboarding-plate"
                      value={plate}
                      onChangeText={setPlate}
                      placeholder={t('onboarding.platePlaceholder')}
                      placeholderTextColor="#8b98a8"
                      autoCapitalize="characters"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('onboarding.capacityLabel')}</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      testID="onboarding-capacity"
                      value={capacity}
                      onChangeText={(raw) => setCapacity(raw.replace(/[^\d.,]/g, '').slice(0, 4))}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                    <Text style={styles.suffix}>{t('onboarding.capacityUnit')}</Text>
                  </View>
                </View>

                <ErrorNote message={error} />
                <Button
                  label={busy ? t('onboarding.starting') : t('onboarding.start')}
                  onPress={finish}
                  disabled={busy}
                  block
                  style={styles.cta}
                  testID="onboarding-start"
                />
              </>
            ) : null}
          </View>

          <View style={styles.advantages}>
            <Text style={styles.advTitle}>{t('onboarding.advantagesTitle')}</Text>
            {[t('onboarding.adv1'), t('onboarding.adv2'), t('onboarding.adv3'), t('onboarding.adv4')].map(
              (text) => (
                <View key={text} style={styles.advRow}>
                  <View style={styles.advIco}>
                    <Icon name="check" size={13} color={colors.green} strokeWidth={2.6} />
                  </View>
                  <Text style={styles.advText}>{text}</Text>
                </View>
              ),
            )}
          </View>

          <View style={styles.footnote}>
            <Icon name="pin" size={14} color={colors.ink3} />
            <Text style={styles.footnoteText}>{t('feed.nearbyHint')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox} accessibilityRole="alert">
      <Icon name="alert" size={16} color={colors.red} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 18,
  },
  brandline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
  },
  brandName: {
    fontSize: 11,
    fontFamily: font.bold,
    letterSpacing: 1.2,
    color: colors.ink3,
  },
  brandRole: {
    fontSize: 13,
    fontFamily: font.bold,
    letterSpacing: 0.6,
    color: colors.navy,
  },
  langRow: {
    flexDirection: 'row',
    gap: 6,
  },
  langPill: {
    minWidth: 38,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  langText: {
    fontSize: 11.5,
    fontFamily: font.bold,
    color: colors.ink3,
  },
  langTextActive: {
    color: '#fff',
  },
  progress: {
    gap: 8,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  progressBar: {
    flex: 1,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#dfe4ea',
  },
  progressBarOn: {
    backgroundColor: colors.orange,
  },
  progressText: {
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 18,
    gap: 14,
    ...shadow.card,
  },
  title: {
    fontSize: 23,
    fontFamily: font.extrabold,
    letterSpacing: -0.6,
    lineHeight: 28,
    color: colors.ink,
  },
  sub: {
    fontSize: 14.5,
    fontFamily: font.regular,
    lineHeight: 21,
    color: colors.ink3,
    marginTop: -6,
  },
  field: {
    gap: 7,
  },
  label: {
    fontSize: 12,
    fontFamily: font.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.ink3,
  },
  inputRow: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefix: {
    fontSize: 16,
    fontFamily: font.bold,
    color: colors.navy,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 50,
    fontSize: 17,
    fontFamily: font.medium,
    color: colors.ink,
    outlineStyle: 'none',
  } as object,
  codeRow: {
    borderColor: colors.navyLine,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 26,
    fontFamily: font.extrabold,
    letterSpacing: 8,
  },
  suffix: {
    fontSize: 14,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
  hint: {
    fontSize: 12.5,
    fontFamily: font.regular,
    color: colors.ink3,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: colors.navy,
  },
  demoCard: {
    backgroundColor: colors.orangeSoft,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  demoText: {
    fontSize: 13.5,
    fontFamily: font.semibold,
    color: colors.orangeDeep,
  },
  demoBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#f2c49a',
  },
  demoBtnText: {
    fontSize: 12.5,
    fontFamily: font.bold,
    color: colors.orangeDeep,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.redBg,
    borderRadius: 10,
    padding: 11,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: font.medium,
    color: colors.red,
    lineHeight: 18,
  },
  cta: {
    minHeight: 52,
    marginTop: 2,
  },
  advantages: {
    gap: 9,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  advTitle: {
    fontSize: 14,
    fontFamily: font.extrabold,
    letterSpacing: -0.2,
    color: colors.navy,
    marginBottom: 2,
  },
  advRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  advIco: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advText: {
    flex: 1,
    fontSize: 13,
    fontFamily: font.medium,
    color: colors.ink2,
    lineHeight: 18,
  },
  footnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footnoteText: {
    fontSize: 12.5,
    fontFamily: font.semibold,
    color: colors.ink3,
  },
});
