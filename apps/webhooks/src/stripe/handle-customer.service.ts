import { Injectable, Logger } from '@nestjs/common';
import { Stripe } from 'stripe';
import { CorePrismaService } from '@weats/database';

@Injectable()
export class HandleCustomerService {
	private readonly logger = new Logger(HandleCustomerService.name);

	constructor(private readonly prisma: CorePrismaService) { }

	async handleCustomerCreated(event: Stripe.Event) {
	}

	async handleCustomerUpdated(event: Stripe.Event) {
		const customer = event.data.object as Stripe.Customer;

		try {
			const establishment = await this.prisma.establishment.findUnique({
				where: { stripeCustomerId: customer.id },
				select: { id: true, name: true },
			});

			if (!establishment) {
				this.logger.warn(`Estabelecimento não encontrado para o Stripe Customer ID: ${customer.id}`);
				return;
			}

			const updateData: any = {};

			if (customer.name) {
				updateData.billingName = customer.name;
			}

			if (customer.email) {
				updateData.email = customer.email;
			}

			if (customer.phone) {
				updateData.phoneNumber = customer.phone;
			}

			if (customer.address) {
				if (customer.address.line1) updateData.address = customer.address.line1;
				if (customer.address.city) updateData.city = customer.address.city;
				if (customer.address.state) updateData.state = customer.address.state;
				if (customer.address.postal_code) updateData.zipCode = customer.address.postal_code;
				if (customer.address.country) updateData.country = customer.address.country;
			}

			if (Object.keys(updateData).length > 0) {
				await this.prisma.establishment.update({
					where: { stripeCustomerId: customer.id },
					data: {
						...updateData,
						updatedAt: new Date(),
					},
				});

				this.logger.log(`Dados do estabelecimento ${establishment.name} (${establishment.id}) sincronizados a partir da Stripe.`);
			}
		} catch (error) {
			this.logger.error(`Erro ao sincronizar dados do cliente Stripe ${customer.id}:`, error);
		}
	}

	async handleCustomerDeleted(event: Stripe.Event) {

	}
}
