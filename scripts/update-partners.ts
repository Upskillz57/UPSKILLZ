import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
})

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.SESSION_SECRET).digest('hex')
}

const partners = [
  {
    id: 'giovanni',
    name: 'Giovanni Verna',
    email: 'gverna@lgef.fff.fr',
    passwordHash: hashPassword('upskillz2026'),
    role: 'admin',
    prefix: 'partners/giovanni/',
  },
  {
    id: 'kevin',
    name: 'Kevin',
    email: 'kevin@email.com',
    passwordHash: hashPassword('kevin2026'),
    role: 'prestataire',
    prefix: 'partners/kevin/',
  },
]

async function main() {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME as string,
    Key: 'admin/partners.json',
    Body: JSON.stringify(partners, null, 2),
    ContentType: 'application/json',
  }))
  console.log('✅ partners.json mis à jour')
}
main()
