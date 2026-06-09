import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

async function main() {
  const s3 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID as string, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string } })
  const r = await s3.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME as string, Key: 'admin/partners.json' }))
  console.log(await r.Body?.transformToString())
}
main()
