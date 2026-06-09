import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!

function hashPassword(password: string): string {
  return crypto.createHash('sha256')
    .update(password + process.env.SESSION_SECRET)
    .digest('hex')
}

const partners = [
  {
    id: 'kevin',
    name: 'Kevin',
    email: 'kevin@email.com', // ← change ici
    passwordHash: hashPassword('motdepasse123'), // ← change ici
    prefix: 'partners/kevin/',
    createdAt: new Date().toISOString(),
  }
]

async function run() {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: 'admin/partners.json',
    Body: JSON.stringify(partners, null, 2),
    ContentType: 'application/json',
  }))
  console.log('✅ Partenaires créés sur R2')
}

run()