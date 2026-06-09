import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUploadUrl } from '@/lib/presign'
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

      const { filename, contentType, metadata } = await req.json()
      const key = `${session.prefix}${filename}`
      const url = await getPresignedUploadUrl(key, contentType, metadata)

    return NextResponse.json({ 
      url, 
      key,
      uploadedBy: session.partnerName,
    })
  } catch (error) {
    console.error('Upload URL error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}