import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { verify } from 'jsonwebtoken'
import { PrismaService } from '../../prisma/prisma.service'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const authorization = request.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少登录令牌')
    }

    const token = authorization.slice(7)
    const secret =
      this.configService.get<string>('JWT_SECRET') ?? 'CardVerse-dev-secret'

    try {
      const payload = verify(token, secret) as {
        sub: string
        username: string
      }
      const admin = await this.prisma.admin.findUnique({
        where: { id: BigInt(payload.sub) },
        select: {
          id: true,
          username: true,
          nickname: true,
          email: true,
          status: true,
          lastLoginAt: true,
        },
      })

      if (!admin || !admin.status) {
        throw new UnauthorizedException(
          '管理员不存在或已禁用',
        )
      }

      request.admin = admin
      return true
    } catch {
      throw new UnauthorizedException('登录令牌无效')
    }
  }
}
