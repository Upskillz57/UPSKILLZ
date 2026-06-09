import { NextRequest, NextResponse } from 'next/server'
import { s3, BUCKET } from '@/lib/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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

    const { key, forceDownload } = await req.json()

    if (!key.startsWith(session.prefix)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const filename = key.split('/').pop() || 'fichier'

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ResponseContentDisposition: forceDownload
          ? `attachment; filename="${encodeURIComponent(filename)}"`
          : `inline; filename="${encodeURIComponent(filename)}"`,
      }),
      { expiresIn: 3600 }
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Download URL error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}