import { NextRequest, NextResponse } from 'next/server'
import { s3, BUCKET } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
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

    const { folderName, currentPrefix } = await req.json()
    if (!folderName) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

    // Sécurité : le prefix doit rester dans l'espace du partenaire
    const fullPrefix = currentPrefix || session.prefix
    if (!fullPrefix.startsWith(session.prefix)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const key = `${fullPrefix}${folderName}/`
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: '',
      ContentType: 'application/x-directory',
    }))

    return NextResponse.json({ ok: true, key })
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}