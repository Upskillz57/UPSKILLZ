import { NextRequest, NextResponse } from 'next/server'
import { getData, putData } from '@/lib/r2'
import { cookies } from 'next/headers'

interface ShareRecord {
  id: string
  fileKey: string
  fileName: string
  sharedBy: string
  sharedWith: string[] // ids
  publicUrl?: string
  createdAt: string
}

async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('partner_session')
  if (!session) return null
  try { return JSON.parse(Buffer.from(session.value, 'base64').toString()) }
  catch { return null }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const shares = await getData<ShareRecord[]>('admin/shares.json', [])
  const mine = shares.filter(s => s.sharedWith.includes(session.partnerId) || s.sharedBy === session.partnerId)
  return NextResponse.json(mine)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { fileKey, fileName, sharedWith, publicUrl } = await req.json()
  const shares = await getData<ShareRecord[]>('admin/shares.json', [])
  const record: ShareRecord = {
    id: Date.now().toString(),
    fileKey, fileName,
    sharedBy: session.partnerId,
    sharedWith: sharedWith || [],
    publicUrl,
    createdAt: new Date().toISOString(),
  }
  await putData('admin/shares.json', [...shares, record])
  return NextResponse.json({ success: true, id: record.id })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { id } = await req.json()
  const shares = await getData<ShareRecord[]>('admin/shares.json', [])
  const share = shares.find(s => s.id === id)
  if (share?.sharedBy !== session.partnerId) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  await putData('admin/shares.json', shares.filter(s => s.id !== id))
  return NextResponse.json({ success: true })
}
