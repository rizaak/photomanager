import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { ArrowRight, Lock, Zap, Download } from 'lucide-react'
import { auth0 } from '@/src/lib/auth0'

// ─── Hero background grid ────────────────────────────────────────────────────

// Each column has different photos and a different scroll speed for parallax depth.
// Cells are duplicated inside the column so translateY(-50%) loops seamlessly.

const heroCol1 = [
  { color: 'bg-stone-400', ratio: '2/3' },
  { color: 'bg-stone-700', ratio: '3/2' },
  { color: 'bg-stone-300', ratio: '4/5' },
  { color: 'bg-stone-800', ratio: '2/3' },
  { color: 'bg-stone-500', ratio: '1/1' },
  { color: 'bg-stone-600', ratio: '3/2' },
  { color: 'bg-stone-300', ratio: '4/5' },
]

const heroCol2 = [
  { color: 'bg-stone-600', ratio: '3/2' },
  { color: 'bg-stone-300', ratio: '2/3' },
  { color: 'bg-stone-800', ratio: '1/1' },
  { color: 'bg-stone-400', ratio: '4/5' },
  { color: 'bg-stone-200', ratio: '2/3' },
  { color: 'bg-stone-700', ratio: '3/2' },
  { color: 'bg-stone-500', ratio: '2/3' },
]

const heroCol3 = [
  { color: 'bg-stone-800', ratio: '4/5' },
  { color: 'bg-stone-300', ratio: '2/3' },
  { color: 'bg-stone-600', ratio: '3/2' },
  { color: 'bg-stone-400', ratio: '2/3' },
  { color: 'bg-stone-700', ratio: '1/1' },
  { color: 'bg-stone-200', ratio: '3/2' },
  { color: 'bg-stone-500', ratio: '4/5' },
]

function HeroColumn({
  cells,
  duration,
}: {
  cells: { color: string; ratio: string }[]
  duration: number
}) {
  // Duplicate cells so the loop is seamless at translateY(-50%)
  const all = [...cells, ...cells]
  return (
    <div className="flex-1 overflow-hidden">
      <div style={{ animation: `heroScrollUp ${duration}s linear infinite` }}>
        {all.map((cell, i) => (
          <div
            key={i}
            className={`${cell.color} w-full mb-2 rounded`}
            style={{ aspectRatio: cell.ratio }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Page data ───────────────────────────────────────────────────────────────

const features = [
  {
    icon: Lock,
    title: 'Private by default',
    description:
      'Every gallery is private until you share it. Password protection, expiry dates, and access controls built in.',
  },
  {
    icon: Zap,
    title: 'Instant previews',
    description:
      'Optimized watermarked previews are generated automatically. Clients see your work at its best, instantly.',
  },
  {
    icon: Download,
    title: 'Controlled delivery',
    description:
      "Enable downloads only when you're ready. Clients download their final selections via secure signed links.",
  },
]

const steps = [
  {
    title: 'Upload your photos',
    description:
      'Drag and drop an entire session into your gallery. We handle compression, watermarking, and delivery.',
  },
  {
    title: 'Share with your client',
    description:
      'Send a private link. Your client browses their gallery, marks favorites, and submits their selections.',
  },
  {
    title: 'Deliver with confidence',
    description:
      "Enable downloads when you're ready. Files are delivered securely — no third-party platforms needed.",
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await auth0.getSession()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-950">
      <Navbar theme="dark" />

      {/* ── Hero ── */}
      <section className="min-h-screen relative flex items-center overflow-hidden bg-stone-950 pt-16">

        {/* Animated photo grid — right side, different opacity per breakpoint */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[62%] flex gap-2 px-2 opacity-[0.22] md:opacity-50 pointer-events-none">
          <HeroColumn cells={heroCol1} duration={22} />
          <HeroColumn cells={heroCol2} duration={31} />
          <HeroColumn cells={heroCol3} duration={26} />
        </div>

        {/* Left gradient — keeps text readable, photos fade in from center-right */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, #0c0a09 0%, #0c0a09 38%, rgba(12,10,9,0.92) 58%, rgba(12,10,9,0.3) 80%, transparent 100%)',
          }}
        />
        {/* Top + bottom fades so photos don't hard-clip at nav / fold */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-stone-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-stone-950 to-transparent z-10 pointer-events-none" />

        {/* Text content — z-20 so it sits above all gradient layers */}
        <div className="relative z-20 max-w-6xl mx-auto px-6 py-28 w-full">
          <div className="max-w-xl">
            <p className="text-accent text-xs font-sans tracking-[0.2em] uppercase mb-10">
              Private Gallery Platform
            </p>
            <h1 className="font-serif text-6xl md:text-7xl lg:text-[88px] font-normal leading-[1.03] text-white mb-8">
              Your work,<br />beautifully<br />delivered.
            </h1>
            <p className="text-stone-400 text-lg md:text-xl font-sans leading-relaxed mb-12 max-w-lg">
              Share private galleries with clients. Let them select their favorites.
              Deliver final images effortlessly.
            </p>
            <div className="flex gap-4 flex-wrap items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-stone-950 text-sm font-sans font-medium tracking-wide hover:bg-accent-hover transition-colors"
              >
                Get Started Free
                <ArrowRight size={15} strokeWidth={2} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 border border-stone-800 text-stone-400 text-sm font-sans font-medium tracking-wide hover:border-stone-600 hover:text-stone-200 transition-colors"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-stone-50 py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-20 max-w-xl">
            <h2 className="font-serif text-4xl md:text-5xl text-stone-900 leading-tight mb-6">
              Built for photographers who care about every detail.
            </h2>
            <p className="text-stone-500 text-lg font-sans leading-relaxed">
              From upload to delivery — a seamless experience for you and your clients.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title}>
                <div className="w-10 h-10 border border-accent flex items-center justify-center mb-6">
                  <Icon size={16} strokeWidth={1.5} className="text-accent" />
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-3">{title}</h3>
                <p className="text-stone-500 text-sm font-sans leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl md:text-5xl text-stone-900">How it works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="text-accent font-serif text-6xl font-light mb-6 leading-none">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="font-serif text-xl text-stone-900 mb-4">{step.title}</h3>
                <p className="text-stone-500 text-sm font-sans leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="bg-stone-100 py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <blockquote>
            <p className="font-serif text-2xl md:text-3xl text-stone-800 leading-relaxed mb-8">
              &ldquo;My clients feel like they&rsquo;re getting a premium experience. And I don&rsquo;t have to send a single file over email.&rdquo;
            </p>
            <footer className="text-stone-500 text-sm font-sans">
              — James Okafor, Wedding Photographer
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section id="pricing" className="bg-stone-950 py-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            Ready to elevate your client experience?
          </h2>
          <p className="text-stone-400 text-lg font-sans mb-12 max-w-lg mx-auto leading-relaxed">
            Join photographers who deliver their work with confidence and elegance.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-4 bg-accent text-stone-950 text-sm font-sans font-medium tracking-wide hover:bg-accent-hover transition-colors"
          >
            Start for Free
            <ArrowRight size={15} strokeWidth={2} />
          </Link>
          <p className="text-stone-600 text-xs font-sans mt-6">No credit card required</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-stone-950 border-t border-stone-900 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-serif text-stone-600 text-sm">© 2026 Frame</span>
          <div className="flex gap-8">
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-stone-600 text-sm font-sans hover:text-stone-400 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
