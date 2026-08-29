import { IStorageProvider } from './storage-provider';
import fs from 'fs/promises';
import path from 'path';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir: string = './public/uploads', baseUrl: string = '/uploads') {
    this.baseDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), baseDir);
    this.baseUrl = baseUrl;
    // Ensure base directory exists
    fs.mkdir(this.baseDir, { recursive: true }).catch(console.error);
  }

  async uploadFile(file: Buffer, filePath: string, _contentType: string): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file);
    
    return `${this.baseUrl}/${filePath.replace(/\\/g, '/')}`;
  }

  async deleteFile(pathOrUrl: string): Promise<boolean> {
    try {
      let filePath = pathOrUrl;
      // Strip baseUrl if it's a URL
      if (pathOrUrl.startsWith(this.baseUrl)) {
        filePath = pathOrUrl.slice(this.baseUrl.length + 1);
      }
      
      const fullPath = path.join(this.baseDir, filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Local file delete error:', error);
      return false;
    }
  }

  async getSignedUrl(filePath: string, _expiresInSeconds?: number): Promise<string> {
    // Local storage doesn't support signed URLs out of the box, return standard URL
    return `${this.baseUrl}/${filePath.replace(/\\/g, '/')}`;
  }
}
