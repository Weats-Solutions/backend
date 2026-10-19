# Weats Backend

The main backend platform for **Weats**, a B2B SaaS platform for the
restaurant industry.

Weats gives restaurant owners a single place to manage their operation:
custom pages, fully configurable menus, orders, tables, QR codes, staff,
payments, integrations and operational analytics. The backend supports both
the restaurant dashboard and the customer-facing restaurant experiences
generated from that configuration.

> **Part of a larger platform**
>
> Weats is a broader product composed of more than 10 applications and
> services. This repository contains the main backend and is published as a
> technical showcase; the other parts of the platform are maintained
> separately, with most of them remaining private. Changes should be
> considered in the context of the other Weats applications and services that
> consume its contracts, authentication flows and data.

## Architecture

This repository is a NestJS/TypeScript monorepo and the main backend codebase
for Weats. It is organized as a **modular backend platform**, with shared
libraries and runtime applications that are built and operated together.

The old gateway-led microservices model has been deprecated. The `gateway`
application and the internal RPC boundaries that remain in parts of the
codebase are legacy compatibility code; they are not the target architecture
for new development. The `apps/` boundaries should not be interpreted as
separate product microservices with independent ownership or domain contracts.

When adding or changing functionality:

- Prefer a module in the existing backend platform over introducing a new
  network service.
- Reuse the shared libraries, database services, contracts and configuration
  modules.
- Keep HTTP, WebSocket, background-job and webhook entry points consistent with
  the rest of the Weats ecosystem.
- Treat the deprecated gateway and legacy RPC code as migration boundaries,
  not as a pattern to extend.

### Main runtime areas

| Area | Responsibility |
| --- | --- |
| Dashboard | Restaurant-management operations: establishments, users, plans, menus, items, images, themes, zones, expenses and analytics |
| Catalog | Public/customer-facing catalog and QR-code functionality |
| Realtime | WebSocket connections and live state for restaurant staff and customers |
| Webhooks | Incoming events from providers such as Clerk and Stripe |
| Workers | Asynchronous processing such as email and QR-code jobs |
| Gateway (deprecated) | Historical HTTP/RPC aggregation layer; do not use for new features |

The exact deployment composition is environment-dependent. Some Dockerfiles
and runtime names still reflect the previous service split and are retained
while the platform is being consolidated. This repository is useful for
understanding and running the backend, but the complete Weats product also
depends on applications and services outside this codebase.

## Product capabilities

The backend provides the core capabilities used by the Weats applications:

- **Restaurant operations**: establishments, schedules, employees, service
  zones, tables/points and QR codes.
- **Custom digital presence**: configurable restaurant pages, themes and
  menus with categories, subcategories, items, variants, add-ons and
  modifiers.
- **Customer catalog experience**: generated restaurant catalogs available
  through the restaurant slug/subdomain, with Cloudflare used at the edge for
  routing and media delivery.
- **Orders and service flow**: order data, table context and operational state
  shared between customer and staff experiences.
- **Real-time operations**: WebSocket channels for client and staff updates,
  room/state management and authenticated event dispatch.
- **Analytics and management**: dashboards and operational statistics for
  restaurant owners.
- **Billing and subscriptions**: plans, invoices, subscription lifecycle and
  payment-provider integrations.
- **External integrations**: Clerk authentication, Stripe webhooks, Eupago,
  Cloudflare media services and other integration adapters.
- **Asynchronous work**: Redis-backed Bull queues for email, webhooks, images,
  QR codes and language synchronization.
- **Internationalization**: translation and language synchronization support.

## Repository layout

```text
apps/
  catalog/       Public catalog and QR-code HTTP runtime
  dashboard/     Dashboard domain modules
  gateway/       Deprecated gateway and legacy compatibility code
  realtime/      WebSocket and live-state runtime
  webhooks/      Provider webhook handlers
  workers/       Background job processors and email templates

libs/
  bull/          Queue registration and queue constants
  common/        Guards, filters, interceptors and shared utilities
  configs/       Typed application and provider configuration
  contracts/     Shared request/response and domain contracts
  database/      Prisma schemas, clients, services and migrations
  encryption/    Encryption helpers
  integrations/  Clerk, payment, Cloudflare and provider integrations
  item-core/     Shared item, variant and add-on logic
  rate-limit/    Rate-limit policies and guards
  translate/     Translation utilities
  types/         Shared TypeScript types
```

The project uses two PostgreSQL contexts:

- `core`: establishments, users, menus, items, subscriptions and operational
  configuration.
- `orders`: order-related persistence and data.

Both Prisma clients are generated from the repository schemas and exposed
through `@weats/database`.

## Technology

- Node.js 20+
- TypeScript
- NestJS 11
- pnpm 9
- PostgreSQL with Prisma
- Redis
- Bull queues and Bull Board
- Socket.IO
- Clerk
- Stripe and Eupago integrations
- Cloudflare media and delivery services
- Docker for production packaging

## Getting started

### Prerequisites

Install:

- Node.js 20 or newer
- pnpm 9
- PostgreSQL access for the `core` and `orders` databases
- Redis

Copy the example environment file and provide development credentials:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Never commit `.env` or real provider credentials. The checked-in
[.env.example](.env.example) is only a template.

### Install dependencies

```bash
pnpm install
```

### Generate Prisma clients

```bash
pnpm prisma:core:gen
pnpm prisma:orders:gen
```

### Start development

The default Nest command targets the repository's configured root application.
For a specific runtime, use the Nest project name:

```bash
# Default configured application
pnpm dev

# Run a specific application in watch mode
pnpm exec nest start catalog --watch
pnpm exec nest start realtime --watch
pnpm exec nest start webhooks --watch
pnpm exec nest start workers --watch
```

Use the runtime and environment configuration expected by the corresponding
Weats frontend or platform service. Runtime applications intended for
platform-to-platform communication should not be exposed directly to the
public internet without the appropriate edge, authentication and rate-limit
configuration.

## Environment configuration

The main configuration groups are:

- Application environment and URLs: `NODE_ENV`, `APP_URL`
- PostgreSQL: `CORE_DB_URL`, `ORDERS_DB_URL`
- Redis and logical databases: `REDIS_*`
- Authentication and identity: `CLERK_*`
- Payments: `STRIPE_*`, `EUPAGO_*`
- Media and edge delivery: `CLOUDFLARE_*`
- Encryption: `ENCRYPTION_*`
- Optional notifications: `DISCORD_WEBHOOK_URL`

The complete list and placeholder values are documented in
[.env.example](.env.example). Keep secrets in the deployment platform's
secret manager rather than in Docker Compose files or source code.

## Database workflows

The repository contains separate Prisma schemas and migration histories for
the core and orders contexts.

```bash
# Generate clients
pnpm prisma:core:gen
pnpm prisma:orders:gen

# Apply the current schema directly (development only)
pnpm prisma:core:push
pnpm prisma:orders:push

# Create/apply development migrations
pnpm prisma:core:mig
pnpm prisma:orders:mig

# Open Prisma Studio
pnpm prisma:core:studio
pnpm prisma:orders:studio
```

Seed data used by development environments:

```bash
pnpm seed:plans
pnpm seed:items
pnpm seed:tax
pnpm seed:allergens
pnpm seed:themes

# Run all seeds
pnpm seed:all
```

Do not run schema push, migration creation or seed commands against production
unless the deployment procedure explicitly requires it and the impact has
been reviewed.

## Testing and quality

```bash
# Build
pnpm build

# Unit and integration tests
pnpm test

# End-to-end tests
pnpm test:e2e

# Coverage
pnpm test:cov

# Formatting
pnpm format

# Linting
pnpm lint
```

Before opening a change, run the smallest relevant test suite and a build when
the change affects shared libraries, application wiring, database clients or
runtime configuration.

## Docker and deployment

The repository includes a Docker Compose setup and per-runtime Dockerfiles.
Images use a multi-stage Node 20 Alpine build, generate both Prisma clients and
run as a non-root user.

For a local Compose-based environment:

```bash
docker compose up --build
```

The current Compose file still contains legacy runtime names and port
assignments, including `gateway`. This is a transitional deployment reference
and should not be used to reintroduce the deprecated gateway architecture.
Production deployment configuration must be kept aligned with the current
consolidated platform topology.

The historical development ports commonly used by the repository are:

| Runtime | Port |
| --- | ---: |
| Deprecated gateway | 4000 |
| Webhooks | 4003 |
| Catalog | 4002 |
| Realtime | 4005 |

Ports are ultimately controlled by the environment/configuration services and
the deployment environment. Verify the active configuration before depending
on a port.

## Working with the Weats ecosystem

This backend is one part of a larger set of Weats projects. The surrounding
applications are not all included in this repository, and changes here can
affect:

- Dashboard and customer-facing web applications
- Restaurant slug/subdomain routing through Cloudflare
- Authentication sessions and Clerk webhooks
- Stripe subscription and payment events
- Real-time client and staff protocols
- Shared menu/catalog and order contracts
- Background queues and email templates

When changing a controller, DTO, event, database model or shared contract:

1. Search the other Weats applications for consumers of the existing shape.
2. Preserve backwards compatibility where a rollout cannot be atomic.
3. Update the relevant shared library rather than duplicating a type or helper.
4. Consider migrations, webhook retries, queued jobs and live connections.
5. Test both dashboard/staff and customer-facing flows when the domain is
   shared.

## Security and operational notes

- Treat all environment values as secrets unless explicitly documented as
  public.
- Keep authentication, authorization, validation and rate limiting enabled on
  new endpoints.
- Validate Stripe and Clerk webhook signatures using the raw request body.
- Do not expose Bull Board or administrative endpoints publicly without access
  control.
- Use the existing guards, filters, interceptors and configuration services
  instead of implementing local alternatives.
- Prefer graceful shutdown and fail-fast database connection behavior for
  runtime applications.

## Project visibility

This repository is public as a technical showcase of the Weats backend and its
architecture. Weats is a broader product composed of more than 10 applications
and services; most of the surrounding ecosystem remains private and is not
included in this repository.

Although this backend is designed to work as part of the broader Weats
ecosystem, it is published here to demonstrate the engineering work behind the
platform. It should therefore be understood in the context of the other Weats
applications and services rather than as the complete Weats product by itself.
