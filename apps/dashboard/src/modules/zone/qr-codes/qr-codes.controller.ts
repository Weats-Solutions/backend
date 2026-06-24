import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiAuthenticated, CurrentEstablishment, CurrentUser, RateLimit, Roles } from '@weats/common';
import { QrCodesService } from './qr-codes.service';
import { GenerateQrCodesDto, UpdateQrCodeDto, BulkUpdateQrCodesDto, BulkDeleteQrCodesDto, ResendQrCodesDto } from '@weats/contracts';
import { Establishment, User } from '@weats/types';
import { EmployeeRoles } from '@weats/database';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';


@ApiTags('QR Codes')
@Controller('zones/qr-codes')
export class QrCodesController {
    constructor(private readonly qrCodesService: QrCodesService) { }


    @Get()
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Listar todos os códigos QR do estabelecimento' })
    @ApiOkResponse({ description: 'Lista de códigos QR obtida com sucesso' })
    async getQrCodes(
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.qrCodesService.findAll(establishment.id);
    }

    @Roles(EmployeeRoles.MANAGER)
    @Post('generate')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Gerar e exportar novos códigos QR em lote' })
    @ApiCreatedResponse({ description: 'Códigos QR gerados com sucesso' })
    @RateLimit('STRICT') // 5 req/min — job pesado: gera ZIPs, envia email, consome Redis
    async generateQrCodes(
        @CurrentEstablishment() establishment: Establishment,
        @CurrentUser() user: User,
        @Body() dto: GenerateQrCodesDto,
    ) {
        return this.qrCodesService.generateQrCodes(
            dto,
            establishment,
            user.email,
        );
    }

    @Roles(EmployeeRoles.MANAGER)
    @Post('resend')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Reenviar ficheiro ZIP com códigos QR por email' })
    @ApiCreatedResponse({ description: 'Códigos QR reenviados com sucesso' })
    @RateLimit('STRICT') // job pesado
    async resendQrCodes(
        @CurrentEstablishment() establishment: Establishment,
        @CurrentUser() user: User,
        @Body() dto: ResendQrCodesDto,
    ) {
        return this.qrCodesService.resendQrCodes(
            dto,
            establishment,
            user.email,
        );
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch('bulk')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar múltiplos códigos QR em lote' })
    @ApiOkResponse({ description: 'Códigos QR atualizados com sucesso' })
    async bulkUpdateQrCodes(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: BulkUpdateQrCodesDto,
    ) {
        return this.qrCodesService.bulkUpdate(
            dto.ids,
            dto.data,
            establishment,
        );
    }

    @Roles(EmployeeRoles.MANAGER)
    @Delete('bulk')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover múltiplos códigos QR em lote' })
    @ApiOkResponse({ description: 'Códigos QR removidos com sucesso' })
    async bulkDeleteQrCodes(
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: BulkDeleteQrCodesDto,
    ) {
        return this.qrCodesService.bulkDelete(
            dto.ids,
            establishment,
        );
    }

    @Roles(EmployeeRoles.MANAGER)
    @Patch(':id')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar detalhes de um código QR específico' })
    @ApiParam({ name: 'id', description: 'ID do código QR' })
    @ApiOkResponse({ description: 'Código QR atualizado com sucesso' })
    async updateQrCode(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
        @Body() dto: UpdateQrCodeDto,
    ) {
        return this.qrCodesService.update(
            id,
            dto,
            establishment,
        );
    }

    @Roles(EmployeeRoles.MANAGER)
    @Delete(':id')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Remover um código QR específico' })
    @ApiParam({ name: 'id', description: 'ID do código QR' })
    @ApiOkResponse({ description: 'Código QR removido com sucesso' })
    async deleteQrCode(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.qrCodesService.delete(
            id,
            establishment,
        );
    }
}
