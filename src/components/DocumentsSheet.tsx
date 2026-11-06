import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ApiError,
  deleteVehicleDocument,
  listVehicleDocuments,
  uploadVehicleDocument,
  type VehicleDocumentsResult,
} from '../api';
import { useAuth } from '../auth';
import { useI18n, type MessageKey } from '../i18n/index';
import { colors, font, radius, shadow } from '../theme';
import type { DocumentStatus, VehicleDocumentType } from '../types';
import { Icon } from './Icon';
import { IconButton } from './ui';

const DOC_TYPES: { type: VehicleDocumentType; required: boolean; labelKey: MessageKey }[] = [
  { type: 'TECH_PASSPORT', required: true, labelKey: 'docs.type.techPassport' },
  { type: 'INSURANCE', required: true, labelKey: 'docs.type.insurance' },
  { type: 'TECH_INSPECTION', required: false, labelKey: 'docs.type.techInspection' },
  { type: 'PERMIT', required: false, labelKey: 'docs.type.permit' },
];

const STATUS_KEYS: Record<DocumentStatus, MessageKey> = {
  PENDING: 'docs.status.pending',
  APPROVED: 'docs.status.approved',
  REJECTED: 'docs.status.rejected',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  PENDING: colors.amber,
  APPROVED: colors.green,
  REJECTED: colors.red,
};

const MAX_DOCUMENT_SIZE = 8 * 1024 * 1024;

type Props = {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
  onSummary: (result: VehicleDocumentsResult | null) => void;
};

export function DocumentsSheet({ visible, onClose, showToast, onSummary }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetMaxHeight = Math.min(windowHeight * 0.88, 660);
  const listMaxHeight = Math.max(220, sheetMaxHeight - 140);
  const { t } = useI18n();
  const { session, vehicle } = useAuth();
  const vehicleId = vehicle?.id;
  const token = session?.accessToken;

  const [result, setResult] = useState<VehicleDocumentsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<VehicleDocumentType | 'delete' | null>(null);

  const reload = useCallback(async () => {
    if (!vehicleId || !token) {
      setResult(null);
      return;
    }

    setLoading(true);
    try {
      const next = await listVehicleDocuments(token, vehicleId);
      setResult(next);
      onSummary(next);
    } catch {
      // Keep the last known state; the upload actions surface their own errors.
    } finally {
      setLoading(false);
    }
  }, [onSummary, token, vehicleId]);

  useEffect(() => {
    if (visible) void reload();
  }, [visible, reload]);

  const describeError = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 0) return t('docs.errNetwork');
      if (error.status === 413) return t('docs.errSize');
      if (error.status === 400) return t('docs.errType');
    }
    return t('docs.errGeneric');
  };

  const pickAndUpload = async (type: VehicleDocumentType) => {
    if (!vehicleId || !token) {
      showToast(t('docs.vehicleMissing'));
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showToast(t('docs.permission'));
          return;
        }
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];

      if (asset.fileSize && asset.fileSize > MAX_DOCUMENT_SIZE) {
        showToast(t('docs.errSize'));
        return;
      }

      setBusy(type);

      const name = asset.fileName || `document-${Date.now()}.jpg`;
      const mime = asset.mimeType || 'image/jpeg';
      const form = new FormData();
      form.append('type', type);

      if (Platform.OS === 'web') {
        const blob = await (await fetch(asset.uri)).blob();
        form.append('file', blob, name);
      } else {
        form.append('file', { uri: asset.uri, name, type: mime } as unknown as Blob);
      }

      await uploadVehicleDocument(token, vehicleId, form);
      showToast(t('docs.uploaded', { name: t(typeKey(type)) }));
      await reload();
    } catch (error) {
      showToast(describeError(error));
    } finally {
      setBusy(null);
    }
  };

  const removeDocument = async (documentId: string) => {
    if (!vehicleId || !token) return;

    setBusy('delete');
    try {
      await deleteVehicleDocument(token, vehicleId, documentId);
      showToast(t('docs.deleted'));
      await reload();
    } catch (error) {
      showToast(describeError(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('common.closeA11y')}
        />
        <View
          testID="documents-sheet"
          style={[
            styles.sheet,
            { maxHeight: sheetMaxHeight, paddingBottom: 14 + insets.bottom },
          ]}
        >
          <View style={styles.grab} />
          <View style={styles.headRow}>
            <View style={styles.headText}>
              <Text style={styles.sheetTitle}>{t('docs.title')}</Text>
              <Text style={styles.sheetSub}>{t('docs.sub')}</Text>
            </View>
            <IconButton
              name="close"
              onPress={onClose}
              accessibilityLabel={t('common.closeA11y')}
            />
          </View>

          {!vehicleId ? (
            <Text style={styles.empty}>{t('docs.vehicleMissing')}</Text>
          ) : loading && !result ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.navy} />
            </View>
          ) : (
            <ScrollView
              testID="documents-list"
              style={[styles.list, { maxHeight: listMaxHeight }]}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {result && result.items.length > 0 ? (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: result.complete ? colors.greenBg : colors.amberBg,
                    },
                  ]}
                >
                  <Icon
                    name={result.complete ? 'check' : 'alert'}
                    size={16}
                    color={result.complete ? colors.green : colors.amber}
                  />
                  <Text
                    style={[
                      styles.bannerText,
                      { color: result.complete ? colors.green : colors.amber },
                    ]}
                  >
                    {t(result.complete ? 'docs.complete' : 'docs.incomplete')}
                  </Text>
                </View>
              ) : null}

              {DOC_TYPES.map((entry) => {
                const doc = result?.items.find((item) => item.type === entry.type);
                const uploading = busy === entry.type;
                const disabled = busy !== null;
                const statusColor = doc ? STATUS_COLORS[doc.status] : colors.ink3;

                return (
                  <View key={entry.type} style={styles.docCard}>
                    <View style={styles.docTop}>
                      <View style={styles.docTitleRow}>
                        <Text style={styles.docTitle}>{t(entry.labelKey)}</Text>
                        <Text
                          style={[
                            styles.badge,
                            entry.required ? styles.badgeRequired : styles.badgeOptional,
                          ]}
                        >
                          {t(entry.required ? 'docs.required' : 'docs.optional')}
                        </Text>
                      </View>
                      <Text style={[styles.status, { color: statusColor }]}>
                        {t(doc ? STATUS_KEYS[doc.status] : 'docs.status.empty')}
                      </Text>
                    </View>

                    {doc?.note ? (
                      <Text style={styles.note}>{t('docs.note', { note: doc.note })}</Text>
                    ) : null}

                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => void pickAndUpload(entry.type)}
                        disabled={disabled}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.primaryAction,
                          disabled && styles.actionDisabled,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        {uploading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Icon name="camera" size={15} color="#fff" />
                        )}
                        <Text style={styles.primaryActionText}>
                          {uploading
                            ? t('docs.loading')
                            : t(doc ? 'docs.replace' : 'docs.upload')}
                        </Text>
                      </Pressable>

                      {doc ? (
                        <Pressable
                          onPress={() => void removeDocument(doc.id)}
                          disabled={disabled}
                          accessibilityRole="button"
                          style={({ pressed }) => [
                            styles.ghostAction,
                            disabled && styles.actionDisabled,
                            pressed && { opacity: 0.75 },
                          ]}
                        >
                          <Text style={styles.ghostActionText}>{t('docs.delete')}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function typeKey(type: VehicleDocumentType): MessageKey {
  switch (type) {
    case 'TECH_PASSPORT':
      return 'docs.type.techPassport';
    case 'INSURANCE':
      return 'docs.type.insurance';
    case 'TECH_INSPECTION':
      return 'docs.type.techInspection';
    case 'PERMIT':
      return 'docs.type.permit';
  }
}

const styles = StyleSheet.create({
  sheetRoot: {
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
  headText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sheetTitle: {
    fontSize: 19,
    fontFamily: font.extrabold,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  sheetSub: {
    fontSize: 12.5,
    fontFamily: font.regular,
    color: colors.ink3,
    lineHeight: 17,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  empty: {
    fontSize: 13.5,
    fontFamily: font.regular,
    color: colors.ink3,
    paddingVertical: 24,
    textAlign: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 10,
    paddingBottom: 4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: font.semibold,
  },
  docCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
    backgroundColor: colors.surface2,
  },
  docTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  docTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  docTitle: {
    fontSize: 14.5,
    fontFamily: font.bold,
    color: colors.ink,
  },
  badge: {
    fontSize: 9.5,
    fontFamily: font.bold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeRequired: {
    color: colors.orangeDeep,
    backgroundColor: colors.orangeSoft,
  },
  badgeOptional: {
    color: colors.ink3,
    backgroundColor: '#eef1f5',
  },
  status: {
    fontSize: 12,
    fontFamily: font.bold,
  },
  note: {
    fontSize: 12,
    fontFamily: font.regular,
    color: colors.red,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.navy,
    borderRadius: radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  primaryActionText: {
    fontSize: 13,
    fontFamily: font.bold,
    color: '#fff',
  },
  ghostAction: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  ghostActionText: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: colors.ink2,
  },
  actionDisabled: {
    opacity: 0.55,
  },
});
