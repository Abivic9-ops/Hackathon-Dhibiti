import { Pressable } from 'react-native';
import { createAnimatedComponent } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

// Pressable that accepts Reanimated styles *and* Uniwind className, so press
// and hover feedback can animate the same surface that carries the styling.
export const AnimatedPressable = withUniwind(createAnimatedComponent(Pressable));
