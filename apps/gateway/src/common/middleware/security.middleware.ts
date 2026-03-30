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

    // 1. Verificamos primeiro se a requisição atual já é de um caminho proibido
    const isBlacklistedPath = this.blacklist.some(item => url.includes(item.toLowerCase()));
    const pathOnly = url.split('?')[0];
    const hasSuspiciousExtension = this.blacklistedExtensions.some(ext => pathOnly.endsWith(ext));

    // 2. Definimos os parâmetros do throttler (se for blacklist, o limite é ZERO para banir na hora)
    const isSuspicious = isBlacklistedPath || hasSuspiciousExtension;
    const ttl = isSuspicious ? 60000 : THROTTLE_LIMITS.BOTS.ttl;
    const limit = isSuspicious ? 0 : THROTTLE_LIMITS.BOTS.limit;
    const blockDuration = isSuspicious ? 60000 : THROTTLE_LIMITS.BOTS.ttl;

    // 3. Uma única chamada ao storage
    const { totalHits, isBlocked } = await this.throttlerStorage.increment(
      ip,
      ttl,
      limit,
      blockDuration,
      'bots',
    );

    // 4. Se estiver bloqueado ou exceder o limite, barramos
    if (isBlocked || totalHits > limit) {
      this.logger.warn(`🚫 Blocked IP (Rate Limit/Ban): ${ip} | Hits: ${totalHits}`);
      
      // Se foi por causa da blacklist (ou já estava banido por ela), logamos o motivo específico
      if (isSuspicious) {
        this.logger.error(`🛡️ Blacklist Hit - BANNING IP: ${ip} | ${req.method} ${req.originalUrl}`);
        throw new ForbiddenException('Access denied');
      }
      
      throw new HttpException('Too many suspicious requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}

