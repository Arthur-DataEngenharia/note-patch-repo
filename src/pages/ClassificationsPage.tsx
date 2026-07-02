import { useMemo } from 'react';
import { Tags } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';

export default function ClassificationsPage() {
  const { classifications, patches } = useAppStore();

  const withCounts = useMemo(() => {
    return classifications.map((c) => ({
      ...c,
      patchCount: patches.filter((p) => p.classificationId === c.id).length,
    }));
  }, [classifications, patches]);

  return (
    <div>
      <PageHeader
        title="Classificações"
        description="Módulos de negócio Sankhya para categorizar os patches"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
        {withCounts.map((c) => (
          <div
            key={c.id}
            className="glass-card p-5 hover:border-red-30 transition-all duration-200 group"
            style={{ borderLeftWidth: 3, borderLeftColor: c.color }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${c.color}1F` }}
                >
                  <Tags className="w-4 h-4" style={{ color: c.color }} />
                </span>
                <h3 className="text-sm font-semibold">{c.name}</h3>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: c.color, backgroundColor: `${c.color}1F` }}
              >
                {c.patchCount}
              </span>
            </div>
            <p className="text-xs text-white-muted">{c.description}</p>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-white-dim">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: c.isActive ? '#22C55E' : 'var(--color-text-dim)' }}
              />
              {c.isActive ? 'Ativa' : 'Inativa'}
              <span className="font-mono ml-auto">{c.color}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
