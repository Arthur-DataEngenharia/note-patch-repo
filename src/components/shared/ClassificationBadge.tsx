import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface Props {
  classificationId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function ClassificationBadge({ classificationId, size = 'md', className }: Props) {
  const classification = useAppStore((s) =>
    s.classifications.find((c) => c.id === classificationId)
  );

  if (!classification) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        className
      )}
      style={{
        color: classification.color,
        backgroundColor: `${classification.color}1F`,
        borderColor: `${classification.color}40`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: classification.color }}
      />
      {classification.name}
    </span>
  );
}
