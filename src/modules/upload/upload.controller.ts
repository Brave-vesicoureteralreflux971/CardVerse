import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';

function normalizeFolder(input: string | undefined) {
  const folder = (input ?? 'common').trim().toLowerCase();

  if (!/^[a-z0-9-_]+$/.test(folder)) {
    throw new BadRequestException('上传目录不合法');
  }

  return folder;
}

@ApiTags('uploads')
@Controller('admin/uploads')
export class UploadController {
  @ApiConsumes('multipart/form-data')
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: { query?: Record<string, unknown> }, _file: { originalname?: string }, callback: (error: Error | null, destination: string) => void) => {
          try {
            const folder = normalizeFolder(String(req.query?.folder ?? 'common'));
            const destination = join(process.cwd(), 'uploads', folder);
            if (!existsSync(destination)) {
              mkdirSync(destination, { recursive: true });
            }
            callback(null, destination);
          } catch (error) {
            callback(error as Error, '');
          }
        },
        filename: (_req: unknown, file: { originalname?: string }, callback: (error: Error | null, filename: string) => void) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${suffix}${extname(file.originalname || '').toLowerCase()}`);
        },
      }),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
      fileFilter: (_req: unknown, file: { mimetype: string }, callback: (error: Error | null, acceptFile: boolean) => void) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('仅支持上传图片文件'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: { filename: string; mimetype: string; size: number } | undefined,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }

    const safeFolder = normalizeFolder(folder);

    return {
      url: `/uploads/${safeFolder}/${file.filename}`,
      folder: safeFolder,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
