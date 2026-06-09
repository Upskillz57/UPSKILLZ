'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Menu, X } from 'lucide-react'

const links = [
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/blog', label: 'Blog' },
  { href: '/a-propos', label: 'À propos' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="absolute top-0 left-0 right-0 z-50 border-b border-white/7">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Image src="/logo.png" alt="UPSKILLZ" width={130} height={36} className="h-8 w-auto" priority />
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-white/65 text-xs font-medium hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <Link href="/login" className="text-white/65 text-xs font-medium hover:text-white transition-colors">
              Se connecter
            </Link>
            <Link href="/contact" className="flex items-center gap-1.5 border border-white/25 text-white/80 text-xs font-medium px-4 py-2 rounded-full hover:border-white/50 transition-colors">
              <Phone size={11} />
              Être rappelé
            </Link>
          </div>

          <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#080e1a] border-t border-white/7 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/65 text-sm" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <Link href="/login" className="text-white/65 text-sm">Se connecter</Link>
          <Link href="/contact" className="text-gold text-sm font-semibold">Être rappelé</Link>
        </div>
      )}
    </header>
  )
}