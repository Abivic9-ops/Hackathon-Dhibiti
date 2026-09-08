import { Moon, Sun } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { PopIn } from '@/components/ui/Motion';
import { useStore } from '@/lib/store';
import { colors, useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * Dark / light mode switch. Sits in the top-right headers, next to the
 * notification bell. Shows the mode you would switch *to* (sun in dark mode),
 * so the affordance always reads as an action. The theme is persisted in the
 * store; `setThemeMode` + Uniwind's theme sync happen there and in the root
 * layout, so the whole palette flips in place.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const setTheme = useStore((state) => state.setTheme);
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Changes the app's appearance between dark and light"
      onPress={() => setTheme(isDark ? 'light' : 'dark')}
      hitSlop={8}
      className={cn(
        'bg-surface-secondary h-11 w-11 items-center justify-center rounded-full active:opacity-70',
        className,
      )}
    >
      <PopIn key={theme} from={0.6}>
        {isDark ? (
          <Sun color={colors.foreground} size={19} strokeWidth={1.9} />
        ) : (
          <Moon color={colors.foreground} size={19} strokeWidth={1.9} />
        )}
      </PopIn>
    </Pressable>
  );
}
