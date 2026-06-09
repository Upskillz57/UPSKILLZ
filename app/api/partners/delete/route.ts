import { NextRequest, NextResponse } from 'next/server'
import { s3, BUCKET } from '@/lib/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { cookies } from 'next/headers'

async function getSession() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('partner_session')?.value
  if (!raw) return null
  try {
    const session = JSON.parse(Buffer.from(raw, 'base64').toString())
    if (session.exp < Date.now()) return null
    return session
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { key } = await req.json()
    if (!key.startsWith(session.prefix)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}