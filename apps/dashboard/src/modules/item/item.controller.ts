// src/items/item.controller.ts
import { Controller } from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto, UpdateItemDto, BulkStatusDto, BulkDeleteDto, GetItemsQueryDto } from '@weats/contracts';
import { Establishment } from '@weats/types';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DASHBOARD_PATTERNS } from '@weats/common';

@Controller()
export class ItemController {
    constructor(private readonly itemService: ItemService) { }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_CREATE)
    async createItem(@Payload() payload: { establishmentId: string, createItemDto: CreateItemDto }) {
        return this.itemService.createItem(payload.establishmentId, payload.createItemDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_UPDATE)
    async updateItem(@Payload() payload: { id: string, establishmentId: string, updateItemDto: UpdateItemDto }) {
        return this.itemService.updateItem(payload.id, payload.establishmentId, payload.updateItemDto);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_GET_ALL)
    async getItems(
        @Payload() payload: { establishment: Establishment, query: GetItemsQueryDto },
    ) {
        return this.itemService.getItemsForDashboard(payload.establishment, payload.query);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_GET_ALLERGENS)
    async getAllergens() {
        return this.itemService.getAllergens();
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_GET_TAXES)
    async getTaxTables() {
        return this.itemService.getTaxTables();
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_GET_BY_ID)
    async getItem(@Payload() payload: { id: string }) {
        return this.itemService.getItemById(payload.id);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_DELETE)
    async deleteItem(
        @Payload() payload: { id: string, establishmentId: string },
    ) {
        return this.itemService.deleteItem(payload.id, payload.establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_DUPLICATE)
    async duplicateItem(
        @Payload() payload: { id: string, establishment: Establishment },
    ) {
        return this.itemService.duplicateItem(payload.id, payload.establishment);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_BULK_UPDATE_STATUS)
    async bulkUpdateStatus(
        @Payload() payload: { establishmentId: string, bulkStatusDto: BulkStatusDto },
    ) {
        return this.itemService.bulkUpdateStatus(payload.bulkStatusDto, payload.establishmentId);
    }

    @MessagePattern(DASHBOARD_PATTERNS.ITEM_BULK_DELETE)
    async bulkDelete(
        @Payload() payload: { establishmentId: string, bulkDeleteDto: BulkDeleteDto },
    ) {
        return this.itemService.bulkDelete(payload.bulkDeleteDto, payload.establishmentId);
    }
}
