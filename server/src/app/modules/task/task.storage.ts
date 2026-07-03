import path from "path";
import fs from "fs";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import config from "../../config";

export interface StorageService {
  upload(filePath: string, filename: string, mimeType: string): Promise<string>;
  delete(url: string): Promise<void>;
}

const isS3Configured = (): boolean => {
  return Boolean(
    config.r2.accountId &&
    config.r2.accessKeyId &&
    config.r2.secretAccessKey &&
    config.r2.bucketName &&
    config.r2.publicUrl
  );
};

class R2Storage implements StorageService {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKeyId!,
        secretAccessKey: config.r2.secretAccessKey!,
      },
    });
    this.bucket = config.r2.bucketName!;
    this.publicUrl = config.r2.publicUrl!.replace(/\/$/, "");
  }

  async upload(filePath: string, filename: string, _mimeType: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: fileContent,
        ContentType: _mimeType,
      })
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return `${this.publicUrl}/${filename}`;
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith(this.publicUrl)) return;

    const key = url.replace(`${this.publicUrl}/`, "");
    if (!key) return;

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch {
      // File may not exist in R2 — ignore
    }
  }
}

class LocalStorage implements StorageService {
  async upload(filePath: string, _filename: string, _mimeType: string): Promise<string> {
    return path.join("uploads", "tasks", _filename);
  }

  async delete(url: string): Promise<void> {
    const fullPath = path.join(process.cwd(), url);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

let instance: StorageService | null = null;

export const getStorage = (): StorageService => {
  if (!instance) {
    instance = isS3Configured() ? new R2Storage() : new LocalStorage();
  }
  return instance;
};
