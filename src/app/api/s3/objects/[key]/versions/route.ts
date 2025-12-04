import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedS3Client } from '@/lib/s3/get-client';
import { listObjectVersions } from '@/lib/s3/operations';

type RouteParams = {
  params: Promise<{ key: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');

    if (!bucket) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Bucket is required' } },
        { status: 400 }
      );
    }

    const decodedKey = decodeURIComponent(key);
    const client = await getAuthenticatedS3Client();
    const versions = await listObjectVersions(client, bucket, decodedKey);

    return NextResponse.json({ data: versions });
  } catch (error) {
    console.error('List object versions error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to list object versions' } },
      { status: 500 }
    );
  }
}
