import { router } from 'expo-router';
import { CircleAlert, FileText, Flag, Mail, ShieldCheck, Users } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { GradientIconTile, IconTile } from '@/components/ui/IconTile';
import { NavRow } from '@/components/ui/rows';
import { Screen, ScreenHeader, ScreenScroll, SectionLabel } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

const HONEST_LIMITS: string[] = [
  'We cannot tell you a voice is AI-generated. Phone audio is compressed and that kind of detection is unreliable, so we look at what the caller asked you to do instead.',
  'We cannot see your WhatsApp messages before they reach you. WhatsApp is end-to-end encrypted. We warn you about a suspicious message once you share it with us.',
  '"No known risk found" is not "safe". A number can be unreported and still be used by a scammer today.',
  'We never block your one-time codes, and we never delete a message. Anything held for review sits in your quarantine inbox until you decide.',
];

/** About Dhibiti: mission, honest limits, contact and policies. */
export default function AboutScreen() {
  return (
    <Screen>
      <ScreenHeader title="About Dhibiti" backFallback="/more" />

      <ScreenScroll contentClassName="gap-4">
        <View className="px-5">
          <Card className="items-center gap-3">
            <GradientIconTile icon={ShieldCheck} size="lg" />
            <Text variant="title">Verify. Protect. Control.</Text>
            <Text variant="caption" className="text-center">
              Detect scams. Verify contacts. Protect your money and your family.
            </Text>
          </Card>
        </View>

        <View>
          <SectionLabel label="Why we exist" />
          <View className="px-5">
            <Card className="gap-2">
              <Text variant="body">
                Most scams do not succeed because the technology is clever. They succeed because
                someone is pushed to act fast, in secret, before they can check anything.
              </Text>
              <Text variant="body">
                Dhibiti puts verification back at the exact moment money is about to move: what the
                message really is, who is really contacting you, who you should call instead, and
                what you can do to stop the payment.
              </Text>
            </Card>
          </View>
        </View>

        <View>
          <SectionLabel label="What we do not claim" />
          <View className="gap-3 px-5">
            {HONEST_LIMITS.map((limit) => (
              <Card key={limit} className="flex-row gap-3">
                <IconTile icon={CircleAlert} color={colors.riskAmber} size="sm" />
                <Text variant="caption" className="flex-1">
                  {limit}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        <View>
          <SectionLabel label="Get in touch" />
          <View className="gap-3 px-5">
            <NavRow
              icon={Mail}
              title="Email support"
              description="msaada@dhibiti.co.ke · we reply in English or Kiswahili"
              onPress={() => void Linking.openURL('mailto:msaada@dhibiti.co.ke')}
            />
            <NavRow
              icon={Flag}
              title="Report abuse of Dhibiti"
              description="Someone using our name to ask for a PIN, a code or a payment"
              iconColor={colors.riskRed}
              onPress={() => void Linking.openURL('mailto:abuse@dhibiti.co.ke')}
            />
            <NavRow
              icon={Users}
              title="Report a scam you received"
              description="Adds to the community data that protects everyone else nearby"
              iconColor={colors.brandTeal}
              onPress={() => router.push('/report/new')}
            />
          </View>
        </View>

        <View>
          <SectionLabel label="Policies" />
          <View className="gap-3 px-5">
            <Card className="gap-2">
              <View className="flex-row items-center gap-3">
                <IconTile icon={FileText} color={colors.brandBlue} />
                <Text variant="label">Privacy in one paragraph</Text>
              </View>
              <Text variant="caption">
                Your messages, screenshots, checks and scan history stay on your device. If you
                submit a report we send the identifier and the scam pattern, with personal details
                removed first. Your family or group circle sees only the high-risk events at the
                sharing level you chose. We never ask for a PIN, a password or a full ID number, and
                there is nowhere in this app to enter one.
              </Text>
            </Card>
            <Card className="gap-2">
              <View className="flex-row items-center gap-3">
                <IconTile icon={FileText} color={colors.muted} />
                <Text variant="label">Terms in one paragraph</Text>
              </View>
              <Text variant="caption">
                Dhibiti is a verification assistant, not a guarantee and not a payment provider. We
                add a check before you use M-Pesa or your bank app; we never move money and we never
                replace those apps. Our verdicts are based on the evidence available at the time —
                treat them as strong guidance, and keep verifying anything unexpected.
              </Text>
            </Card>
          </View>
        </View>

        <View className="items-center gap-1 px-5 pt-2">
          <Text variant="meta">Dhibiti · Kenya · version 1.0</Text>
          <Text variant="meta">Built with community reports from people like you.</Text>
        </View>
      </ScreenScroll>
    </Screen>
  );
}
