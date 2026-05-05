import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { RealtimeService } from './realtime.service';
import { AuthenticatedSocketData, ClientCallPayload, StaffCallResponsePayload } from './realtime.types';
import { RealtimeCallStatus, RealtimeMessageCode } from '@weats/contracts';
import { RealtimeStateService } from './state.service';
import { UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

@WebSocketGateway({
    namespace: 'realtime',
    cors: { origin: '*' },
    pingInterval: 15000,  // Ping a cada 15 segundos
    pingTimeout: 20000,   // Espera 20 segundos pela resposta (Total: 35s)
})
export class RealtimeGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(RealtimeGateway.name);
    private static readonly DISCONNECT_GRACE_MS = 5 * 60 * 1000;

    constructor(
        private readonly rooms: RoomsService,
        private readonly realtimeService: RealtimeService,
        private readonly stateService: RealtimeStateService,
    ) { }

    afterInit(server: Server) {
        server.use(async (socket: Socket<any, any, any, AuthenticatedSocketData>, next) => {
            try {
                // Suporte flexível para leitura de auth via cliente nativo, headers (Postman) ou Query URL
                const inToken = (socket.handshake.auth?.token || socket.handshake.headers['authorization']?.replace('Bearer ', '') || socket.handshake.query?.token) as string;
                const inEstId = (socket.handshake.auth?.establishmentId || socket.handshake.headers['establishmentid'] || socket.handshake.query?.establishmentId) as string;
                const inSpId = (socket.handshake.auth?.servicePointId || socket.handshake.headers['servicepointid'] || socket.handshake.query?.servicePointId) as string;
                const cookieHeader = socket.handshake.headers['cookie'];
                const inQrSession = (socket.handshake.auth?.qrSession || this.extractCookieValue(Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader, 'qr_session')) as string | undefined;

                const cleanEstId = inEstId?.trim();
                const cleanSpId = inSpId?.trim();

                this.logger.debug(`--- 🛡️ MIDDLEWARE AUDIT ---`);
                this.logger.debug(`| Token Presente: ${!!inToken}`);
                this.logger.debug(`| QR Session Presente: ${!!inQrSession}`);
                this.logger.debug(`| EstID: [${cleanEstId}]`);
                this.logger.debug(`| SpID: [${cleanSpId}]`);
                this.logger.debug(`--------------------------`);

                // 🧑‍💼 STAFF (Dashboard)
                if (inToken && cleanEstId) {
                    const result = await this.realtimeService.validateStaff(inToken, cleanEstId);

                    if (result) {
                        socket.data.user = result.user;
                        socket.data.role = result.role;
                        socket.data.establishmentId = result.establishmentId.trim();
                        return next();
                    }
                    return next(new Error('Unauthorized Staff'));
                }

                // 👤 CLIENT (menu com sessão QR em cookie)
                const clientValidation = inQrSession
                    ? await this.realtimeService.validateClientSession(inQrSession)
                    : cleanSpId
                        ? await this.realtimeService.validateClient(cleanSpId)
                        : null;

                if (clientValidation) {
                    const result = clientValidation;

                    const clientIp = this.resolveClientIp(socket);

                    // 🔑 ID ÚNICO POR DISPOSITIVO: Priorizar o ID que vem do browser (localStorage)
                    const clientId = (socket.handshake.auth?.clientId as string) || createHash('md5').update(clientIp).digest('hex').substring(0, 8);

                    // 🛡️ BLOQUEAR DUPLICAÇÃO (MICRO-LOCK)
                    // Como fetchSockets é async, se o cliente enviar 10 conexões ao mesmo tempo,
                    // todas podem passar se não usarmos um lock síncrono local.
                    if (this.connectingClients.has(clientId)) {
                        this.logger.warn(`[LIMIT] Conexão ignorada (bloqueada pelo lock síncrono): ${clientId}`);
                        return next(new Error('Conexão em curso...'));
                    }
                    this.connectingClients.add(clientId);

                    const spRoom = this.rooms.servicePoint(result.establishmentId, result.servicePointId);

                    try {
                        const connectedSockets = await server.in(spRoom).fetchSockets();

                        // 🛡️ BLOQUEAR DUPLICAÇÃO REAL
                        const alreadyConnected = connectedSockets.find(s => (s.data as AuthenticatedSocketData).clientId === clientId);
                        if (alreadyConnected) {
                            this.logger.warn(`[LIMIT] Bloqueada conexão duplicada para Client ${clientId} na Mesa ${result.servicePointName}.`);
                            return next(new Error('Já existe uma conexão ativa neste dispositivo.'));
                        }

                        const MARGIN = 2;
                        if (connectedSockets.length >= (result.maxCapacity + MARGIN)) {
                            this.logger.warn(`[LIMIT] Bloqueada nova conexão para Mesa ${result.servicePointName}. Já existem ${connectedSockets.length} ligados.`);
                            return next(new Error('Mesa cheia (limite de conexões excedido)'));
                        }

                        socket.data.servicePointId = result.servicePointId;
                        socket.data.establishmentId = result.establishmentId.trim();
                        socket.data.servicePointName = result.servicePointName;
                        socket.data.zoneId = result.zoneId;
                        socket.data.zoneName = result.zoneName;
                        socket.data.maxCapacity = result.maxCapacity;

                        // 🛡️ Impedir conexão se já estiver banido (IP ou ID)
                        const isIpBanned = this.blockedIPs.has(clientIp) && Date.now() < (this.blockedIPs.get(clientIp) || 0);
                        const isIdBanned = this.blockedClientIds.has(clientId) && Date.now() < (this.blockedClientIds.get(clientId) || 0);

                        if (isIpBanned || isIdBanned) {
                            this.logger.warn(`[SHIELD] Conexão abortada: ${clientIp} (${clientId}) tentou entrar mas está banido.`);
                            return next(new Error('REALTIME_ERR_IP_BAN'));
                        }

                        socket.data.clientId = clientId;
                        return next();
                    } finally {
                        // Remover do lock após o await (quer tenha sucesso ou falha)
                        this.connectingClients.delete(clientId);
                    }
                }

                if (inQrSession) {
                    return next(new Error('Invalid QR Session'));
                }

                if (cleanSpId) {
                    return next(new Error('Invalid Service Point'));
                }

                return next(new Error('Missing Authentication'));
            } catch (err) {
                this.logger.error('Socket connection error', err);
                return next(new Error('Internal Server Error'));
            }
        });
    }

    async handleConnection(socket: Socket<any, any, any, AuthenticatedSocketData>) {
        const estId = socket.data.establishmentId;

        if (socket.data.user && estId) {
            // Staff
            socket.join(this.rooms.est(estId));

            this.logger.log(`\n[LOGIN] 🧑‍💼 STAFF/ADMIN LIGADO`);
            console.log(`| Nome: ${socket.data.user.firstName} ${socket.data.user.lastName || ''}`);
            console.log(`| Email: ${socket.data.user.email}`);
            console.log(`| Estabelecimento ID: [${estId}]`);
            console.log(`| Socket ID: ${socket.id}`);
            console.log(`------------------------------\n`);

            // 🔄 SINCRONIZAÇÃO: Enviar pedidos ativos salvos no Redis
            setTimeout(async () => {
                const activeCalls = await this.stateService.getActiveCalls(estId);
                console.log(`\n--- 📡 SENDING SNAPSHOT ---`);
                console.log(`| Est ID: [${estId}]`);
                console.log(`| Count: ${activeCalls.length}`);
                console.log(`| Data:`, JSON.stringify(activeCalls, null, 2));
                console.log(`---------------------------\n`);
                socket.emit('call:snapshot', activeCalls);
            }, 500);
        } else if (socket.data.servicePointId && estId) {
            // Client
            const spId = socket.data.servicePointId;
            const clientId = socket.data.clientId;

            if (clientId) {
                this.cancelPendingDisconnectCleanup(estId, spId, clientId);
            }

            socket.join(this.rooms.servicePoint(estId, spId));
            this.logger.debug(`Client connected to service point ${spId}`);
        }
    }

    async handleDisconnect(socket: Socket<any, any, any, AuthenticatedSocketData>) {
        const estId = socket.data.establishmentId;
        const spId = socket.data.servicePointId;
        const clientId = socket.data.clientId;

        if (socket.data.user) {
            this.logger.log(`[EXIT] Staff ${socket.data.user.id} saiu do estabelecimento ${estId}`);
        } else if (spId && estId) {
            this.logger.log(`[EXIT] Client ${clientId} saiu da Mesa ${socket.data.servicePointName || spId}`);

            // 🧹 LIMPEZA AUTOMÁTICA: Se o cliente saiu, apagar os seus pedidos ativos no Redis
            await this.stateService.removeActiveCall(estId, spId, clientId);

            // Notificar o Dashboard para remover o pedido do ecrã
            this.server.to(this.rooms.est(estId)).emit('call:removed', {
                servicePointId: spId,
                clientId
            });

            // Auditoria rápida: quantas pessoas restam?
            const spRoom = this.rooms.servicePoint(estId, spId);
            const remaining = await this.server.in(spRoom).fetchSockets();
            this.logger.debug(`[STATS] Mesa ${socket.data.servicePointName || spId} agora tem ${remaining.length} sockets ativos.`);
        }
    }

    private lastCallTimestamps = new Map<string, number>();
    private blockedIPs = new Map<string, number>(); // IP -> expiration timestamp
    private ipStrikes = new Map<string, number>(); // IP -> consecutive violations count
    private blockedServicePoints = new Map<string, number>(); // SP_ID -> expiration timestamp
    private blockedClientIds = new Map<string, number>(); // ClientID (Hash) -> expiration timestamp

    // 🛡️ LOCKS para evitar Race Conditions durante spam
    private processingClients = new Set<string>(); // Clients com pedido em curso
    private connectingClients = new Set<string>(); // Clients em processo de middleware/conexão
    private pendingDisconnectCleanup = new Map<string, NodeJS.Timeout>(); // est:sp:client -> timer

    // 💡 EVENTOS PRINCIPAIS

    // Cliente → Backend
    @UsePipes(new ValidationPipe({ transform: true }))
    @SubscribeMessage('call:request')
    async handleClientCall(
        @ConnectedSocket() socket: Socket<any, any, any, AuthenticatedSocketData>,
        @MessageBody() payload: ClientCallPayload,
    ) {
        if (!socket.data.servicePointId || !socket.data.establishmentId) {
            return { error: 'Apenas clientes podem fazer chamadas' };
        }

        const spId = socket.data.servicePointId;
        const clientId = socket.data.clientId || '';

        // --- 🛡️ LOCK ATÓMICO (SINCRONO) ---
        // Se já houver um pedido síncrono em curso para este clientId, bloqueamos imediatamente.
        if (this.processingClients.has(clientId)) {
            return { error: 'REQUEST_OVERLAP', spam: true };
        }
        this.processingClients.add(clientId);

        try {
            // --- 🛡️ SHIELD: BLOQUEIO DE SERVICE POINT (ADMIN) ---
            const spBanExpiration = this.blockedServicePoints.get(spId);
            if (spBanExpiration && Date.now() < spBanExpiration) {
                this.logger.warn(`[SHIELD] 🛑 MESA BLOQUEADA POR ADMIN: ${spId}`);
                return { error: 'REALTIME_ERR_SP_BLOCKED', blocked: true };
            }

            // --- 🛡️ SHIELD: BLOQUEIO DE IP / CLIENTE ---
            const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
            const clientIp = Array.isArray(ip) ? (ip as string[])[0] : (ip as string);

            const banExpiration = this.blockedIPs.get(clientIp);
            const clientBanExpiration = this.blockedClientIds.get(clientId);

            if ((banExpiration && Date.now() < banExpiration) || (clientBanExpiration && Date.now() < clientBanExpiration)) {
                this.logger.error(`[SHIELD] 🛑 REJEITADO: ${clientIp} (${clientId}) está banido.`);
                return { error: 'REALTIME_ERR_IP_BAN', blocked: true };
            }

            // --- 🛡️ SISTEMA ANTI-SPAM (THROTTLE) POR DISPOSITIVO ---
            const THROTTLE_MS = 60000;
            const now = Date.now();
            const lastCall = this.lastCallTimestamps.get(clientId);

            if (lastCall && (now - lastCall) < THROTTLE_MS) {
                const remainingSec = Math.ceil((THROTTLE_MS - (now - lastCall)) / 1000);
                const strikes = (this.ipStrikes.get(clientIp) || 0) + 1;
                this.ipStrikes.set(clientIp, strikes);

                if (strikes >= 5) {
                    const ONE_HOUR = 3600000;
                    this.blockedIPs.set(clientIp, now + ONE_HOUR);
                    this.logger.error(`[SHIELD] 🚨 BANIMENTO ATIVADO: IP ${clientIp} banido por 1 hora por spam massivo.`);
                    socket.disconnect(true);
                    return { error: RealtimeMessageCode.SPAM_PROTECTION, blocked: true };
                }

                this.logger.warn(`[ANTI-SPAM] 🔴 VIOLAÇÃO: Client ${clientId} na Mesa ${spId}. Aguarde ${remainingSec}s. Strike ${strikes}/5.`);
                return {
                    error: RealtimeMessageCode.THROTTLE_ERROR,
                    spam: true,
                    remaining: remainingSec
                };
            }

            // Se o pedido passou (não é spam), reseta os strikes deste IP e guarda o timestamp IMEDIATAMENTE
            this.ipStrikes.set(clientIp, 0);
            this.lastCallTimestamps.set(clientId, now);

            this.logger.debug(`[ANTI-SPAM] ✅ PERMITIDO. Client: ${clientId} (Mesa: ${spId})`);

            const establishmentId = socket.data.establishmentId;
            const estRoom = this.rooms.est(establishmentId);

            // Se não enviar o tipo, assumimos "HELP" como fallback de compatibilidade
            const callType = payload?.type || 'HELP';

            // Mapear o tipo de chamada para uma mensagem automática se não houver mensagem custom
            let defaultMsg = 'REALTIME_MSG_NEED_HELP';
            if (callType === 'BILL') defaultMsg = 'REALTIME_MSG_NEED_BILL';
            else if (callType === 'ORDER') defaultMsg = 'REALTIME_MSG_NEED_ORDER';
            else if (callType === 'CLEAN') defaultMsg = 'REALTIME_MSG_NEED_CLEAN';

            const callPayload = {
                servicePointId: socket.data.servicePointId,
                establishmentId: establishmentId, // Adicionamos no payload para o snapshot
                servicePointName: socket.data.servicePointName,
                zoneId: socket.data.zoneId,
                zoneName: socket.data.zoneName,
                clientId: clientId,
                type: callType,
                message: payload?.message || defaultMsg,
                timestamp: new Date().toISOString(),
            };

            console.log(`\n--- 🔔 NEW CALL REQUEST ---`);
            console.log(`| From Mesa: ${socket.data.servicePointName}`);
            console.log(`| Est ID: [${establishmentId.trim()}]`);
            console.log(`| Type: ${callType}`);
            console.log(`---------------------------\n`);

            // Backend → Staff
            this.server.to(estRoom).emit('call:requested', callPayload);

            // 💾 PERSISTÊNCIA: Guardar no Redis como pedido ativo
            await this.stateService.saveActiveCall(establishmentId, socket.data.servicePointId, clientId, callPayload);

            return { success: true };
        } finally {
            // Libertar o lock síncrono aconteça o que acontecer
            this.processingClients.delete(clientId);
        }
    }

    // Staff → Backend
    @UsePipes(new ValidationPipe({ transform: true }))
    @SubscribeMessage('call:response')
    async handleStaffResponse(
        @ConnectedSocket() socket: Socket<any, any, any, AuthenticatedSocketData>,
        @MessageBody() payload: StaffCallResponsePayload,
    ) {
        if (!socket.data.user || !socket.data.establishmentId) {
            return { error: 'Apenas staff pode responder a chamadas' };
        }

        if (!payload || !payload.servicePointId) {
            return { error: 'servicePointId obrigatório no corpo' };
        }

        const spRoom = this.rooms.servicePoint(socket.data.establishmentId, payload.servicePointId);

        // Backend → Cliente
        this.server.to(spRoom).emit('call:status', {
            status: RealtimeCallStatus.RESPONDED,
            message: payload.message || RealtimeMessageCode.STAFF_ON_WAY,
            staffName: socket.data.user.firstName || 'Staff',
            timestamp: new Date().toISOString(),
        });

        // 🧹 LIMPEZA: Remover do Redis pois foi aceite/respondido
        await this.stateService.removeActiveCall(socket.data.establishmentId, payload.servicePointId, payload.clientId);

        return { success: true };
    }

    // Admin → Backend (Bloquear Mesa)
    @UsePipes(new ValidationPipe({ transform: true }))
    @SubscribeMessage('admin:block:sp')
    handleAdminBlock(
        @ConnectedSocket() socket: Socket<any, any, any, AuthenticatedSocketData>,
        @MessageBody('servicePointId') servicePointId: string,
        @MessageBody('durationMinutes') durationMinutes?: number,
    ) {
        if (!socket.data.user || !socket.data.establishmentId) {
            return { error: 'Apenas staff pode bloquear mesas' };
        }

        if (!servicePointId) return { error: 'servicePointId obrigatório' };

        const duration = (durationMinutes || 15) * 60 * 1000;
        this.blockedServicePoints.set(servicePointId, Date.now() + duration);

        this.logger.error(`[ADMIN] 🛡️ MESA BLOQUEADA MANUALMENTE: ${servicePointId} por ${durationMinutes || 15} min.`);

        const spRoom = this.rooms.servicePoint(socket.data.establishmentId, servicePointId);
        this.server.to(spRoom).emit('call:status', {
            status: RealtimeCallStatus.BLOCKED,
            message: RealtimeMessageCode.MESA_BLOQUEADA,
            timestamp: new Date().toISOString(),
        });

        return { success: true, expiresAt: new Date(Date.now() + duration).toISOString() };
    }

    // Admin → Backend (Bloquear Dispositivo Específico)
    @UsePipes(new ValidationPipe({ transform: true }))
    @SubscribeMessage('admin:block:client')
    handleAdminBlockClient(
        @ConnectedSocket() socket: Socket<any, any, any, AuthenticatedSocketData>,
        @MessageBody('clientId') clientId: string,
        @MessageBody('durationMinutes') durationMinutes?: number,
    ) {
        if (!socket.data.user || !socket.data.establishmentId) {
            return { error: 'Apenas staff pode bloquear clientes' };
        }

        if (!clientId) return { error: 'clientId obrigatório' };

        const duration = (durationMinutes || 60) * 60 * 1000;
        const expiration = Date.now() + duration;

        // 1. Banir o ID do Dispositivo
        this.blockedClientIds.set(clientId, expiration);

        // 2. Tentar encontrar e banir o IP associado a este clientId
        // Limitamos a busca à sala do estabelecimento para evitar varrer todo o namespace.
        const estRoom = this.rooms.est(socket.data.establishmentId);
        this.server.in(estRoom).fetchSockets().then(sockets => {
            sockets.forEach(s => {
                if (s.data.clientId === clientId) {
                    const clientIp = this.resolveClientIp(s);
                    this.blockedIPs.set(clientIp, expiration);

                    // Notificar o cliente banido e desligar
                    s.emit('call:status', {
                        status: RealtimeCallStatus.BLOCKED,
                        message: RealtimeMessageCode.IP_BANIDO,
                        timestamp: new Date().toISOString()
                    });
                    s.disconnect(true);
                }
            });
        });

        this.logger.error(`[ADMIN] 🛡️ IP/CLIENT BLOQUEADO MANUALMENTE: ${clientId} por ${durationMinutes || 60} min.`);

        return { success: true, expiresAt: new Date(expiration).toISOString() };
    }

    private extractCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
        if (!cookieHeader) {
            return undefined;
        }

        const entries = cookieHeader.split(';');
        for (const entry of entries) {
            const [rawKey, ...rawValue] = entry.trim().split('=');
            if (rawKey === name) {
                return decodeURIComponent(rawValue.join('='));
            }
        }

        return undefined;
    }

    private resolveClientIp(socket: Socket<any, any, any, AuthenticatedSocketData>): string {
        const forwardedFor = socket.handshake.headers['x-forwarded-for'];

        if (Array.isArray(forwardedFor)) {
            return forwardedFor[0];
        }

        if (typeof forwardedFor === 'string') {
            return forwardedFor.split(',')[0].trim();
        }

        return socket.handshake.address;
    }

    // 🔓 MÉTODOS DE EMERGÊNCIA (Chamados pelo Controller)
    clearAllBans() {
        this.blockedIPs.clear();
        this.blockedClientIds.clear();
        this.blockedServicePoints.clear();
        this.ipStrikes.clear();
        this.lastCallTimestamps.clear(); // Limpar também os throttles para debug/emergência
        this.processingClients.clear();
        this.connectingClients.clear();
        this.logger.log('🔓 [EMERGENCY] Todos os banimentos e locks foram removidos.');
    }
}
