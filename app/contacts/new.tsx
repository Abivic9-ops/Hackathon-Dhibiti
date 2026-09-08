import { useState } from 'react';
import { BadgeCheck, UserPlus } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { CheckboxRow, PrivacyNote, TextField } from '@/components/ui/Field';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { goBackOrReplace } from '@/lib/navigation';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/** Add a trusted contact by hand — no contacts permission required. */
export default function NewTrustedContact() {
  const addTrustedContact = useStore((state) => state.addTrustedContact);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const canSave = name.trim().length > 1 && digits.length >= 9;

  const save = () => {
    addTrustedContact({
      name: name.trim(),
      relationship: relationship.trim().length > 0 ? relationship.trim() : 'Trusted contact',
      phone: `+254 ${digits.replace(/^0/, '')}`,
      verified: confirmed,
    });
    setSaved(true);
  };

  return (
    <Screen>
      <ScreenHeader title="Add a trusted contact" backFallback="/contacts" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <View className="gap-2 pb-1">
            <Text variant="title">Someone you would call first</Text>
            <Text variant="caption">
              When a message claims to be from this person, Dhibiti offers this saved number instead
              of the one that contacted you.
            </Text>
          </View>

          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Wanjiku Kamau"
            autoCapitalize="words"
          />
          <TextField
            label="Relationship"
            value={relationship}
            onChangeText={setRelationship}
            placeholder="Mother, brother, chama treasurer…"
            autoCapitalize="sentences"
          />
          <TextField
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="712 345 678"
            keyboardType="phone-pad"
            prefix="+254"
            helper="Type the number you already know is theirs, not one from a recent message."
          />

          <CheckboxRow
            label="I have spoken to them on this number and know it is really theirs"
            value={confirmed}
            onValueChange={setConfirmed}
          />

          <PrivacyNote>
            Trusted contacts stay on this device. We do not upload your contact list, and this
            person is not notified that you saved them.
          </PrivacyNote>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton label="Save contact" icon={UserPlus} disabled={!canSave} onPress={save} />
        </ActionBar>
      </KeyboardAvoidingView>

      <Sheet
        visible={saved}
        onClose={() => goBackOrReplace('/contacts')}
        icon={BadgeCheck}
        iconColor={colors.brandTeal}
        title={`${name.trim() || 'Contact'} saved`}
        body={
          confirmed
            ? 'Marked as confirmed. Dhibiti will offer this number whenever a message claims to be from them.'
            : 'Saved as not yet confirmed. Call them once on a quiet day so the number is already checked when it matters.'
        }
        primaryLabel="Done"
        onPrimary={() => goBackOrReplace('/contacts')}
      />
    </Screen>
  );
}
