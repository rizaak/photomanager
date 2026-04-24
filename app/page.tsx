import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { ArrowRight, Lock, Zap, Download } from 'lucide-react'

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
      'Enable downloads only when you\'re ready. Clients download their final selections via secure signed links.',
  },
]

const steps = [
  {
    title: 'Upload your photos',
    description: 'Drag and drop an entire session into your gallery. We handle compression, watermarking, and delivery.',
  },
  {
    title: 'Share with your client',
    description: 'Send a private link. Your client browses their gallery, marks favorites, and submits their selections.',
  },
  {
    title: 'Deliver with confidence',
    description: 'Enable downloads when you\'re ready. Files are delivered securely — no third-party platforms needed.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-950">
      <Navbar theme="dark" />

      {/* Hero */}
      <section className="min-h-screen flex items-center bg-stone-950 pt-16">
        <div className="max-w-6xl mx-auto px-6 py-28 w-full">
          <div className="max-w-3xl">
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

      {/* Gallery preview strip */}
      <section className="bg-stone-900 py-1">
        <div className="flex gap-1 overflow-hidden h-48">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex-shrink-0 flex-1 ${
                ['bg-stone-700', 'bg-stone-600', 'bg-stone-800', 'bg-stone-700',
                 'bg-stone-500', 'bg-stone-800', 'bg-stone-600', 'bg-stone-700'][i]
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features */}
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

      {/* How it works */}
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

      {/* Testimonial / Proof */}
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

      {/* Final CTA */}
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

      {/* Footer */}
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
