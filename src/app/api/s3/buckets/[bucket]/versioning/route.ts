import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedS3Client } from '@/lib/s3/get-client';
import { getBucketVersioning, setBucketVersioning } from '@/lib/s3/operations';

type RouteParams = {
  params: Promise<{ bucket: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { bucket } = await params;
    const client = await getAuthenticatedS3Client();
    const status = await getBucketVersioning(client, bucket);

    return NextResponse.json({ data: { bucket, status } });
  } catch (error) {
    console.error('Get bucket versioning error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to get bucket versioning' } },
      { status: 500 }
    );
  }
}

const setVersioningSchema = z.object({
  enabled: z.boolean(),
});

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { bucket } = await params;
    const body = await request.json();
    const parsed = setVersioningSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'enabled (boolean) is required' } },
        { status: 400 }
      );
    }

    const client = await getAuthenticatedS3Client();
    await setBucketVersioning(client, bucket, parsed.data.enabled);

    return NextResponse.json({
      data: { bucket, status: parsed.data.enabled ? 'Enabled' : 'Suspended' },
    });
  } catch (error) {
    console.error('Set bucket versioning error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to set bucket versioning' } },
      { status: 500 }
    );
  }
}
