import { NextRequest, NextResponse } from 'next/server'
import { getData, putData } from '@/lib/r2'
import { R2_KEYS } from '@/lib/keys'
import { Partner } from '@/lib/type'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.SESSION_SECRET).digest('hex')
}

async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('partner_session')
  if (!session) return null
  try {
    return JSON.parse(Buffer.from(session.value, 'base64').toString())
  } catch { return null }
}

// GET — liste tous les partenaires (admin seulement)
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const partners = await getData<Partner[]>(R2_KEYS.partners, [])
  const partner = partners.find(p => p.id === session.partnerId)
  if (partner?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  // Ne pas renvoyer les hash
  return NextResponse.json(partners.map(p => ({ id: p.id, name: p.name, email: p.email, role: p.role, prefix: p.prefix })))
}

// POST — créer ou supprimer un utilisateur
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const partners = await getData<Partner[]>(R2_KEYS.partners, [])
  const caller = partners.find(p => p.id === session.partnerId)
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { action, user } = await req.json()

  if (action === 'create') {
    const { name, email, password, role } = user
    if (!name || !email || !password || !role) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    if (partners.find(p => p.email.toLowerCase() === email.toLowerCase())) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 })
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4)
    const newPartner: Partner = {
      id, name, email,
      passwordHash: hashPassword(password),
      role,
      prefix: `partners/${id}/`,
    }
    await putData(R2_KEYS.partners, [...partners, newPartner])
    return NextResponse.json({ success: true, id })
  }

  if (action === 'delete') {
    const { id } = user
    if (id === session.partnerId) return NextResponse.json({ error: 'Impossible de se supprimer soi-même' }, { status: 400 })
    await putData(R2_KEYS.partners, partners.filter(p => p.id !== id))
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
