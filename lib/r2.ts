import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { s3, BUCKET } from './s3'

export async function getData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    const body = await res.Body?.transformToString()
    return body ? (JSON.parse(body) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

export async function putData<T>(key: string, data: T): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    })
  )
}