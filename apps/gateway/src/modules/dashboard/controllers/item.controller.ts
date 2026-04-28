// src/items/item.controller.ts
import { Controller, Post, Put, Body, Param, Get, Query, Delete, Patch, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { CreateItemDto, UpdateItemDto, BulkStatusDto, BulkDeleteDto, GetItemsQueryDto } from '@weats/contracts';
import { UseGuards } from '@nestjs/common';
import { ClerkGuard, EstablishmentStaffGuard, CurrentEstablishment, RequiresFeature, FeatureLimitGuard } from '@weats/common';
import { Establishment } from '@weats/types';
import { DASHBOARD_SERVICE } from '@weats/common';
import { ClientProxy } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common/patterns/dashboard.patterns';
import { feature } from '@weats/types';

@Controller('items')
@UseGuards(ClerkGuard, EstablishmentStaffGuard)
export class ItemController {
    constructor(
        @Inject(DASHBOARD_SERVICE) private readonly dashboardClient: ClientProxy) { }


    @Post()
    @RequiresFeature(feature.products)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard, FeatureLimitGuard)
    async createItem(@CurrentEstablishment() establishment: Establishment, @Body() createItemDto: CreateItemDto) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_CREATE, { establishmentId: establishment.id, createItemDto });
    }

    @Put(':id')
    async updateItem(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
        @Body() updateItemDto: UpdateItemDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_UPDATE, { id, establishment, updateItemDto });
    }

    @Get('establishment')
    async getItems(
        @CurrentEstablishment() establishment: Establishment,
        @Query() query: GetItemsQueryDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_GET_ALL, { establishment: establishment, query });
    }

    @Get('allergens')
    async getAllergens() {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_GET_ALLERGENS, {});
    }

    @Get('taxes')
    async getTaxTables() {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_GET_TAXES, {});
    }

    @Get(':id')
    async getItem(@Param('id') id: string) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_GET_BY_ID, { id });
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteItem(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_DELETE, { id, establishmentId: establishment.id });
    }


    @Post(':id/duplicate')
    @RequiresFeature(feature.products)
    @UseGuards(ClerkGuard, EstablishmentStaffGuard, FeatureLimitGuard)
    async duplicateItem(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_DUPLICATE, { id, establishment });
    }

    @Patch('bulk/status')
    async bulkUpdateStatus(
        @CurrentEstablishment() establishment: Establishment,
        @Body() bulkStatusDto: BulkStatusDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_BULK_UPDATE_STATUS, { establishmentId: establishment.id, bulkStatusDto });
    }

    @Delete('bulk')
    @HttpCode(HttpStatus.OK)
    async bulkDelete(
        @CurrentEstablishment() establishment: Establishment,
        @Body() bulkDeleteDto: BulkDeleteDto,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_BULK_DELETE, { establishmentId: establishment.id, bulkDeleteDto });
    }

    @Get(':id/placements')
    async getItemPlacements(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_GET_PLACEMENTS, { itemId: id, establishment });
    }

    @Put(':id/placements')
    async updateItemPlacements(
        @Param('id') id: string,
        @CurrentEstablishment() establishment: Establishment,
        @Body() body: { subcategoryIds: string[] },
    ) {
        return this.dashboardClient.send(DASHBOARD_PATTERNS.ITEM_UPDATE_PLACEMENTS, { itemId: id, establishment, subcategoryIds: body.subcategoryIds });
    }
}
