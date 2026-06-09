import { NextResponse } from 'next/server'
import { getData } from '@/lib/r2'
import { R2_KEYS } from '@/lib/keys'
import { Partner } from '@/lib/type'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('partner_session')
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const partners = await getData<Partner[]>(R2_KEYS.partners, [])
  // Retourne uniquement les infos publiques
  return NextResponse.json(partners.map(p => ({ id: p.id, name: p.name, role: p.role })))
}
