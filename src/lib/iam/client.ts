import { getSession } from '@/lib/auth';

export type SeaweedIAMConfig = {
  filerEndpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export async function getIAMConfig(): Promise<SeaweedIAMConfig> {
  const session = await getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  if (!session.filerEndpoint) {
    throw new Error(
      'Filer endpoint not configured. Please log out and log in again with the Filer Endpoint.'
    );
  }

  return {
    filerEndpoint: session.filerEndpoint,
    accessKeyId: session.accessKeyId,
    secretAccessKey: session.secretAccessKey,
  };
}

// SeaweedFS identity.json structure
export type SeaweedIdentity = {
  name: string;
  credentials: Array<{
    accessKey: string;
    secretKey: string;
  }>;
  actions: string[];
};

export type SeaweedIdentityConfig = {
  identities: SeaweedIdentity[];
};

// When SeaweedFS S3 is configured with -s3.config=filer, it reads from this path
const IDENTITY_PATH = '/etc/iam/identity.json';

export async function readIdentityConfig(config: SeaweedIAMConfig): Promise<SeaweedIdentityConfig> {
  const url = `${config.filerEndpoint}${IDENTITY_PATH}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      // File doesn't exist yet, return empty config
      return { identities: [] };
    }

    if (!response.ok) {
      throw new Error(`Failed to read identity config: ${response.status}`);
    }

    const data = await response.json();
    return data as SeaweedIdentityConfig;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return { identities: [] };
    }
    throw error;
  }
}

export async function writeIdentityConfig(
  config: SeaweedIAMConfig,
  identityConfig: SeaweedIdentityConfig
): Promise<void> {
  const url = `${config.filerEndpoint}${IDENTITY_PATH}`;

  try {
    // SeaweedFS filer accepts PUT with JSON content
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(identityConfig),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to write identity config: ${response.status} ${text}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to write')) {
      throw error;
    }
    throw new Error(
      `Failed to connect to filer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
