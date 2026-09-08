import { useState } from 'react';
import { router } from 'expo-router';
import { Contact, Link2, Send, ShieldCheck, UserPlus, Users } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ActionBar, GhostButton, PrimaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PermissionDeniedState } from '@/components/ui/Feedback';
import { OptionRow, PrivacyNote, TextField } from '@/components/ui/Field';
import { IconTile } from '@/components/ui/IconTile';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * Family invite: consent-first. The invited person installs Dhibiti and agrees
 * before any alert is shared in either direction.
 */
export default function FamilyInvite() {
  const inviteFamilyMember = useStore((state) => state.inviteFamilyMember);
  const permissions = useStore((state) => state.permissions);
  const setPermission = useStore((state) => state.setPermission);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'protected' | 'admin'>('protected');
  const [sent, setSent] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const canSend = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 9;
  const contactsDenied = permissions.contacts === 'denied';

  return (
    <Screen>
      <ScreenHeader
        title="Invite to your circle"
        subtitle="Both sides have to agree"
        backFallback="/(tabs)/family"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <Card className="gap-3">
            <IconTile icon={UserPlus} color={colors.brandTeal} />
            <Text variant="body">
              We send a link by SMS. Nothing is shared until they install Dhibiti and choose what
              they are comfortable sharing.
            </Text>
          </Card>

          <View className="gap-3">
            <Text variant="section">What is their role?</Text>
            <OptionRow
              icon={Users}
              title="Protected member"
              description="I want to look out for them — I get alerts when something high risk is flagged"
              selected={role === 'protected'}
              onPress={() => setRole('protected')}
            />
            <OptionRow
              icon={ShieldCheck}
              title="Family admin"
              description="They look out for me — they get the alerts I choose to share"
              selected={role === 'admin'}
              onPress={() => setRole('admin')}
            />
          </View>

          <TextField
            label="Their name"
            value={name}
            onChangeText={setName}
            placeholder="Mary Wanjiru"
            autoCapitalize="words"
          />

          <TextField
            label="Their phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="712 345 678"
            prefix="+254"
            keyboardType="phone-pad"
            helper="Use the number they already use for M-Pesa so alerts reach the right person."
          />

          {contactsDenied ? (
            <PermissionDeniedState
              icon={Contact}
              title="Contacts are turned off"
              body="You can still invite people by typing their number. Turning contacts on only makes picking a relative faster."
              enableLabel="Turn contacts on"
              onEnable={() => setPermission('contacts', 'granted')}
            />
          ) : (
            <GhostButton
              label="Pick from contacts instead"
              icon={Contact}
              onPress={() => {
                if (permissions.contacts !== 'granted') setPermission('contacts', 'granted');
                setShowContacts(true);
              }}
            />
          )}

          <PrivacyNote>
            Dhibiti shares specific high-risk events only — never a feed of messages, calls or
            payments. Each person controls what leaves their own phone, and can change it any time.
          </PrivacyNote>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Send invite"
            icon={Send}
            disabled={!canSend}
            onPress={() => {
              inviteFamilyMember({ name: name.trim(), phone: phone.trim(), role });
              setSent(true);
            }}
          />
          <GhostButton
            label="Share an invite link"
            icon={Link2}
            onPress={() => {
              inviteFamilyMember({
                name: name.trim() || 'Invited by link',
                phone: phone.trim() || '+254700000000',
                role,
              });
              setSent(true);
            }}
          />
        </ActionBar>
      </KeyboardAvoidingView>

      <Sheet
        visible={sent}
        onClose={() => setSent(false)}
        icon={Send}
        title="Invite sent"
        body="They will show as pending until they install Dhibiti and accept. You can change what is shared at any time from their member page."
        primaryLabel="Back to Family"
        onPrimary={() => {
          setSent(false);
          router.replace('/(tabs)/family');
        }}
        secondaryLabel="Read the family guide"
        onSecondary={() => {
          setSent(false);
          router.replace('/family/guide');
        }}
      />

      <Sheet
        visible={showContacts}
        onClose={() => setShowContacts(false)}
        icon={Contact}
        title="Contacts on this device"
        body="In this build the contact list is mocked. Tap a name to fill in the invite."
        secondaryLabel="Close"
      >
        <View className="gap-2.5">
          {[
            { name: 'Mary Wanjiru', phone: '722 114 455' },
            { name: 'Joseph Otieno', phone: '733 220 087' },
            { name: 'Grace Kilonzo', phone: '720 445 566' },
          ].map((contact) => (
            <GhostButton
              key={contact.phone}
              label={`${contact.name} · ${contact.phone}`}
              onPress={() => {
                setName(contact.name);
                setPhone(contact.phone);
                setShowContacts(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}
