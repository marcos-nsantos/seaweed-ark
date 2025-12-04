import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedS3Client } from '@/lib/s3/get-client';
import {
  listObjects,
  deleteObject,
  copyObject,
  createFolder,
  renameObject,
} from '@/lib/s3/operations';

const listObjectsSchema = z.object({
  bucket: z.string().min(1),
  prefix: z.string().optional(),
  continuationToken: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listObjectsSchema.safeParse({
      bucket: searchParams.get('bucket'),
      prefix: searchParams.get('prefix') || undefined,
      continuationToken: searchParams.get('continuationToken') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Bucket is required' } },
        { status: 400 }
      );
    }

    const client = await getAuthenticatedS3Client();
    const result = await listObjects(
      client,
      parsed.data.bucket,
      parsed.data.prefix,
      parsed.data.continuationToken
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('List objects error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to list objects' } },
      { status: 500 }
    );
  }
}

const createFolderSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Bucket and path are required' } },
        { status: 400 }
      );
    }

    const client = await getAuthenticatedS3Client();
    await createFolder(client, parsed.data.bucket, parsed.data.path);

    return NextResponse.json({ data: { created: true } }, { status: 201 });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to create folder' } },
      { status: 500 }
    );
  }
}

const deleteObjectSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = deleteObjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Bucket and key are required' } },
        { status: 400 }
      );
    }

    const client = await getAuthenticatedS3Client();
    await deleteObject(client, parsed.data.bucket, parsed.data.key);

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error('Delete object error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to delete object' } },
      { status: 500 }
    );
  }
}

const copyObjectSchema = z.object({
  sourceBucket: z.string().min(1),
  sourceKey: z.string().min(1),
  destBucket: z.string().min(1),
  destKey: z.string().min(1),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = copyObjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Source and destination are required' } },
        { status: 400 }
      );
    }

    const client = await getAuthenticatedS3Client();
    await copyObject(
      client,
      parsed.data.sourceBucket,
      parsed.data.sourceKey,
      parsed.data.destBucket,
      parsed.data.destKey
    );

    return NextResponse.json({ data: { copied: true } });
  } catch (error) {
    console.error('Copy object error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to copy object' } },
      { status: 500 }
    );
  }
}

const renameObjectSchema = z.object({
  bucket: z.string().min(1),
  sourceKey: z.string().min(1),
  destKey: z.string().min(1),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = renameObjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Bucket, sourceKey, and destKey are required',
          },
        },
        { status: 400 }
      );
    }

    const client = await getAuthenticatedS3Client();
    await renameObject(client, parsed.data.bucket, parsed.data.sourceKey, parsed.data.destKey);

    return NextResponse.json({ data: { renamed: true } });
  } catch (error) {
    console.error('Rename object error:', error);
    return NextResponse.json(
      { error: { code: 'S3_ERROR', message: 'Failed to rename object' } },
      { status: 500 }
    );
  }
}
