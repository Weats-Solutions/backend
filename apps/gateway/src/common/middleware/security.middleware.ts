import { Injectable, NestMiddleware, ForbiddenException, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import { ThrottlerStorage } from '@nestjs/throttler';
import { THROTTLE_LIMITS } from '@weats/common';


@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SecurityMiddleware');
   constructor(
    @Inject(ThrottlerStorage) private readonly throttlerStorage: ThrottlerStorage
  ) {}

  // List of high-risk paths and patterns used by bots and scanners
  private readonly blacklist = [
    // --- Dotfiles & Sensitve Config ---
    '/.git', '/.env', '/.ssh', '/.aws', '/.ds_store', '/.production', '/.staging',
    '/src/.env', '/config.php', '/web.config', '/settings.php', '/local_settings.py',

    // --- Common CMS (WordPress, Joomla, Magento) ---
    '/wp-admin', '/wp-content', '/wp-includes', '/wp-config.php', '/wp-login.php',
    '/wordpress/', '/xmlrpc.php', '/administrator/', '/magento/',

    // --- DB & Admin Tools ---
    '/phpmyadmin', '/pma', '/adminer', '/sqlweb', '/mysql-admin', '/dbadmin',
    '/admin/index.php', '/backend/index.php',

    // --- Scanners & Monitoring ---
    '/.well-known/security.txt', '/cgi-bin/', '/shell', '/scripts/setup.php',
    '/actuator/health', // Java Spring scanners

    // --- Miscellaneous / Random Hacks ---
    '/bitrix/admin', '/laravel/.env', '/core/.env', '/api/.env'
  ];

  // Common sensitive extensions
  private readonly blacklistedExtensions = [
    '.php', '.sql', '.bak', '.zip', '.tar', '.gz', '.env', '.old', '.save'
  ];

  async use(req: Request, res: Response, next: NextFunction) {
    const rawUrl = req.originalUrl.toLowerCase();
    const url = path.posix.normalize(rawUrl);
    const ip = req.ip || req.get('x-forwarded-for') || 'unknown';
    // 1. SEMPRE incrementamos o contador de rate limit para este IP
    // Usamos o nome 'bots' que configurámos no throttle.ts
    // @ts-ignore - Reverting to old code for testing purposes
    const { totalHits } = await this.throttlerStorage.increment(ip, 60000); 
    // 2. Se já passou o limite de 15 (BOTS), nem verificamos a blacklist, barramos logo por 429
    if (totalHits > 15) {
      throw new HttpException('Too many suspicious requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    // 3. Se não passou o rate limit, mas está na blacklist, barramos por Forbidden (403)
    const isBlacklistedPath = this.blacklist.some(item => url.includes(item.toLowerCase()));
    const pathOnly = url.split('?')[0];
    const hasSuspiciousExtension = this.blacklistedExtensions.some(ext => pathOnly.endsWith(ext));
    if (isBlacklistedPath || hasSuspiciousExtension) {
      this.logger.warn(`🛡️ Blocked IP: ${ip} | ${req.method} ${req.originalUrl}`);
      throw new ForbiddenException('Access denied');
    }
    next();
  }
}

