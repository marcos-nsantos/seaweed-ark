# Ark

Web UI for managing S3-compatible object storage (SeaweedFS).

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **File Browser** - Navigate, upload, download, rename, copy, move, and delete files
- **Search & Filter** - Real-time search to filter files by name
- **Bulk Operations** - Select and delete multiple files at once
- **Sharing** - Generate presigned URLs with configurable expiration
- **Bucket Management** - Create, delete, and configure buckets with list/grid views
- **Versioning** - Enable/disable bucket versioning, view and restore previous versions
- **IAM Users** - Create users, manage credentials, and configure bucket permissions
- **Multi-tenant** - Login with S3 access key/secret key credentials
- **Responsive** - Works on desktop and mobile devices

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- MUI v6 (Material Design)
- TanStack Query v5
- AWS SDK for JavaScript v3

## Quick Start with Docker

### Full Stack (Ark + SeaweedFS)

```bash
# Clone and start
git clone https://github.com/marcos-nsantos/seaweed-ark.git
cd seaweed-ark
docker compose up -d

# Access
open http://localhost:3000
```

Default credentials:
- **S3 Endpoint**: `http://localhost:8333`
- **Filer Endpoint**: `http://localhost:8888`
- **Access Key**: `admin`
- **Secret Key**: `admin123`

### Development (SeaweedFS only)

```bash
# Start SeaweedFS services
docker compose -f docker-compose.dev.yml up -d

# Run Next.js locally
npm install
npm run dev
```

## Manual Setup

### Requirements

- Node.js 20+
- SeaweedFS with S3 and Filer enabled

### 1. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
AUTH_SECRET=your-secret-key-min-32-characters-long
```

### 2. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Docker

### Build image

```bash
docker build -t seaweed-ark .
```

### Run container

```bash
docker run -p 3000:3000 \
  -e AUTH_SECRET="your-secret-key-min-32-characters-long" \
  seaweed-ark
```

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Ark UI | 3000 | Web interface |
| S3 Gateway | 8333 | S3-compatible API |
| Filer | 8888 | SeaweedFS Filer (IAM) |
| Master | 9333 | SeaweedFS Master |
| Volume | 8080 | SeaweedFS Volume Server |

## Configuration

### SeaweedFS S3 Credentials

Edit `seaweedfs/s3.json` to configure users:

```json
{
  "identities": [
    {
      "name": "admin",
      "credentials": [
        {
          "accessKey": "admin",
          "secretKey": "admin123"
        }
      ],
      "actions": ["Admin", "Read", "List", "Tagging", "Write"]
    }
  ]
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | 32+ char secret for session encryption |

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
