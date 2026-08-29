import { UploadService } from "./UploadService";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

export class LocalStorageAdapter implements UploadService {
  private baseDir: string;

  constructor(baseDir: string = "public/uploads") {
    this.baseDir = baseDir;
  }

  async uploadFile(file: File, pathPrefix: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure the directory exists
    const uploadDir = path.join(/* turbopackIgnore: true */ process.cwd(), this.baseDir, pathPrefix);
    await mkdir(uploadDir, { recursive: true });

    // Sanitize filename and add unique timestamp
    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const filename = `${Date.now()}-${originalName}`;
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return the public URL
    // e.g., baseDir is 'public/uploads', the URL should be '/uploads/pathPrefix/filename'
    const publicBase = this.baseDir.replace(/^public\//, "/");
    return `${publicBase.endsWith("/") ? publicBase.slice(0, -1) : publicBase}/${pathPrefix}/${filename}`;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      if (!url.startsWith("/")) {
        throw new Error("Invalid URL format for local storage");
      }
      // e.g., url is '/uploads/pathPrefix/filename', filePath is 'public/uploads/pathPrefix/filename'
      const relativePath = url.startsWith("/uploads/") ? url.replace(/^\//, "public/") : `public${url}`;
      const filePath = path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);
      await unlink(filePath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      // If file doesn't exist, we don't throw, just ignore it.
    }
  }
}
