
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Startup Check] Starting connectivity checks...');

    // 1. Check Database Connection
    try {
      const { prisma } = await import('@/lib/db');
      console.log('[Startup Check] Testing Database connection...');
      await prisma.$queryRaw`SELECT 1`;
      console.log('[Startup Check] ✅ Database connection successful');
    } catch (error: any) {
      console.error('[Startup Check] ❌ Database connection failed:', error.message);
      if (error?.stack) console.error(error.stack);
    }

    // 2. Check MinIO/S3 Connection
    try {
      const { getS3Client } = await import('@/lib/s3');
      const { ListBucketsCommand } = await import('@aws-sdk/client-s3');
      
      console.log('[Startup Check] Testing MinIO/S3 connection...');
      const s3Client = await getS3Client();
      const result = await s3Client.send(new ListBucketsCommand({}));
      
      console.log(`[Startup Check] ✅ MinIO/S3 connection successful. Found ${result.Buckets?.length || 0} buckets.`);
    } catch (error: any) {
      console.error('[Startup Check] ❌ MinIO/S3 connection failed:', error.message);
      console.error('[Startup Check] Full Error Details:', JSON.stringify(error, null, 2));
      if (error?.stack) console.error(error.stack);
    }
    
    console.log('[Startup Check] Connectivity checks completed.');
  }
}
