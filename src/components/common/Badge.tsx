import clsx from 'clsx';
import { getCategoryLabel, getCategoryBgLight, getCategoryTextColor } from '../../data/seeds';
import { PlantCategory } from '../../types';

interface BadgeProps {
  category: PlantCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'badge border',
        getCategoryBgLight(category),
        getCategoryTextColor(category),
        className
      )}
    >
      {getCategoryLabel(category)}
    </span>
  );
}

interface FrostBadgeProps {
  tolerance: string;
  className?: string;
}

const frostColors: Record<string, string> = {
  'tender': 'bg-red-50 text-red-700 border-red-200',
  'half-hardy': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'hardy': 'bg-blue-50 text-blue-700 border-blue-200',
  'very-hardy': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const frostLabels: Record<string, string> = {
  'tender': 'Tender',
  'half-hardy': 'Half Hardy',
  'hardy': 'Hardy',
  'very-hardy': 'Very Hardy',
};

export function FrostBadge({ tolerance, className }: FrostBadgeProps) {
  return (
    <span
      className={clsx(
        'badge border',
        frostColors[tolerance] || 'bg-gray-50 text-gray-700 border-gray-200',
        className
      )}
    >
      {frostLabels[tolerance] || tolerance}
    </span>
  );
}

interface LightBadgeProps {
  light: string;
  className?: string;
}

const lightColors: Record<string, string> = {
  'full-sun': 'bg-amber-50 text-amber-700 border-amber-200',
  'partial-shade': 'bg-green-50 text-green-700 border-green-200',
  'shade': 'bg-gray-50 text-gray-600 border-gray-200',
  'full-sun-to-partial-shade': 'bg-lime-50 text-lime-700 border-lime-200',
};

const lightLabels: Record<string, string> = {
  'full-sun': '☀️ Full Sun',
  'partial-shade': '⛅ Part Shade',
  'shade': '🌫️ Shade',
  'full-sun-to-partial-shade': '🌤️ Sun/Part Shade',
};

export function LightBadge({ light, className }: LightBadgeProps) {
  return (
    <span
      className={clsx(
        'badge border',
        lightColors[light] || 'bg-gray-50 text-gray-600 border-gray-200',
        className
      )}
    >
      {lightLabels[light] || light}
    </span>
  );
}
