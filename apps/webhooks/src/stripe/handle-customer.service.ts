import { Injectable, Logger } from '@nestjs/common';
import { Stripe } from 'stripe';
import { CorePrismaService } from '@weats/database';
import { CacheService } from '@weats/cache';
import { DiscordService } from '@weats/integrations';

@Injectable()
export class HandleCustomerService {
	private readonly logger = new Logger(HandleCustomerService.name);

	constructor(
		private readonly prisma: CorePrismaService,
		private readonly cacheService: CacheService,
		private readonly discordService: DiscordService,
	) { }

	async handleCustomerCreated(_event: Stripe.Event): Promise<void> {
		// O customer já foi criado pelo vosso próprio checkout flow antes deste
		// webhook chegar. Handler reservado para logging futuro ou sincronização
		// defensiva se o flow mudar.
	}

	async handleCustomerUpdated(event: Stripe.Event): Promise<void> {
		const customer = event.data.object as Stripe.Customer;

		const establishment = await this.prisma.establishment.findUnique({
			where: { stripeCustomerId: customer.id },
			select: { id: true, name: true },
		});

		if (!establishment) {
			this.logger.warn(`handleCustomerUpdated: establishment not found for ${customer.id}`);
			return;
		}

		// Só atualiza campos que a Stripe enviou — evita apagar dados locais
		const updateData: Record<string, string> = {};

		if (customer.business_name) updateData.billingName = customer.business_name;
		if (customer.email) updateData.email = customer.email;
		if (customer.phone) updateData.phoneNumber = customer.phone;
		if (customer.address) {
			if (customer.address.line1) updateData.billingAddress = customer.address.line1;
			if (customer.address.city) updateData.billingCity = customer.address.city;
			if (customer.address.state) updateData.billingState = customer.address.state;
			if (customer.address.postal_code) updateData.billingZipCode = customer.address.postal_code;
			if (customer.address.country) updateData.billingCountry = customer.address.country;
		}

		if (Object.keys(updateData).length === 0) return;

		await this.prisma.establishment.update({
			where: { stripeCustomerId: customer.id },
			data: { ...updateData, updatedAt: new Date() },
		});

		await this.cacheService.clearDashboardEstCache(establishment.id);

		this.logger.log(
			`Customer synced: ${establishment.name} (${establishment.id}) ← ${customer.id}`,
		);
	}

	async handleCustomerDeleted(event: Stripe.Event): Promise<void> {
		const customer = event.data.object as Stripe.Customer;

		const establishment = await this.prisma.establishment.findUnique({
			where: { stripeCustomerId: customer.id },
			select: { id: true, name: true },
		});

		if (!establishment) {
			this.logger.warn(`handleCustomerDeleted: establishment not found for ${customer.id}`);
			return;
		}

		this.discordService
			.sendToDiscord('O estabelecimento ' + establishment.name + ' eliminou a conta na stripe id:', `${customer.id}`)
			.catch((err: Error) =>
				this.logger.warn(`[Stripe] Discord notification failed: ${err.message}`),
			);

		// Desliga o stripeCustomerId — o establishment continua a existir
		/* 	await this.prisma.establishment.update({
				where: { stripeCustomerId: customer.id },
				data: { stripeCustomerId: null, updatedAt: new Date() },
			}); */

		await this.cacheService.clearDashboardEstCache(establishment.id);

		this.logger.warn(`Stripe customer deleted: ${customer.id} (${establishment.name})`);
	}

	async handleTaxIdUpdated(_event: Stripe.Event): Promise<void> {
		/* const taxId = event.data.object as Stripe.TaxId;
		const stripeCustomerId =
			typeof taxId.customer === 'string' ? taxId.customer : taxId.customer?.id;

		if (!stripeCustomerId) return;

		const establishment = await this.prisma.establishment.findUnique({
			where: { stripeCustomerId },
			select: { id: true, name: true },
		});

		if (!establishment) {
			this.logger.warn(`handleTaxIdUpdated: establishment not found for ${stripeCustomerId}`);
			return;
		}

		await this.prisma.establishment.update({
			where: { stripeCustomerId },
			data: {
				taxIdType: taxId.type,
				taxIdValue: taxId.value ?? null,
				updatedAt: new Date(),
			},
		});

		await this.cacheService.clearDashboardEstCache(establishment.id);

		this.logger.log(
			`🧾 Tax ID updated: ${establishment.name} → ${taxId.type}: ${taxId.value}`,
		); */
	}
}