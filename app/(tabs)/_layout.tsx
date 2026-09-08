import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import {
  House,
  LayoutGrid,
  type LucideIcon,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react-native';
import { type ColorValue, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useMotionOk } from '@/components/ui/Motion';
import { colors, useTheme } from '@/lib/theme';

/**
 * Tab icon that springs up and lights a soft pill behind itself when its tab
 * becomes active. Purely decorative — the icon and label stay readable and
 * tappable at every moment of the animation.
 */
function TabIcon({
  icon: Icon,
  color,
  size,
  focused,
}: {
  icon: LucideIcon;
  color: ColorValue;
  size: number;
  focused: boolean;
}) {
  const motionOk = useMotionOk();
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (!motionOk) {
      // oxlint-disable-next-line react/immutability
      active.value = focused ? 1 : 0;
      return undefined;
    }
    // oxlint-disable-next-line react/immutability
    active.value = withSpring(focused ? 1 : 0, { damping: 12, stiffness: 220 });
    return () => cancelAnimation(active);
  }, [active, focused, motionOk]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + active.value * 0.14 }, { translateY: -active.value * 2 }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: active.value * 0.16,
    transform: [{ scale: 0.7 + active.value * 0.3 }],
  }));

  return (
    <View className="h-9 w-14 items-center justify-center">
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 18,
            backgroundColor: colors.brandMint,
          },
          pillStyle,
        ]}
      />
      <Animated.View style={iconStyle}>
        <Icon color={color} size={size} strokeWidth={focused ? 2.2 : 1.9} />
      </Animated.View>
    </View>
  );
}

/**
 * Five tabs, in the fixed order Home · Shield · Pay · Family · More.
 * Flow and detail screens live on the root stack so cross-tab gateways
 * (Shield verdict → Pay, Family alert → verdict) never duplicate a screen.
 */
export default function TabsLayout() {
  // Re-render on theme change so the hex backdrops and tints track the palette.
  useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.ink },
        tabBarActiveTintColor: colors.brandMint,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: 'Poppins_500Medium', fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.inkRaised,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0,
          height: 84,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={House} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shield"
        options={{
          title: 'Shield',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={ShieldCheck} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: 'Pay',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Wallet} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Users} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={LayoutGrid} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
