# Secrets Management: Database Encryption vs HashiCorp Vault

## Overview

This document compares the two secrets management approaches available in the system:
1. **Database Encryption** (Default) - Encrypted storage in PostgreSQL
2. **HashiCorp Vault** (Optional) - Enterprise-grade secrets management

## Comparison Table

| Feature | Database Encryption | HashiCorp Vault |
|---------|-------------------|-----------------|
| **Setup Complexity** | ✅ Low - Built-in | ⚠️ Medium - Requires separate service |
| **Infrastructure** | ✅ No additional services | ⚠️ Requires Vault server |
| **Security** | ✅ Good - AES-256-GCM | ✅✅ Excellent - Industry standard |
| **Audit Logging** | ❌ Limited | ✅✅ Full audit trail |
| **Secret Rotation** | ⚠️ Manual | ✅✅ Automated support |
| **Dynamic Secrets** | ❌ Not supported | ✅✅ Supported |
| **Access Control** | ⚠️ Application-level | ✅✅ Fine-grained policies |
| **Secret Versioning** | ❌ Not supported | ✅✅ Built-in versioning |
| **Multi-Environment** | ⚠️ Manual config | ✅✅ Namespace support |
| **Performance** | ✅✅ Fast (local) | ✅ Good (network call) |
| **Backup/Recovery** | ✅ Database backup | ✅✅ Vault snapshots |
| **Compliance** | ⚠️ Basic | ✅✅ Enterprise-ready |
| **Cost** | ✅ Free | ✅ Open-source (free) |

## When to Use Each

### Use Database Encryption When:
- ✅ Small to medium deployments
- ✅ Simple secret management needs
- ✅ Limited infrastructure resources
- ✅ Quick setup required
- ✅ All secrets are application-level
- ✅ Single environment deployment

### Use HashiCorp Vault When:
- ✅ Enterprise deployments
- ✅ Multiple environments (dev/staging/prod)
- ✅ Compliance requirements (SOC2, HIPAA, etc.)
- ✅ Need for audit logging
- ✅ Dynamic secrets generation
- ✅ Fine-grained access control
- ✅ Secret rotation automation
- ✅ Multiple teams/services

## Architecture

### Database Encryption Flow
```
User Input → Encrypt (AES-256-GCM) → Store in PostgreSQL → Decrypt on Read
```

### HashiCorp Vault Flow
```
User Input → Store in Vault → Reference in Database → Retrieve from Vault on Read
```

## Security Comparison

### Database Encryption
- **Encryption**: AES-256-GCM with PBKDF2 key derivation
- **Key Management**: Environment variable (ENCRYPTION_KEY)
- **Access Control**: Application-level (admin role check)
- **Audit**: Application logs only
- **Backup**: Included in database backups

### HashiCorp Vault
- **Encryption**: Vault's internal encryption (AES-256-GCM)
- **Key Management**: Vault's key management system
- **Access Control**: Vault policies + application checks
- **Audit**: Full Vault audit log
- **Backup**: Vault snapshots + database references

## Migration Path

### From Database to Vault

1. **Enable Vault**:
   ```bash
   USE_VAULT=true
   VAULT_ADDR=http://localhost:8200
   VAULT_TOKEN=your-token
   ```

2. **Migrate Existing Secrets**:
   - Existing encrypted secrets remain in database
   - New secrets are stored in Vault
   - System automatically detects storage location

3. **Gradual Migration**:
   - Update secrets one by one
   - System supports both backends simultaneously
   - No downtime required

### From Vault to Database

1. **Disable Vault**:
   ```bash
   USE_VAULT=false
   ```

2. **Export Secrets** (if needed):
   - Use Vault CLI to export secrets
   - Re-encrypt using database encryption
   - Update database records

## Performance Considerations

### Database Encryption
- **Latency**: ~1-5ms (local database)
- **Throughput**: High (no network calls)
- **Scalability**: Limited by database performance

### HashiCorp Vault
- **Latency**: ~10-50ms (network call)
- **Throughput**: Good (Vault is optimized)
- **Scalability**: Excellent (Vault clustering)

## Cost Analysis

### Database Encryption
- **Infrastructure**: $0 (uses existing database)
- **Maintenance**: Low (built-in)
- **Total**: Free

### HashiCorp Vault
- **Infrastructure**: $0 (open-source, self-hosted)
- **Maintenance**: Medium (separate service)
- **Total**: Free (self-hosted) or ~$0.10/hour (cloud)

## Recommendations

### Development Environment
- **Recommended**: Database Encryption
- **Reason**: Simpler setup, faster iteration

### Staging Environment
- **Recommended**: HashiCorp Vault
- **Reason**: Mirrors production, tests Vault integration

### Production Environment
- **Small Scale (< 100 secrets)**: Database Encryption
- **Medium Scale (100-1000 secrets)**: Either works
- **Large Scale (> 1000 secrets)**: HashiCorp Vault
- **Enterprise/Compliance**: HashiCorp Vault

## Implementation Details

### Current System
- Supports both backends simultaneously
- Automatic fallback if Vault unavailable
- Transparent to application code
- Unified API via `SecretsManager`

### Code Example

```typescript
import { getSecretsManager } from '@/lib/secrets-manager'

const secretsManager = getSecretsManager()

// Store API key (works with both backends)
await secretsManager.storeApiKey('openai', 'sk-...')

// Retrieve API key (works with both backends)
const apiKey = await secretsManager.getApiKey('openai')

// Check which backend is active
const backend = secretsManager.getBackend() // 'vault' | 'database'
```

## Best Practices

### Database Encryption
1. ✅ Use strong ENCRYPTION_KEY (64 hex characters)
2. ✅ Rotate encryption key periodically
3. ✅ Secure environment variables
4. ✅ Regular database backups
5. ✅ Monitor access logs

### HashiCorp Vault
1. ✅ Use proper Vault policies
2. ✅ Enable audit logging
3. ✅ Regular Vault snapshots
4. ✅ Use namespaces for multi-tenant
5. ✅ Implement secret rotation
6. ✅ Monitor Vault health

## Conclusion

Both solutions are secure and production-ready. Choose based on your:
- **Scale**: Small → Database, Large → Vault
- **Compliance**: Basic → Database, Enterprise → Vault
- **Complexity**: Simple → Database, Advanced → Vault
- **Infrastructure**: Limited → Database, Available → Vault

The system supports both, so you can start with Database Encryption and migrate to Vault when needed.


