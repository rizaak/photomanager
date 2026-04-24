import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mockPhotographer } from '@/lib/mock-data'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-stone-200 pb-10 mb-10 last:border-0">
      <h2 className="font-serif text-xl text-stone-900 mb-6">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value, hint }: { label: string; value?: string; hint?: string }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-sans text-stone-500 uppercase tracking-widest mb-2">
        {label}
      </label>
      <input
        defaultValue={value}
        className="w-full max-w-sm bg-white border border-stone-200 px-4 py-3 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400"
      />
      {hint && <p className="text-xs text-stone-400 font-sans mt-1.5">{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const { storageUsedGB, storageLimitGB, plan } = mockPhotographer
  const storagePercent = Math.round((storageUsedGB / storageLimitGB) * 100)

  return (
    <div className="px-10 py-10 max-w-2xl">
      <div className="mb-10">
        <h1 className="font-serif text-3xl text-stone-900 mb-1">Settings</h1>
        <p className="text-sm text-stone-400 font-sans">Manage your account and preferences.</p>
      </div>

      <Section title="Profile">
        <Field label="Name" value={mockPhotographer.name} />
        <Field label="Email" value={mockPhotographer.email} />
        <Button variant="secondary" size="sm">Save Changes</Button>
      </Section>

      <Section title="Subscription">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant={plan} />
          <span className="text-sm font-sans text-stone-600">Current plan</span>
        </div>
        <div className="mb-6">
          <div className="flex justify-between text-sm font-sans text-stone-600 mb-2">
            <span>Storage used</span>
            <span>{storageUsedGB} GB of {storageLimitGB} GB ({storagePercent}%)</span>
          </div>
          <div className="h-1.5 bg-stone-100 w-full max-w-sm">
            <div className="h-1.5 bg-accent" style={{ width: `${storagePercent}%` }} />
          </div>
        </div>
        <Button variant="primary" size="sm">Upgrade Plan</Button>
      </Section>

      <Section title="Gallery Defaults">
        <Field
          label="Default expiry (days)"
          value="30"
          hint="Galleries expire and become inaccessible after this many days."
        />
        <div className="mb-5">
          <label className="block text-xs font-sans text-stone-500 uppercase tracking-widest mb-2">
            Default privacy
          </label>
          <div className="relative max-w-sm">
            <select className="w-full appearance-none bg-white border border-stone-200 px-4 py-3 text-sm font-sans text-stone-700 focus:outline-none focus:border-stone-400 pr-8">
              <option>Private (password required)</option>
              <option>Private (link only)</option>
            </select>
          </div>
        </div>
        <Button variant="secondary" size="sm">Save Defaults</Button>
      </Section>

      <Section title="Danger Zone">
        <p className="text-sm font-sans text-stone-500 mb-5">
          Deleting your account is permanent and cannot be undone. All galleries and photos will be removed.
        </p>
        <Button variant="danger" size="sm">Delete Account</Button>
      </Section>
    </div>
  )
}
