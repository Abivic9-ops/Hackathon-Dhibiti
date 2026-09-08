import { useCallback } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';

import { useStore } from '@/lib/store';
import type { Check, RecommendedAction } from '@/lib/types';

/**
 * Maps a verdict's recommended action onto a concrete, safer next step.
 * Zone C must always lead somewhere — never a label with no destination.
 */
export function useRiskActions(options: {
  check?: Check;
  onFamilyShared?: () => void;
  onDismiss?: () => void;
}) {
  const { check, onFamilyShared, onDismiss } = options;
  const institutions = useStore((state) => state.institutions);
  const contacts = useStore((state) => state.contacts);
  const shareCheckWithFamily = useStore((state) => state.shareCheckWithFamily);

  return useCallback(
    (action: RecommendedAction) => {
      const payload = action.payload ?? '';

      switch (action.kind) {
        case 'call-verified': {
          const institution = institutions.find(
            (item) => item.id === payload || item.name === payload,
          );
          const number = institution?.officialNumbers[0];
          if (number) {
            void Linking.openURL(`tel:${number}`);
            return;
          }
          router.push('/institutions');
          return;
        }
        case 'call-contact': {
          const contact = contacts.find((item) => item.id === payload || item.name === payload);
          if (contact) {
            void Linking.openURL(`tel:${contact.phone}`);
            return;
          }
          router.push('/contacts');
          return;
        }
        case 'safe-pay':
          router.push({
            pathname: '/pay/verify',
            params: {
              identifier: payload || (check?.recipientIdentifier ?? ''),
              identifierType: check?.recipientIdentifierType ?? '',
              checkId: check?.id ?? '',
            },
          });
          return;
        case 'lookup':
          router.push({
            pathname: '/entity/[identifier]',
            params: { identifier: payload || (check?.recipientIdentifier ?? '') },
          });
          return;
        case 'report':
          router.push({
            pathname: '/report/new',
            params: {
              type: check?.type ?? 'sms',
              identifier: payload || (check?.recipientIdentifier ?? ''),
              content: check?.inputText ?? check?.inputSummary ?? '',
              scamCategory: check?.scamCategory ?? 'none',
            },
          });
          return;
        case 'lesson':
          router.push({
            pathname: '/lesson/[id]',
            params: { id: payload || (check?.relatedLessonId ?? 'lesson-reversal') },
          });
          return;
        case 'browser':
          router.push({
            pathname: '/browser',
            params: {
              url: payload || (check?.recipientIdentifier ?? ''),
              level: check?.riskLevel ?? 'grey',
              checkId: check?.id ?? '',
            },
          });
          return;
        case 'family':
          if (check) shareCheckWithFamily(check.id);
          onFamilyShared?.();
          return;
        case 'quarantine':
          router.push('/quarantine');
          return;
        case 'dismiss':
          onDismiss?.();
          return;
      }
    },
    [check, contacts, institutions, onDismiss, onFamilyShared, shareCheckWithFamily],
  );
}
