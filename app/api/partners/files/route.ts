import { NextRequest, NextResponse } from 'next/server'
import { s3, BUCKET } from '@/lib/s3'
import { ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'
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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const prefix = searchParams.get('prefix') || session.prefix

    if (!prefix.startsWith(session.prefix)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    }))

    const folders = (res.CommonPrefixes || []).map(p => ({
      key: p.Prefix,
      name: p.Prefix!.replace(prefix, '').replace('/', ''),
      isFolder: true,
      size: 0,
      lastModified: null,
      uploadedBy: null,
    }))

    const files = await Promise.all(
      (res.Contents || [])
        .filter(f => f.Key !== prefix)
        .map(async f => {
          let uploadedBy = null
          try {
            const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: f.Key! }))
            uploadedBy = head.Metadata?.['uploaded-by'] || null
          } catch {}
          return {
            key: f.Key,
            name: f.Key!.replace(prefix, ''),
            isFolder: false,
            size: f.Size,
            lastModified: f.LastModified,
            uploadedBy,
          }
        })
    )

    return NextResponse.json({ files: [...folders, ...files], prefix })
  } catch (error) {
    console.error('Files error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}