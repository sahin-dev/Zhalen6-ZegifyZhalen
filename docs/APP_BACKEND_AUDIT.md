# Zegify Flutter-to-backend audit

## Scope reviewed

The Flutter design at `D:\projects\app\zegify_zhalen_backup` contains buyer and seller flows for authentication, profiles, seller verification, brands, products, carts, checkout, order history/refunds, chat, notifications, promotion packages, policies, and support. The NestJS API in this repository is the backend implementation for those flows.

## Flutter findings

- Most screens are visual prototypes backed by hard-coded lists, fixed prices, and no-op button handlers. The empty `AuthController` and dummy home/promotion/order data confirm that API integration has not yet been implemented.
- Two unrelated API configuration layers exist (`lib/core/service/api_url.dart` and `lib/utils/api_urls/api_urls.dart`) with different hosts and route conventions. The client should keep one environment-driven base URL.
- The configured URL points to a private LAN address. Use `--dart-define=API_BASE_URL=...` (or an equivalent flavor configuration) for development/staging/production.
- Flutter dependency resolution currently fails: `device_preview_plus 2.5.5` requires Dart 3.9.2, while the installed SDK is Dart 3.9.0. Upgrade Flutter/Dart or pin `device_preview_plus` to `^2.4.7`.
- `api_client.dart` imports `http` and `connectivity_plus`, but neither is declared as a direct dependency in `pubspec.yaml`.
- The client renders raw card-number/CVV fields. Replace these with Stripe PaymentSheet using the PaymentIntent client secret from this API; card details must never be sent to this backend.
- The add-product design collects category, brand, name, size, images, verification proof, and description, but omits price and stock even though checkout and product cards require them.
- Buyer and seller cart/payment screens are duplicated. Sellers should not normally have a buyer cart unless the product requirement explicitly allows sellers to purchase.
- The UI tests exercise a few form interactions, but there are no client API, state, error, or end-to-end tests.

## Backend gaps found in the original code

- The project did not compile because brand/category services queried missing timestamp fields.
- There was no `/api/v1` global prefix even though the Flutter base URL includes it.
- CORS and upload serving were not configured.
- Auth lacked role-aware registration, refresh tokens, persistent reset codes, profile/account endpoints, and international phone support.
- Cart/order/product endpoints trusted client-provided user IDs, seller IDs, and prices. That allowed horizontal access and price manipulation.
- Order creation stored blank product snapshots and did not decrement stock or clear the cart atomically.
- Seller documents had no owner, URL, status, or relation. Business details did not exist.
- Seller-owned brands, promotion subscriptions, payments, refunds, chats, notifications, support requests, and uploads were missing.
- OTPs were stored only in process memory and were lost on restart.
- Site-policy and auth/profile route names did not match the client route constants.

## Implemented backend contract

All routes use the `/api/v1` prefix.

- Auth: `/auth/register`, `/auth/sign-in` (plus `/auth/signin`), `/auth/forget-password`, `/auth/verify-otp`, `/auth/reset-password`, `/auth/resend-reset-code`, `/auth/refresh-token`.
- Account: `/users/me`, `/users`, `/users/change-password`, `/users/me` delete, and `/auth/me` compatibility.
- Seller verification: `/sellers/me/business-profile`, review queue and reviewer action endpoints.
- Catalog: public categories/brands/products, seller-owned brands, seller-owned products, product verification actions.
- Cart: `/cart` and `/cart/items`; every operation is scoped to the JWT user.
- Orders: atomic checkout, buyer/seller history, status handling, cancellation, refunds, admin listing/stats.
- Payments: Stripe PaymentIntents for orders/promotions and signed webhook processing.
- Promotions: exact Starter/Premium/Pro plans represented in the Flutter design, seller subscriptions, active promoted catalog.
- Chat: direct buyer/seller conversations, paginated messages, read state, message notifications.
- Notifications: list, unread count, read-one/read-all, admin creation.
- Support: user requests and admin responses/status.
- Uploads: authenticated 10 MB JPG/PNG/WebP/PDF upload endpoint and static URL serving.
- Policies: current plural routes plus `/site-policy/:type` client compatibility.

## Required deployment configuration

Set `DATABASE_URL`, JWT/access and refresh secrets, SMTP variables, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`. Configure the Stripe webhook to POST to `/api/v1/payments/stripe/webhook`. Set `CORS_ORIGIN` to comma-separated trusted origins and `DELIVERY_FEE` as needed.

Run the migration before starting the updated API:

```bash
pnpm prisma migrate deploy
pnpm prisma generate
pnpm run build
```

The migration is committed but was intentionally not applied automatically to an unknown/shared database.

## Flutter integration sequence

1. Fix the SDK/dependency conflict and consolidate API configuration.
2. Implement token storage/refresh and auth/profile flows.
3. Replace dummy catalog, cart, order, notification, and chat state with repositories calling this API.
4. Upload files first and send returned URLs in business/product/brand payloads.
5. Replace raw payment fields with Stripe PaymentSheet using the backend PaymentIntent endpoints.
6. Add API contract tests and one end-to-end buyer checkout plus seller fulfillment scenario.
