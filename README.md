# Argos

Web UI for managing S3-compatible object storage (SeaweedFS).

## Features

- **File Browser** - Navigate, upload, download, rename, and delete files
- **Bucket Management** - Create, delete, and configure buckets
- **Versioning** - Enable/disable bucket versioning, view and download previous versions
- **IAM Users** - Create users, manage credentials, and configure bucket permissions
- **Multi-tenant** - Login with S3 access key/secret key credentials

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- MUI v6 (Material Design)
- TanStack Query v5
- AWS SDK for JavaScript v3

## Requirements

- Node.js 18+
- SeaweedFS with S3 and Filer enabled

## Getting Started

### 1. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
SESSION_SECRET=your-32-char-secret-key-here
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Login

Enter your SeaweedFS credentials:

| Field | Description | Example |
|-------|-------------|---------|
| S3 Endpoint | SeaweedFS S3 gateway URL | `http://localhost:8333` |
| Filer Endpoint | SeaweedFS Filer URL (for IAM) | `http://localhost:8888` |
| Access Key | S3 access key | `admin` |
| Secret Key | S3 secret key | `admin123` |

## SeaweedFS Setup

### Docker Compose

```yaml
services:
  seaweedfs:
    image: chrislusf/seaweedfs
    ports:
      - "9333:9333"   # master
      - "8080:8080"   # volume
      - "8888:8888"   # filer
      - "8333:8333"   # s3
    command: "server -s3 -filer"
    volumes:
      - seaweedfs_data:/data

volumes:
  seaweedfs_data:
```

### Create initial admin user

```bash
curl -X PUT "http://localhost:8888/etc/iam/identity.json" \
  -H "Content-Type: application/json" \
  -d '{
  "identities": [
    {
      "name": "admin",
      "credentials": [
        {
          "accessKey": "admin",
          "secretKey": "admin123"
        }
      ],
      "actions": ["Admin", "Read", "Write", "List", "Tagging"]
    }
  ]
}'
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/        # Login page
│   ├── (dashboard)/         # Protected pages
│   │   ├── buckets/         # Bucket list and file browser
│   │   ├── users/           # IAM user management
│   │   └── settings/        # Connection settings
│   └── api/                 # API routes
│       ├── auth/            # Authentication
│       ├── s3/              # S3 operations
│       └── iam/             # IAM operations
├── components/
│   ├── buckets/             # Bucket components
│   ├── file-browser/        # File browser components
│   ├── upload/              # Upload components
│   ├── users/               # User management components
│   └── layout/              # Layout components
├── hooks/                   # React Query hooks
├── lib/
│   ├── auth.ts              # Session management
│   ├── s3/                  # S3 client and operations
│   └── iam/                 # IAM client and operations
└── types/                   # TypeScript types
```

## License

MIT
