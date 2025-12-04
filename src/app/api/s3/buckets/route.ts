import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedS3Client } from '@/lib/s3/get-client';
import { listBuckets, createBucket, deleteBucket } from '@/lib/s3/operations';

export async function GET() {
  try {
    const client = await getAuthenticatedS3Client();
    const buckets = await listBuckets(client);

    return NextResponse.json({ data: buckets });
  } catch (error) {
    console.error('List buckets error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to list buckets' } },
      { status: 500 }
    );
  }
}

const createBucketSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/, 'Invalid bucket name format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBucketSchema.safeParse(body);

    if (!parsed.success) {
      const flatErrors = parsed.error.flatten();
      const message = flatErrors.fieldErrors.name?.[0] || 'Invalid input';
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message } }, { status: 400 });
    }

    const client = await getAuthenticatedS3Client();
    await createBucket(client, parsed.data.name);

    return NextResponse.json({ data: { name: parsed.data.name } }, { status: 201 });
  } catch (error) {
    console.error('Create bucket error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to create bucket' } },
      { status: 500 }
    );
  }
}

const deleteBucketSchema = z.object({
  name: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = deleteBucketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Bucket name is required' } },
        { status: 400 }
      );
    }

    const client = await getAuthenticatedS3Client();
    await deleteBucket(client, parsed.data.name);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error('Delete bucket error:', error);
    const message =
      error instanceof Error && error.name === 'BucketNotEmpty'
        ? 'Bucket is not empty'
        : 'Failed to delete bucket';
    return NextResponse.json({ error: { code: 'S3_ERROR', message } }, { status: 500 });
  }
}
