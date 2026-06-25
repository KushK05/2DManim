import { createHash, createHmac } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';

type UploadVideoParams = {
  filePath: string;
  userId: string;
  jobId: string;
};

export type UploadVideoResult = {
  key: string;
  url: string;
  fileSize: number;
  contentType: string;
};

export class ObjectStorageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObjectStorageUploadError';
  }
}

export async function uploadRenderedVideo(params: UploadVideoParams): Promise<UploadVideoResult> {
  const config = getObjectStorageConfig();
  const key = `videos/${params.userId}/${params.jobId}/output.mp4`;
  const contentType = 'video/mp4';
  const [body, fileStats] = await Promise.all([
    readFile(params.filePath),
    stat(params.filePath),
  ]);

  const uploadUrl = buildUploadUrl(config, key);
  const headers = signS3PutRequest({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    url: uploadUrl,
    body,
    contentType,
  });

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new ObjectStorageUploadError(`S3 upload failed (${response.status}): ${details}`);
  }

  return {
    key,
    url: buildPublicUrl(config, key),
    fileSize: fileStats.size,
    contentType,
  };
}

function getObjectStorageConfig() {
  const bucket = process.env.OBJECT_STORAGE_BUCKET || process.env.S3_BUCKET;
  const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket) {
    throw new ObjectStorageUploadError('OBJECT_STORAGE_BUCKET is required when Docker rendering is enabled');
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new ObjectStorageUploadError('OBJECT_STORAGE_ACCESS_KEY_ID and OBJECT_STORAGE_SECRET_ACCESS_KEY are required when Docker rendering is enabled');
  }

  return {
    bucket,
    region: process.env.OBJECT_STORAGE_REGION || process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT || process.env.S3_ENDPOINT || '',
    accessKeyId,
    secretAccessKey,
    forcePathStyle: (process.env.OBJECT_STORAGE_FORCE_PATH_STYLE || process.env.S3_FORCE_PATH_STYLE) === 'true',
    publicBaseUrl: process.env.OBJECT_STORAGE_PUBLIC_BASE_URL || process.env.S3_PUBLIC_BASE_URL || '',
    cdnBaseUrl: process.env.CDN_BASE_URL || '',
  };
}

function buildUploadUrl(config: ReturnType<typeof getObjectStorageConfig>, key: string) {
  const endpoint = config.endpoint || `https://s3.${config.region}.amazonaws.com`;
  const url = new URL(endpoint);

  if (config.forcePathStyle) {
    url.pathname = joinUrlPath(url.pathname, config.bucket, key);
    return url;
  }

  url.hostname = `${config.bucket}.${url.hostname}`;
  url.pathname = joinUrlPath(url.pathname, key);
  return url;
}

function buildPublicUrl(config: ReturnType<typeof getObjectStorageConfig>, key: string) {
  const cdnBaseUrl = config.cdnBaseUrl.replace(/\/$/, '');

  if (cdnBaseUrl) {
    return `${cdnBaseUrl}/${encodeKeyPath(key)}`;
  }

  const publicBaseUrl = config.publicBaseUrl.replace(/\/$/, '');

  if (publicBaseUrl) {
    return `${publicBaseUrl}/${encodeKeyPath(key)}`;
  }

  return buildUploadUrl(config, key).toString();
}

function signS3PutRequest(params: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  url: URL;
  body: Buffer;
  contentType: string;
}) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(params.body);
  const host = params.url.host;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = [
    `content-type:${params.contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    '',
  ].join('\n');
  const canonicalRequest = [
    'PUT',
    encodeCanonicalUri(params.url.pathname),
    params.url.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const credentialScope = `${dateStamp}/${params.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = getSignatureKey(params.secretAccessKey, dateStamp, params.region, 's3');
  const signature = hmacHex(signingKey, stringToSign);

  return {
    Authorization: [
      `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', '),
    'Content-Type': params.contentType,
    'X-Amz-Content-Sha256': payloadHash,
    'X-Amz-Date': amzDate,
  };
}

function getSignatureKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const dateKey = hmacBuffer(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmacBuffer(dateKey, region);
  const dateRegionServiceKey = hmacBuffer(dateRegionKey, service);
  return hmacBuffer(dateRegionServiceKey, 'aws4_request');
}

function hmacBuffer(key: string | Buffer, data: string) {
  return createHmac('sha256', key).update(data).digest();
}

function hmacHex(key: Buffer, data: string) {
  return createHmac('sha256', key).update(data).digest('hex');
}

function sha256Hex(data: string | Buffer) {
  return createHash('sha256').update(data).digest('hex');
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function joinUrlPath(...parts: string[]) {
  return `/${parts
    .flatMap((part) => part.split('/'))
    .filter(Boolean)
    .join('/')}`;
}

function encodeKeyPath(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function encodeCanonicalUri(pathname: string) {
  return pathname.split('/').map((part) => encodeURIComponent(decodeURIComponent(part))).join('/');
}
