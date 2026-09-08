import { router } from 'expo-router';
import { BadgeCheck, Contact, PhoneCall, UserPlus } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { GhostButton, InlineAction, PrimaryButton } from '@/components/ui/Button';
import { ActionBar } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { IconTile } from '@/components/ui/IconTile';
import { RiskPill } from '@/components/ui/Risk';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

const dial = (phone: string) => void Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);

/** Trusted contacts: the people Dhibiti tells you to call instead of a caller ID. */
export default function TrustedContactsScreen() {
  const contacts = useStore((state) => state.contacts);
  const permissions = useStore((state) => state.permissions);

  return (
    <Screen>
      <ScreenHeader
        title="Trusted contacts"
        subtitle={`${contacts.length} saved`}
        backFallback="/more"
      />

      <ScreenScroll contentClassName="gap-4">
        <View className="px-5">
          <Card className="gap-2">
            <IconTile icon={Contact} color={colors.brandBlue} />
            <Text variant="label">Caller ID can be faked. A saved number cannot.</Text>
            <Text variant="caption">
              When a message or call claims to be from someone on this list, Dhibiti offers to call
              the number you saved — never the number that contacted you.
            </Text>
          </Card>
        </View>

        {permissions.contacts !== 'granted' ? (
          <View className="px-5">
            <Card className="gap-2">
              <Text variant="label">Contacts access is off</Text>
              <Text variant="caption">
                That is fine — you can add people by typing their number in yourself. Nothing is
                uploaded either way.
              </Text>
              <InlineAction
                label="Change permissions"
                onPress={() => router.push('/more/permissions')}
              />
            </Card>
          </View>
        ) : null}

        {contacts.length > 0 ? (
          <View>
            <SectionLabel label="Your people" />
            <View className="gap-3 px-5">
              {contacts.map((contact) => (
                <Card key={contact.id} className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <IconTile
                      icon={contact.verified ? BadgeCheck : Contact}
                      color={contact.verified ? colors.brandTeal : colors.riskGrey}
                    />
                    <View className="flex-1 gap-1">
                      <Text variant="label" numberOfLines={1}>
                        {contact.name}
                      </Text>
                      <Text variant="meta">
                        {contact.relationship} · {contact.phone}
                      </Text>
                    </View>
                    <RiskPill
                      level={contact.verified ? 'blue' : 'grey'}
                      label={contact.verified ? 'Confirmed' : 'Not confirmed'}
                      size="sm"
                    />
                  </View>
                  {!contact.verified ? (
                    <Text variant="caption">
                      You have not confirmed this number by speaking to them yet. Call once on a
                      quiet day, so it is already checked when it matters.
                    </Text>
                  ) : null}
                  <GhostButton
                    label={`Call ${contact.name.split(' ')[0]}`}
                    icon={PhoneCall}
                    onPress={() => dial(contact.phone)}
                  />
                </Card>
              ))}
            </View>
          </View>
        ) : (
          <EmptyState
            icon={UserPlus}
            title="No trusted contacts yet"
            body="Add the people you would call before sending money — a parent, a partner, your treasurer. Dhibiti will suggest calling them when a message claims to be from them."
            actionLabel="Add a trusted contact"
            onAction={() => router.push('/contacts/new')}
          />
        )}
      </ScreenScroll>

      {contacts.length > 0 ? (
        <ActionBar>
          <PrimaryButton
            label="Add a trusted contact"
            icon={UserPlus}
            onPress={() => router.push('/contacts/new')}
          />
        </ActionBar>
      ) : null}
    </Screen>
  );
}
