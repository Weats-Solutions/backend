import { Injectable, Logger } from '@nestjs/common';
import { Stripe } from 'stripe';
import { CorePrismaService } from '@weats/database';

@Injectable()
export class HandleCustomerService {
	private readonly logger = new Logger(HandleCustomerService.name);

	constructor(private readonly prisma: CorePrismaService) {}

	async handleCustomerCreated(event: Stripe.Event) {
		// No momento apenas logamos ou poderíamos inicializar algo se necessário
		this.logger.log(`Stripe Customer Created: ${(event.data.object as Stripe.Customer).id}`);
	}

	async handleCustomerUpdated(event: Stripe.Event) {
		const customer = event.data.object as Stripe.Customer;

		try {
			// Encontrar o estabelecimento associado a este ID de cliente Stripe
			const establishment = await this.prisma.establishment.findUnique({
				where: { stripeCustomerId: customer.id },
				select: { id: true, name: true },
			});

			if (!establishment) {
				this.logger.warn(`Estabelecimento não encontrado para o Stripe Customer ID: ${customer.id}`);
				return;
			}

			const updateData: any = {};

			// Sincronizar Nome Fiscal (Billing Name)
			if (customer.name) {
				updateData.billingName = customer.name;
			}

			// Sincronizar Contactos
			if (customer.email) {
				updateData.email = customer.email;
			}

			if (customer.phone) {
				updateData.phoneNumber = customer.phone;
			}

			// Sincronizar Morada (Address)
			if (customer.address) {
				if (customer.address.line1) updateData.address = customer.address.line1;
				if (customer.address.city) updateData.city = customer.address.city;
				if (customer.address.state) updateData.state = customer.address.state;
				if (customer.address.postal_code) updateData.zipCode = customer.address.postal_code;
				if (customer.address.country) updateData.country = customer.address.country;
			}

			// Apenas atualizar se houver campos para alterar
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
		const customer = event.data.object as Stripe.Customer;
		this.logger.warn(`Stripe Customer Deleted: ${customer.id}. O estabelecimento correspondente pode precisar de revisão.`);
		
		// Opcionalmente poderíamos marcar o estabelecimento como "sem conta stripe"
		// mas normalmente a eliminação é feita por nós via admin.
	}
}
