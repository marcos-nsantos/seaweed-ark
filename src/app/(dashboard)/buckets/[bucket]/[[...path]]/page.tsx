'use client';

import { useParams, useRouter } from 'next/navigation';
import { FileBrowser } from '@/components/file-browser/file-browser';

export default function BucketPage() {
  const params = useParams();
  const router = useRouter();

  const bucket = params.bucket as string;
  const path = (params.path as string[] | undefined) || [];

  const handleNavigate = (newPath: string[]) => {
    if (newPath.length === 0) {
      router.push(`/buckets/${bucket}`);
    } else {
      router.push(`/buckets/${bucket}/${newPath.join('/')}`);
    }
  };

  return <FileBrowser bucket={bucket} path={path} onNavigate={handleNavigate} />;
}
