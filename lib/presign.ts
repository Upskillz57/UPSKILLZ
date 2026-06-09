import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3, BUCKET } from './s3'

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  metadata?: Record<string, string>,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    Metadata: metadata,
  })
  return getSignedUrl(s3, command, { expiresIn })
}