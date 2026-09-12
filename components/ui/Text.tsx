import { Children, type ReactNode } from 'react';
import { Text as RNText, type TextProps } from 'react-native';

import { translate, type Language } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/**
 * Poppins-only type scale. Hierarchy comes from size, never from heavy weights:
 * Regular (400) and Medium (500) carry almost everything, SemiBold (600) is
 * reserved for the largest numerals and verdict words.
 */
export type TextVariant =
  | 'display'
  | 'numeral'
  | 'title'
  | 'heading'
  | 'section'
  | 'label'
  | 'body'
  | 'caption'
  | 'meta';

const VARIANTS: Record<TextVariant, string> = {
  display: 'font-poppins-semibold text-[34px] leading-[42px] text-foreground',
  numeral: 'font-poppins-semibold text-[27px] leading-[34px] text-foreground',
  title: 'font-poppins-medium text-[21px] leading-7 text-foreground',
  heading: 'font-poppins-medium text-[17px] leading-6 text-foreground',
  section: 'font-poppins-medium text-[12px] uppercase tracking-[1.4px] text-muted',
  label: 'font-poppins-medium text-[15px] leading-5 text-foreground',
  body: 'font-poppins text-[15px] leading-[23px] text-foreground',
  caption: 'font-poppins text-[13px] leading-[19px] text-muted',
  meta: 'font-poppins text-[12px] leading-[17px] text-muted',
};

type Props = TextProps & {
  variant?: TextVariant;
  children?: React.ReactNode;
  /** Quoted scam text, names and numbers are shown exactly as received. */
  verbatim?: boolean;
};

/**
 * Translate authored copy at the render boundary. A run of plain strings and
 * numbers is joined first, so a sentence carrying a count still matches a
 * dictionary entry; anything unknown stays in English.
 */
function localise(children: ReactNode, language: Language): ReactNode {
  if (language === 'en') return children;
  if (typeof children === 'string') return translate(children, language);

  const items = Children.toArray(children);
  if (items.length === 0) return children;

  const plain = items.every((item) => typeof item === 'string' || typeof item === 'number');
  if (plain) {
    return translate(items.map((item) => String(item)).join(''), language);
  }

  return items.map((item) => {
    if (typeof item === 'string') return translate(item, language);
    return item;
  });
}

const HEADING_VARIANTS: ReadonlySet<TextVariant> = new Set(['display', 'title', 'heading']);

export function Text({ variant = 'body', className, verbatim, children, ...rest }: Props) {
  const language = useStore((state) => state.language);
  const content = verbatim ? children : localise(children, language);

  return (
    <RNText
      className={cn(VARIANTS[variant], className)}
      accessibilityRole={HEADING_VARIANTS.has(variant) ? 'header' : undefined}
      {...rest}
    >
      {content}
    </RNText>
  );
}

/**
 * Translate a string outside a `Text` child — placeholders and accessibility
 * labels, where the value is a prop rather than rendered content.
 */
export function useTranslate(): (text: string) => string {
  const language = useStore((state) => state.language);
  return (text: string) => translate(text, language);
}
