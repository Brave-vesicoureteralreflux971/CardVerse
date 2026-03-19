import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { compareSync } from 'bcrypt'
import { sign } from 'jsonwebtoken'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  async login(payload: LoginDto) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        username: payload.username,
        status: true,
      },
    })

    if (!admin || !compareSync(payload.password, admin.passwordHash)) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    const now = new Date()
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: now },
    })

    const secret =
      this.configService.get<string>('JWT_SECRET') ?? 'CardVerse-dev-secret'
    const token = sign(
      {
        sub: admin.id.toString(),
        username: admin.username,
      },
      secret,
      { expiresIn: '7d' },
    )

    return {
      token,
      tokenType: 'Bearer',
      expiresIn: 7 * 24 * 60 * 60,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        nickname: admin.nickname,
        lastLoginAt: now,
      },
    }
  }

  async profile(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: BigInt(adminId) },
      select: {
        id: true,
        username: true,
        nickname: true,
        email: true,
        status: true,
        lastLoginAt: true,
      },
    })

    if (!admin) {
      throw new UnauthorizedException('管理员不存在')
    }

    return admin
  }
}
