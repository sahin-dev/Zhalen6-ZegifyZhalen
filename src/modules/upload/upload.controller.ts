import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

interface UploadedAsset {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

@Controller('uploads')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: UploadedAsset | undefined,
    @Req() request: Request,
  ) {
    if (!file) throw new BadRequestException('A file is required');
    if (!allowedTypes.has(file.mimetype))
      throw new BadRequestException('Unsupported file type');
    const filename = `${Date.now()}-${randomUUID()}${extensionByMimeType[file.mimetype]}`;
    const uploadDirectory = join(process.cwd(), 'uploads');
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(join(uploadDirectory, filename), file.buffer);
    return {
      url: `${request.protocol}://${request.get('host')}/uploads/${filename}`,
      mime_type: file.mimetype,
      size: file.size,
    };
  }
}
