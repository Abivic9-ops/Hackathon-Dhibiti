import { useState } from 'react';
import { router } from 'expo-router';
import { Landmark, UsersRound } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { ActionBar, PrimaryButton } from '@/components/ui/Button';
import { OptionRow, PrivacyNote, TextField } from '@/components/ui/Field';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';

/** Create a group circle for a chama or SACCO. */
export default function NewGroup() {
  const createGroup = useStore((state) => state.createGroup);

  const [name, setName] = useState('');
  const [kind, setKind] = useState<'chama' | 'sacco'>('chama');

  const canCreate = name.trim().length > 2;

  return (
    <Screen>
      <ScreenHeader
        title="New group circle"
        subtitle="For a chama or SACCO"
        backFallback="/groups"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenScroll contentClassName="px-5 gap-4">
          <TextField
            label="Group name"
            value={name}
            onChangeText={setName}
            placeholder="Umoja Women Chama"
            autoCapitalize="words"
            helper="Use the name members already know, so a warning from Dhibiti is recognised."
          />

          <View className="gap-3">
            <Text variant="section">What kind of group is it?</Text>
            <OptionRow
              icon={UsersRound}
              title="Chama"
              description="An informal savings or merry-go-round group collecting contributions between members"
              selected={kind === 'chama'}
              onPress={() => setKind('chama')}
            />
            <OptionRow
              icon={Landmark}
              title="SACCO"
              description="A registered savings and credit society with officials and member accounts"
              selected={kind === 'sacco'}
              onPress={() => setKind('sacco')}
            />
          </View>

          <PrivacyNote>
            A group circle carries warnings only. Dhibiti never sees contributions, member balances
            or the group account, and members never see each other&apos;s payments.
          </PrivacyNote>
        </ScreenScroll>

        <ActionBar>
          <PrimaryButton
            label="Create group circle"
            disabled={!canCreate}
            onPress={() => {
              const groupId = createGroup({ name: name.trim(), kind });
              router.replace({ pathname: '/groups/[id]', params: { id: groupId } });
            }}
          />
        </ActionBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
