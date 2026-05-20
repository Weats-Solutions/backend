import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CorePrismaService } from '@weats/database';
import { Establishment } from '@weats/types';
import { CreateVariantOptionDto, UpdateVariantOptionDto } from '@weats/contracts';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class VariantOptionsService {
  constructor(private readonly prisma: CorePrismaService) { }

  // =====================================================
  // CREATE OPTION (Dicionário)
  // =====================================================
  async create(
    establishment: Establishment,
    dto: CreateVariantOptionDto,
  ) {
    const defaultTranslation =
      dto.translations.find(
        (t) => t.locale === establishment.primaryLanguage,
      ) || dto.translations[0];

    // Criamos a opção livremente no dicionário do estabelecimento
    return this.prisma.variantOption.create({
      data: {
        unit: dto.unit,
        quantity: dto.quantity,
        code: defaultTranslation.name.toUpperCase().replace(/\s+/g, '_'), // Gera um código simples
        isActive: dto.isActive ?? true,
        isGlobal: false, // Por defeito, as criadas pelo cliente não são globais
        establishmentId: establishment.id,
        translations: {
          create: dto.translations,
        },
      },
      select: {
        id: true,
        unit: true,
        quantity: true,
        code: true,
        isActive: true,
        isGlobal: true,
        establishmentId: true,
        translations: {
          select: {
            locale: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(establishment: Establishment) {
    return this.prisma.variantOption.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { establishmentId: establishment.id },
        ],
      },
      orderBy: [
        { isGlobal: 'desc' },
      ],
      select: {
        id: true,
        unit: true,
        quantity: true,
        code: true,
        isActive: true,
        isGlobal: true,
        establishmentId: true,
        translations: {
          select: {
            locale: true,
            name: true,
          },
        },
      },
    });
  }

  async listGlobals() {
    return this.prisma.variantOption.findMany({
      where: {
        isGlobal: true,
      },
      select: {
        id: true,
        unit: true,
        quantity: true,
        code: true,
        isActive: true,
        isGlobal: true,
        translations: {
          select: {
            locale: true,
            name: true,
          },
        },
      },
    });
  }

  // =====================================================
  // GET SINGLE OPTION
  // =====================================================
  async getById(id: string) {
    const option = await this.prisma.variantOption.findUnique({
      where: { id },
      select: {
        id: true,
        unit: true,
        quantity: true,
        code: true,
        isActive: true,
        isGlobal: true,
        establishmentId: true,
        translations: {
          select: {
            locale: true,
            name: true,
          },
        },
      },
    });

    if (!option) throw new NotFoundException('Variant option not found');

    return option;
  }

  // =====================================================
  // UPDATE OPTION
  // =====================================================
  async update(
    id: string,
    dto: UpdateVariantOptionDto,
    establishment: Establishment,
  ) {
    const option = await this.prisma.variantOption.findUnique({
      where: { id },
    });

    if (!option) throw new RpcException({ code: 404, message: 'Variant option not found' });

    // Se a opção for global → bloquear (só admins da plataforma podem editar globais)
    if (option.isGlobal) {
      throw new RpcException(
        { code: 400, message: 'Cannot edit global variant options' },
      );
    }

    // Se não pertencer a este estabelecimento → bloquear
    if (option.establishmentId !== establishment.id) {
      throw new RpcException({ code: 400, message: 'Variant option does not belong to this establishment' });
    }

    return this.prisma.variantOption.update({
      where: { id },
      data: {
        unit: dto.unit,
        quantity: dto.quantity,
        isActive: dto.isActive,
        translations: {
          deleteMany: {}, // Limpa as antigas
          create: dto.translations, // Recria as novas
        },
      },
      select: {
        id: true,
        unit: true,
        quantity: true,
        code: true,
        isActive: true,
        isGlobal: true,
        establishmentId: true,
        translations: {
          select: {
            locale: true,
            name: true,
          },
        },
      },
    });
  }

  // =====================================================
  // DELETE OPTION
  // =====================================================
  async remove(id: string, establishment: Establishment) {
    const option = await this.prisma.variantOption.findUnique({
      where: { id },
    });

    if (!option) throw new RpcException({ code: 404, message: 'Variant option not found' });

    // Se a opção for global → bloquear
    if (option.isGlobal) {
      throw new RpcException(
        { code: 400, message: 'Cannot delete global variant options' },
      );
    }

    // Se não pertencer a este estabelecimento → bloquear
    if (option.establishmentId !== establishment.id) {
      throw new RpcException({ code: 400, message: 'Variant option does not belong to this establishment' });
    }

    await this.prisma.variantOption.delete({
      where: { id },
    });

    return { success: true };
  }
}