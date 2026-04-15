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
import { AuthenticatedSocketData, ClientHelpRequestPayload, StaffHelpResponsePayload } from './realtime.types';
import { UsePipes, ValidationPipe, Logger } from '@nestjs/common';

@WebSocketGateway({
    namespace: 'realtime',
    cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(RealtimeGateway.name);

    constructor(
        private readonly rooms: RoomsService,
        private readonly realtimeService: RealtimeService,
    ) { }

    afterInit(server: Server) {
        server.use(async (socket: Socket<any, any, any, AuthenticatedSocketData>, next) => {
            try {
                // 🧑‍💼 STAFF (Dashboard)
                if (socket.handshake.auth?.token && socket.handshake.auth?.establishmentId) {
                    const token = socket.handshake.auth.token;
                    const establishmentId = socket.handshake.auth.establishmentId;
                    const result = await this.realtimeService.validateStaff(token, establishmentId);
                    
                    if (result) {
                        socket.data.user = result.user;
                        socket.data.role = result.role;
                        socket.data.establishmentId = result.establishmentId;
                        return next();
                    }
                    return next(new Error('Unauthorized Staff'));
                }

                // 👤 CLIENT (anonymous menu)
                if (socket.handshake.auth?.servicePointId) {
                    const servicePointId = socket.handshake.auth.servicePointId;
                    const result = await this.realtimeService.validateClient(servicePointId);
                    
                    if (result) {
                        socket.data.servicePointId = result.servicePointId;
                        socket.data.establishmentId = result.establishmentId;
                        return next();
                    }
                    return next(new Error('Invalid Service Point'));
                }

                return next(new Error('Missing Authentication'));
            } catch (err) {
                this.logger.error('Socket connection error', err);
                return next(new Error('Internal Server Error'));
            }
        });
    }

    handleConnection(socket: Socket<any, any, any, AuthenticatedSocketData>) {
        if (socket.data.user && socket.data.establishmentId) {
            // Staff
            socket.join(this.rooms.est(socket.data.establishmentId));
            this.logger.debug(`Staff ${socket.data.user.id} connected to establishment ${socket.data.establishmentId}`);
        } else if (socket.data.servicePointId && socket.data.establishmentId) {
            // Client
            socket.join(this.rooms.servicePoint(socket.data.establishmentId, socket.data.servicePointId));
            this.logger.debug(`Client connected to service point ${socket.data.servicePointId}`);
        }
    }

    // 💡 EVENTOS PRINCIPAIS

    // Cliente → Backend
    @UsePipes(new ValidationPipe({ transform: true }))
    @SubscribeMessage('help:request')
    handleHelpRequest(
        @ConnectedSocket() socket: Socket<any, any, any, AuthenticatedSocketData>,
        @MessageBody() payload: ClientHelpRequestPayload,
    ) {
        if (!socket.data.servicePointId || !socket.data.establishmentId) {
            return { error: 'Apenas clientes podem pedir ajuda' };
        }

        const establishmentId = socket.data.establishmentId;
        const estRoom = this.rooms.est(establishmentId);

        // Backend → Staff
        this.server.to(estRoom).emit('help:requested', {
            servicePointId: socket.data.servicePointId,
            message: payload?.message || 'Pedido de ajuda',
            timestamp: new Date().toISOString(),
        });
        
        return { success: true };
    }

    // Staff → Backend
    @UsePipes(new ValidationPipe({ transform: true }))
    @SubscribeMessage('help:response')
    handleHelpResponse(
        @ConnectedSocket() socket: Socket<any, any, any, AuthenticatedSocketData>,
        @MessageBody('servicePointId') servicePointId: string,
        @MessageBody('message') message?: string,
    ) {
        if (!socket.data.user || !socket.data.establishmentId) {
            return { error: 'Apenas staff pode responder a pedidos de ajuda' };
        }

        if (!servicePointId) {
            return { error: 'servicePointId obrigatório' };
        }

        const spRoom = this.rooms.servicePoint(socket.data.establishmentId, servicePointId);

        // Backend → Cliente
        this.server.to(spRoom).emit('help:status', {
            status: 'RESPONDED',
            message: message || 'A caminho!',
            staffName: socket.data.user.firstName || 'Staff',
            timestamp: new Date().toISOString(),
        });
        
        return { success: true };
    }
}
