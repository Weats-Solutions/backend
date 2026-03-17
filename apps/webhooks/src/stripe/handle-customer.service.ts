import { Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';

@Injectable()
export class HandleCustomerService {
  constructor() { }

  async handleCustomerCreated(event: Stripe.Event) {
    // Handle customer.created event
  }

  async handleCustomerUpdated(event: Stripe.Event) {
    // Handle customer.updated event
  }

  async handleCustomerDeleted(event: Stripe.Event) {
    // Handle customer.deleted event
  }
}
