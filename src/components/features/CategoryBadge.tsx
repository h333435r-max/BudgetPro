import { cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';
import type { Category } from '@/types';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function CategoryBadge({ category, size = 'md', showLabel = true }: CategoryBadgeProps) {
  const meta =
    (EXPENSE_CATEGORIES as Record<string, { label: string; emoji: string; bgColor: string; textColor: string }>)[category] ||
    (INCOME_CATEGORIES as Record<string, { label: string; emoji: string; bgColor: string; textColor: string }>)[category];

  if (!meta) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-2.5 py-1.5 gap-1.5',
    lg: 'text-sm px-3 py-2 gap-2',
  };

  const emojiSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-medium',
        meta.bgColor,
        meta.textColor,
        sizeClasses[size],
      )}
    >
      <span className={emojiSizes[size]}>{meta.emoji}</span>
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
