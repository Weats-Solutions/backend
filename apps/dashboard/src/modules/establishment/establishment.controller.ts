import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { EstablishmentService } from './establishment.service';
import { CreateEstablishmentDto } from '@weats/contracts/dashboard/dtos/establishment';
import { User, Establishment } from '@weats/types';
import { CreateScheduleDto } from '@weats/contracts/dashboard/dtos/schedule';
import { UpdateEstablishmentGeneralSettingsDto, UpdateEstablishmentBrandingSettingsDto, UpdateEstablishmentSystemSettingsDto, UpdateEstablishmentDigitalSettingsDto, EstablishmentLanguageDto, UpdateEstablishmentBillingSettingsDto } from '@weats/contracts';
import { FaviconService } from '@weats/integrations/favicon/favicon.service';
import { UpdateEstablishmentFaviconDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-favicon';
import { UpdateEstablishmentModuleSettingsDto } from '@weats/contracts/dashboard/dtos/establishment/settings/update-establishment-module-settings.dto';
import { ApiAuthenticated, CurrentEstablishment, CurrentUser, ERRORS, RateLimit, Roles, SCHEDULE_VALIDATION_GROUPS, SkipActiveSubscription, SkipEstablishmentStaff } from '@weats/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Establishments')
@Controller('establishments')
export class EstablishmentController {
    constructor(
        private readonly establishmentService: EstablishmentService,
        private readonly faviconService: FaviconService,
    ) { }

    // -------------------------------------------------------------------------
    // Life Cycle
    // -------------------------------------------------------------------------

    @Post()
    @ApiAuthenticated({ requireEstablishment: false })
    @ApiOperation({ summary: 'Criar estabelecimento' })
    @ApiCreatedResponse({ description: 'Estabelecimento criado com sucesso' })
    @SkipActiveSubscription()
    @SkipEstablishmentStaff()
    @RateLimit('STRICT') // 5 req/min — criar establishment é raro e envolve Stripe + DB
    createEstablishment(
        @Body() createEstablishmentDto: CreateEstablishmentDto,
        @CurrentUser() user: User,
    ) {
        return this.establishmentService.createEstablishment(createEstablishmentDto, user);
    }

    @Delete('test/:id')
    @ApiOperation({ summary: 'Apagar estabelecimento de teste (Apenas em desenvolvimento)' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Estabelecimento apagado com sucesso' })
    async testDelete(@Param('id') id: string) {
        if (process.env.NODE_ENV !== 'development') {
            throw new ForbiddenException('This route is only available in development mode.');
        }

        return this.establishmentService.deleteEstablishmentTest(id);
    }


    @Roles()
    @Delete(':id/menu-cache')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Limpar cache do menu do estabelecimento' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Cache limpo com sucesso' })
    deleteEstablishmentMenuCache(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }

        return this.establishmentService.deleteEstablishmentMenuCache(id);
    }

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    @Get('verify-domain')
    @ApiOperation({ summary: 'Verificar disponibilidade de domínio (slug)' })
    @ApiQuery({ name: 'slug', required: true, description: 'Slug do domínio a verificar' })
    @ApiOkResponse({ description: 'Estado da verificação do domínio' })
    verifyDomain(
        @Query('slug') slug: string,
    ) {
        if (!slug) {
            throw new BadRequestException({
                message: ERRORS.BAD_REQUEST,
                code: ERRORS.BAD_REQUEST,
            });
        }
        return this.establishmentService.verifyDomain(slug);
    }

    @Roles()
    @SkipActiveSubscription()
    @Get(':id')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter informações do estabelecimento' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Informações do estabelecimento' })
    getEstablishmentInfo(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }

        return this.establishmentService.getEstablishmentInfo(id);
    }

    @SkipActiveSubscription()
    @Roles()
    @Get(':id/access')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter permissões de acesso do estabelecimento' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Permissões de acesso obtidas com sucesso' })
    getEstablishmentAccess(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        return this.establishmentService.getEstablishmentAccess(id);
    }

    @Roles()
    @Get(':id/schedule')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter horário do estabelecimento' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Horário do estabelecimento' })
    getEstablishmentSchedule(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.getEstablishmentSchedule(id);
    }

    // -------------------------------------------------------------------------
    // Modules Settings
    // -------------------------------------------------------------------------

    @Roles()
    @Get(':id/settings/modules')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter configurações de módulos' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações dos módulos' })
    getEstablishmentModulesSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.getEstablishmentModuleSettings(id);
    }



    @Roles()
    @Patch(':id/settings/modules')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar configurações de módulos' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações dos módulos atualizadas com sucesso' })
    updateEstablishmentModuleSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Body() updateEstablishmentModuleSettingsDto: UpdateEstablishmentModuleSettingsDto,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.updateEstablishmentModuleSettings(id, updateEstablishmentModuleSettingsDto);
    }

    // -------------------------------------------------------------------------
    // General Settings
    // -------------------------------------------------------------------------
  
    @Roles()
    @Get(':id/settings/general')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter configurações gerais' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações gerais do estabelecimento' })
    getEstablishmentGeneralSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.getEstablishmentGeneralSettings(id);
    }

    @Roles()
    @Patch(':id/settings/general')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar configurações gerais' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações gerais atualizadas com sucesso' })
    updateEstablishmentGeneralSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Body() updateEstablishmentGeneralSettingsDto: UpdateEstablishmentGeneralSettingsDto,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.updateEstablishmentGeneralSettings(establishment, updateEstablishmentGeneralSettingsDto);
    }

    // -------------------------------------------------------------------------
    // Branding Settings
    // -------------------------------------------------------------------------
    @Roles()
    @Get(':id/settings/branding')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter configurações de branding' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações de branding' })
    getEstablishmentBrandingSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.getEstablishmentBrandingSettings(id);
    }



    @Roles()
    @Patch(':id/settings/branding')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar configurações de branding' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações de branding atualizadas com sucesso' })
    updateEstablishmentBrandingSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Body() updateEstablishmentBrandingSettingsDto: UpdateEstablishmentBrandingSettingsDto,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.updateEstablishmentBrandingSettings(establishment, updateEstablishmentBrandingSettingsDto);
    }

    @Roles()
    @Get(':id/settings/favicon/job/:jobId')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter estado do job de processamento de favicon' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiParam({ name: 'jobId', description: 'ID do Job de processamento do favicon' })
    @ApiOkResponse({ description: 'Estado do job obtido com sucesso' })
    getEstablishmentFaviconJobStatus(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Param('jobId') jobId: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.faviconService.getJobStatus(jobId);

    }

    @Roles()
    @Post(':id/settings/favicon/process')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Iniciar processamento do favicon' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Processamento do favicon iniciado com sucesso' })
    @RateLimit('STRICT')
    processEstablishmentFavicon(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Body() updateEstablishmentFaviconDto: UpdateEstablishmentFaviconDto,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.faviconService.processFaviconFromImageId(updateEstablishmentFaviconDto.favicon.id, establishment.id);
    }

    // -------------------------------------------------------------------------
    // Billing Settings
    // -------------------------------------------------------------------------
    @Roles()
    @Get(':id/settings/billing')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter configurações de faturação' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações de faturação' })
    getEstablishmentBillingSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.getEstablishmentBillingSettings(id);
    }

    @Roles()
    @Patch(':id/settings/billing')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar configurações de faturação' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações de faturação atualizadas com sucesso' })
    updateEstablishmentBillingSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Body() updateEstablishmentBillingSettingsDto: UpdateEstablishmentBillingSettingsDto,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.updateEstablishmentBillingSettings(establishment, updateEstablishmentBillingSettingsDto);
    }

    // -------------------------------------------------------------------------
    // Digital Settings
    // -------------------------------------------------------------------------

    @Roles()
    @Get(':id/settings/digital')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter configurações digitais' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações digitais' })
    getEstablishmentDigitalSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.getEstablishmentDigitalSettings(establishment);
    }

    @Roles()
    @Patch(':id/settings/digital')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar configurações digitais' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações digitais atualizadas com sucesso' })
    updateEstablishmentDigitalSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Body() updateEstablishmentDigitalSettingsDto: UpdateEstablishmentDigitalSettingsDto,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.updateEstablishmentDigitalSettings(establishment, updateEstablishmentDigitalSettingsDto);
    }


    // -------------------------------------------------------------------------
    // System Settings
    // -------------------------------------------------------------------------

    @Roles()
    @Get(':id/settings/system')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter configurações de sistema' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações de sistema' })
    getEstablishmentSystemSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.getEstablishmentSystemSettings(establishment);
    }


    @Roles()
    @Patch(':id/settings/system')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar configurações de sistema' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Configurações de sistema atualizadas com sucesso' })
    updateEstablishmentSystemSettings(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Body() updateEstablishmentSystemSettingsDto: UpdateEstablishmentSystemSettingsDto,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.updateEstablishmentSystemSettings(establishment, updateEstablishmentSystemSettingsDto);
    }


    @Patch(':id/settings/languages')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar idiomas disponíveis do estabelecimento' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Idiomas atualizados com sucesso' })
    updateEstablishmentLanguages(
        @CurrentEstablishment() establishment: Establishment,
        @Param('id') id: string,
        @Body() updateEstablishmentLanguagesDto: EstablishmentLanguageDto,
    ) {
        if (establishment.id !== id) {
            throw new ForbiddenException({
                message: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
                code: ERRORS.ESTABLISHMENT_ACCESS_DENIED,
            });
        }
        return this.establishmentService.updateLanguages(establishment, updateEstablishmentLanguagesDto);
    }


    @Get('sync-status/:jobId')
    @ApiOperation({ summary: 'Obter estado de sincronização de idiomas' })
    @ApiParam({ name: 'jobId', description: 'ID do job de sincronização de idiomas' })
    @ApiOkResponse({ description: 'Estado da sincronização' })
    async getSyncStatus(@Param('jobId') jobId: string) {
        return this.establishmentService.getLanguageSyncStatus(jobId);
    }


    // -------------------------------------------------------------------------
    // Subscription
    // -------------------------------------------------------------------------

    @Get('subscription')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Obter estado da subscrição' })
    @ApiOkResponse({ description: 'Detalhes da subscrição' })
    getSubscription(@CurrentEstablishment() establishment: Establishment) {
        return this.establishmentService.getSubscription(establishment.id);

    }

    @SkipActiveSubscription()
    @Get('portal-session')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Criar sessão do portal de cliente Stripe' })
    @ApiOkResponse({ description: 'URL para o portal de faturação do Stripe' })
    getPortalSession(@CurrentEstablishment() establishment: Establishment) {
        return this.establishmentService.getPortalSession(establishment.id);
    }

    @SkipActiveSubscription()
    @Post('subscription')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Subscrever a um plano' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                planCycleId: { type: 'string', description: 'ID do ciclo de faturação do plano a subscrever' }
            },
            required: ['planCycleId']
        }
    })
    @ApiOkResponse({ description: 'Sessão de checkout ou subscrição criada com sucesso' })
    subscribeToPlan(
        @Body() { planCycleId }: { planCycleId: string },
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.establishmentService.subscribeToPlan(planCycleId, establishment);
    }

    @SkipActiveSubscription()
    @Get('cancel-subscription')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Cancelar a subscrição ativa' })
    @ApiOkResponse({ description: 'Subscrição cancelada com sucesso' })
    cancelSubscription(
        @CurrentEstablishment() establishment: Establishment,
        @CurrentUser() user: User,
    ) {
        return this.establishmentService.cancelSubscription(establishment.id, user);
    }


    // -------------------------------------------------------------------------
    // Others
    // -------------------------------------------------------------------------
    @UsePipes(new ValidationPipe({ groups: [SCHEDULE_VALIDATION_GROUPS.ESTABLISHMENT] }))
    @Roles()
    @Post(':id/schedule')
    @ApiAuthenticated()
    @ApiOperation({ summary: 'Atualizar horário do estabelecimento' })
    @ApiParam({ name: 'id', description: 'ID do estabelecimento' })
    @ApiOkResponse({ description: 'Horário atualizado com sucesso' })
    updateEstablishmentSchedule(
        @CurrentEstablishment() establishment: Establishment,
        @Body() updateEstablishmentScheduleDto: CreateScheduleDto,
    ) {
        return this.establishmentService.upsertEstablishmentSchedule(establishment, updateEstablishmentScheduleDto);
    }
}