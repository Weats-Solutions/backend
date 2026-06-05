import { Injectable } from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { ContactDto } from '@weats/contracts';

@Injectable()
export class LandingService {
  constructor(private readonly prisma: CorePrismaService) {}

  async createLead(dto: ContactDto) {
    return this.prisma.lead.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        message: dto.message,
      },
    });
  }
}
