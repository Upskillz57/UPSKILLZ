import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#050b14] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Image src="/logo.png" alt="UPSKILLZ" width={120} height={34} className="h-7 w-auto mb-3" />
            <p className="text-white/40 text-xs leading-relaxed mt-2">
              Réalisation de vidéos, sites internet,<br />applications mobiles et logiciels CRM.
            </p>
          </div>
          <div>
            <p className="text-gold text-xs font-bold tracking-widest mb-4">NAVIGATION</p>
            <ul className="space-y-2">
              {[['/', 'Accueil'], ['/services', 'Services'], ['/portfolio', 'Portfolio'], ['/tarifs', 'Tarifs'], ['/blog', 'Blog'], ['/contact', 'Contact']].map(([href, label]) => (
                <li key={href}><Link href={href} className="text-white/40 text-xs hover:text-white/80 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-gold text-xs font-bold tracking-widest mb-4">CONTACT</p>
            <p className="text-white/40 text-xs">contact@upskillz.fr</p>
            <div className="flex gap-4 mt-4">
              {['Instagram', 'LinkedIn', 'YouTube', 'Facebook'].map((r) => (
                <a key={r} href="#" className="text-white/30 text-xs hover:text-white/70 transition-colors">{r}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 mt-10 pt-6 text-center text-xs text-white/20">
          © {new Date().getFullYear()} UPSKILLZ — Tous droits réservés
        </div>
      </div>
    </footer>
  )
}