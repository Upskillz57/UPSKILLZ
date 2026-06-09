'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Phone } from 'lucide-react'

const services = [
  { n: '01', title: 'Vidéo & Réseaux', desc: 'Contenus vidéo professionnels pour booster votre visibilité sur les réseaux sociaux.', hi: true },
  { n: '02', title: 'Sites Internet', desc: 'Sites vitrines et e-commerce rapides, modernes et optimisés SEO.' },
  { n: '03', title: 'Apps Mobiles', desc: 'Applications iOS & Android pensées pour l\'expérience utilisateur.' },
  { n: '04', title: 'Logiciels CRM', desc: 'Solutions sur-mesure adaptées à votre activité et vos équipes.' },
]

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const chars = '01アイウエオ{}[]<>/\\@#$%UPSKILLZ'
    const fs = 13
    let drops: number[] = []
    let animId: number

    function init() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      drops = Array.from({ length: Math.floor(canvas!.width / fs) }, () => Math.random() * -(canvas!.height / fs))
    }

    function draw() {
      ctx!.fillStyle = 'rgba(8,14,26,0.055)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * fs
        const alpha = Math.min(1, (y / canvas!.height) * 2.5)
        ctx!.fillStyle = Math.random() > 0.97 ? `rgba(255,240,180,${alpha * 0.9})` : `rgba(212,175,55,${alpha * 0.5})`
        ctx!.font = `${fs}px monospace`
        ctx!.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, y)
        if (y > canvas!.height && Math.random() > 0.975) drops[i] = 0
        drops[i] += 0.38
      }
      animId = requestAnimationFrame(draw)
    }

    init()
    draw()
    window.addEventListener('resize', init)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', init) }
  }, [])

  return (
    <div className="bg-[#080e1a] text-white">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        
        {/* Canvas animation */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />
        
        {/* Overlay radial */}
        <div className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(8,14,26,0.2) 0%, rgba(8,14,26,0.6) 50%, rgba(8,14,26,0.97) 100%)' }}
        />

        {/* Contenu */}
        <div className="relative z-20 max-w-3xl mx-auto pt-16">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#d4af37]/25 bg-[#d4af37]/10 text-[#d4af37] text-[9px] tracking-[2.5px] font-bold px-4 py-1.5 rounded-full mb-8">
            ✦ COMMUNICATION NUMÉRIQUE
          </div>

          {/* Titre */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight text-white mb-5">
            Votre marque,{' '}
            <span className="text-[#d4af37] font-bold">propulsée</span>
            <br />par le digital.
          </h1>

          {/* Sous-titre */}
          <p className="text-white/45 text-base leading-relaxed max-w-xl mx-auto mb-10">
            Vidéos percutantes, sites sur-mesure, apps mobiles et logiciels CRM —<br />
            l&apos;expertise complète pour votre croissance.
          </p>

          {/* Prompt card style Limova */}
          <div className="bg-[rgba(15,22,40,0.85)] border border-white/10 rounded-2xl p-5 max-w-lg mx-auto backdrop-blur-md text-left">
            
            {/* Texte prompt */}
            <div className="flex items-start gap-3 mb-4 pb-4 border-b border-white/8">
              <span className="text-[#d4af37] mt-0.5 flex-shrink-0 text-sm">✦</span>
              <span className="text-white/50 text-sm leading-relaxed">
                Créer une vidéo de présentation pour mes réseaux sociaux cette semaine
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5 rounded-full flex-shrink-0">
                <div className="w-4 h-4 rounded-full bg-[#d4af37] flex items-center justify-center text-[7px] font-black text-[#080e1a]">U</div>
                <span className="text-white/50 text-[10px] font-bold tracking-wide">UPSKILLZ</span>
                <span className="text-white/30 text-[10px]">▾</span>
              </div>
              <div className="flex gap-2">
                <Link href="/contact" className="bg-[#d4af37] text-[#080e1a] text-xs font-extrabold px-5 py-2.5 rounded-full hover:bg-yellow-400 transition-colors whitespace-nowrap">
                  Demander un devis →
                </Link>
                <Link href="/services" className="border border-white/12 bg-white/5 text-white/60 text-xs font-medium px-4 py-2.5 rounded-full hover:bg-white/10 transition-colors whitespace-nowrap">
                  Nos services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS CLIENTS ── */}
      <div className="border-t border-white/6 py-6 px-6">
        <p className="text-center text-[9px] tracking-[3px] text-white/20 font-semibold mb-5">ILS NOUS FONT CONFIANCE</p>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {['CLIENT A', 'CLIENT B', 'CLIENT C', 'CLIENT D', 'CLIENT E', 'CLIENT F'].map((c) => (
            <span key={c} className="text-white/15 text-xs font-black tracking-widest">{c}</span>
          ))}
        </div>
      </div>

      {/* ── STRIP ── */}
      <div className="bg-[#122e53] py-3 px-6">
        <div className="max-w-6xl mx-auto flex justify-between">
          {['Vidéo & Réseaux sociaux', 'Création de sites web', 'Applications mobiles', 'Logiciels CRM'].map((s) => (
            <div key={s} className="flex items-center gap-2 text-white/65 text-[10px] tracking-widest font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section className="bg-[#0b1322] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[9px] tracking-[3px] text-[#d4af37] font-bold block mb-3">NOS EXPERTISES</span>
            <h2 className="text-4xl font-bold text-white">
              Ce que nous <span className="text-[#d4af37]">créons</span> pour vous
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s) => (
              <div key={s.n} className={`rounded-2xl p-7 border ${s.hi ? 'border-[#d4af37]/30 bg-[#d4af37]/4' : 'border-white/7 bg-white/3'}`}>
                <div className="text-4xl font-black text-white/5 mb-4">{s.n}</div>
                <h3 className="text-white text-sm font-bold mb-2">{s.title}</h3>
                <p className="text-white/38 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center" style={{ background: 'linear-gradient(180deg, #0b1322 0%, #122e53 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-4">
            Prêt à passer au{' '}
            <span className="text-[#d4af37]">niveau supérieur</span> ?
          </h2>
          <p className="text-white/40 text-sm mb-10">Premier échange offert — sans engagement.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-[#d4af37] text-[#080e1a] text-sm font-extrabold px-8 py-4 rounded-full hover:bg-yellow-400 transition-colors">
            <Phone size={14} />
            Demander un devis gratuit
          </Link>
        </div>
      </section>

    </div>
  )
}