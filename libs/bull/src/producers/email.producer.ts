import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUES } from '../queues/queues.constants';
import { EmailTemplate, SendEmailDto } from '@weats/types';

@Injectable()
export class EmailProducer {
    constructor(@InjectQueue(QUEUES.EMAIL) private readonly queue: Queue) { }

    async send<T extends EmailTemplate>(data: SendEmailDto<T>) {
        return this.queue.add('send-email', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 100000,
            },
            removeOnComplete: true,
        });
    }
}

