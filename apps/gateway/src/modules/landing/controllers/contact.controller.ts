import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { LANDING_SERVICE, Public, RateLimit } from "@weats/common";
import { LANDING_PATTERNS } from "@weats/common/patterns/landing.patterns";
import { ContactDto } from "@weats/contracts";

@Controller('landing/contact')
export class ContactController {
    constructor(
        @Inject(LANDING_SERVICE) private readonly landingClient: ClientProxy,
    ) { }

    @Post()
    @Public()
    @RateLimit('STRICT')
    createLead(
        @Body() contactDto: ContactDto,
    ) {
        return this.landingClient.send(LANDING_PATTERNS.LEAD_CREATE, contactDto);
    }
}