import { NextRequest, NextResponse } from 'next/server'
import { getData } from '@/lib/r2'
import { R2_KEYS } from '@/lib/keys'
import { Partner } from '@/lib/types'
import { cookies } from 'next/headers'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.SESSION_SECRET).digest('hex')
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  }

  const partners = await getData<Partner[]>(R2_KEYS.partners, [])
  const partner = partners.find(p => p.email.toLowerCase() === email.toLowerCase())

  if (!partner) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  const hash = hashPassword(password)
  if (hash !== partner.passwordHash) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  // Créer le cookie de session
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const sessionData = Buffer.from(JSON.stringify({
    partnerId: partner.id,
    partnerName: partner.name,
    prefix: partner.prefix,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 jours
  })).toString('base64')

  const cookieStore = await cookies()
  cookieStore.set('partner_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return NextResponse.json({ partnerId: partner.id })
}