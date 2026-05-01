import type { UsageData } from '@/src/modules/photographers/services/UsageService'

export function UsageSummary({ usage }: { usage: UsageData }) {
  const { storage } = usage
  const barColor = storage.exceeded ? '#ef4444' : storage.warning ? '#C9A96E' : '#a8a29e'

  return (
    <div className="px-3 py-3 border border-stone-200 bg-white">

      {/* Label + value */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-sans text-stone-500">Storage</span>
        <span
          className="text-xs font-sans tabular-nums"
          style={{ color: storage.exceeded ? '#ef4444' : storage.warning ? '#92400e' : '#57534e' }}
        >
          {storage.usedGB} / {storage.limitGB} GB
        </span>
      </div>

      {/* Bar */}
      <div style={{ height: 3, background: '#f5f5f4', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, storage.percent)}%`,
            height: '100%',
            background: barColor,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Warning */}
      {(storage.warning || storage.exceeded) && (
        <p
          className="mt-2 text-xs font-sans leading-snug"
          style={{ color: '#92400e' }}
        >
          {storage.exceeded
            ? 'Storage full — uploads are paused.'
            : `${storage.percent}% used — approaching your limit.`}
        </p>
      )}
    </div>
  )
}
