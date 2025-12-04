import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedS3Client } from '@/lib/s3/get-client';
import { getPresignedDownloadUrl, getPresignedUploadUrl } from '@/lib/s3/presign';

const presignSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  operation: z.enum(['getObject', 'putObject']),
  expiresIn: z.number().min(60).max(604800).optional(),
  contentType: z.string().optional(),
  versionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = presignSchema.safeParse(body);

    if (!parsed.success) {
      const flatErrors = parsed.error.flatten();
      const message = Object.values(flatErrors.fieldErrors).flat()[0] || 'Invalid input';
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message } }, { status: 400 });
    }

    const { bucket, key, operation, expiresIn, contentType, versionId } = parsed.data;
    const client = await getAuthenticatedS3Client();

    let url: string;

    if (operation === 'getObject') {
      url = await getPresignedDownloadUrl(client, bucket, key, expiresIn, versionId);
    } else {
      if (!contentType) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Content-Type is required for upload' } },
          { status: 400 }
        );
      }
      url = await getPresignedUploadUrl(client, bucket, key, contentType, expiresIn);
    }

    return NextResponse.json({ data: { url } });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to generate presigned URL' } },
      { status: 500 }
    );
  }
}
