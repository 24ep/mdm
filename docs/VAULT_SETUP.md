# HashiCorp Vault Setup Guide

## Quick Start

### 1. Start Vault with Docker Compose

```bash
docker-compose up -d vault
```

Vault will be available at `http://localhost:8200`

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
USE_VAULT=true
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=dev-root-token  # For development only!
VAULT_SECRET_MOUNT=secret
```

### 3. Initialize Vault (Production)

For production, you need to initialize Vault:

```bash
# Start Vault in production mode
docker-compose -f docker-compose.prod.yml up -d vault

# Initialize Vault
vault operator init

# Save the unseal keys and root token securely!
```

### 4. Unseal Vault (Production)

```bash
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>
```

## Development Mode

The Docker Compose file includes Vault in development mode:
- Auto-unsealed
- In-memory storage
- Root token: `dev-root-token`
- **NOT FOR PRODUCTION USE**

## Production Setup

### 1. Create Vault Configuration

Create `vault/config/vault.hcl`:

```hcl
storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # Enable TLS in production!
}

api_addr = "http://vault:8200"
cluster_addr = "http://vault:8201"
ui = true
```

### 2. Update Docker Compose

```yaml
vault:
  image: hashicorp/vault:latest
  command: vault server -config=/vault/config/vault.hcl
  volumes:
    - vault_data:/vault/data
    - ./vault/config:/vault/config
```

### 3. Enable Secret Engine

```bash
vault secrets enable -path=secret kv-v2
```

### 4. Create Policies

```bash
# Policy for application access
vault policy write app-policy - <<EOF
path "secret/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
EOF

# Create token for application
vault token create -policy=app-policy
```

## Integration with Application

### Automatic Detection

The application automatically detects if Vault is enabled:

```typescript
import { getSecretsManager } from '@/lib/secrets-manager'

const secretsManager = getSecretsManager()
const backend = secretsManager.getBackend() // 'vault' or 'database'
```

### Storing Secrets

```typescript
// API Keys
await secretsManager.storeApiKey('openai', 'sk-...')

// Database Credentials
await secretsManager.storeDatabaseCredentials('conn-123', {
  username: 'user',
  password: 'pass',
  host: 'localhost',
  port: 5432,
  database: 'mydb'
})

// External API Credentials
await secretsManager.storeExternalApiCredentials('api-123', {
  apiKey: 'key',
  apiToken: 'token'
})
```

### Retrieving Secrets

```typescript
// API Keys
const apiKey = await secretsManager.getApiKey('openai')

// Database Credentials
const creds = await secretsManager.getDatabaseCredentials('conn-123')

// External API Credentials
const apiCreds = await secretsManager.getExternalApiCredentials('api-123')
```

## UI Management

Access the Vault management UI in System Settings:
1. Go to Settings → System Settings
2. View "Secrets Management" section
3. Check Vault status and health
4. View secrets summary

## Security Best Practices

### 1. Token Management
- ✅ Use short-lived tokens
- ✅ Rotate tokens regularly
- ✅ Use AppRole authentication for applications
- ❌ Never commit tokens to version control

### 2. Access Control
- ✅ Create specific policies for each service
- ✅ Use least privilege principle
- ✅ Enable audit logging

### 3. Network Security
- ✅ Enable TLS in production
- ✅ Restrict network access
- ✅ Use firewall rules

### 4. Backup
- ✅ Regular Vault snapshots
- ✅ Store backups securely
- ✅ Test restore procedures

## Troubleshooting

### Vault Not Connecting

1. Check Vault is running:
   ```bash
   docker ps | grep vault
   ```

2. Check Vault health:
   ```bash
   curl http://localhost:8200/v1/sys/health
   ```

3. Verify environment variables:
   ```bash
   echo $VAULT_ADDR
   echo $VAULT_TOKEN
   ```

### Secrets Not Found

1. Check secret path:
   ```bash
   vault kv list secret/
   ```

2. Verify token permissions:
   ```bash
   vault token capabilities secret/data/ai-providers/openai/api-key
   ```

### Fallback to Database

If Vault is unavailable, the system automatically falls back to database encryption. Check logs for:
```
⚠️  Falling back to database encryption
```

## Migration

### From Database to Vault

1. Enable Vault
2. Existing secrets remain in database
3. New secrets go to Vault
4. Gradually migrate by updating secrets

### From Vault to Database

1. Set `USE_VAULT=false`
2. Export secrets from Vault if needed
3. System uses database encryption

## Monitoring

### Health Checks

The UI shows:
- Backend status (Vault/Database)
- Health status
- Secrets count
- Vault version and status

### Logs

Monitor application logs for:
- Vault connection status
- Secret storage operations
- Fallback events

## Support

For issues:
1. Check Vault logs: `docker logs vault`
2. Check application logs
3. Verify network connectivity
4. Review Vault documentation: https://www.vaultproject.io/docs


