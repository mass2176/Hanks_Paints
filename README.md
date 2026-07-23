# Hanks Paints MVP

Database-backed starter application for Hanks Paints.

## Included

- Public-facing Hanks Paints website with dark/blue shop-inspired theme
- Quote intake form
- Required customer info, address, vehicle info, service type, payment type, description
- Database-backed FastAPI backend
- SQLite default for quick local development
- PostgreSQL-ready Docker Compose setup
- Quote verification placeholder
- Employee dashboard
- Global search endpoint
- Start Quotation workflow
- Appointment request/confirmation endpoints
- Physical inspection gate before final estimate
- Line-item estimate endpoints
- Final estimate approval/signature creates active job
- Supplement/change order approval flow
- Portal messaging endpoint
- Media upload endpoint with customer-visible/internal-only flag
- Invoice and manual payment tracking endpoints
- Activity timeline
- Twilio-backed shop owner SMS alert when a new estimate request is submitted
- Admin/employee shop login with role-based access

## Backend SMS notification settings

Set these environment variables on the deployed backend to enable shop-owner SMS alerts:

```text
SMS_NOTIFICATIONS_ENABLED=true
SHOP_NOTIFICATION_PHONE=+17652714378
TWILIO_ACCOUNT_SID=AC...
TWILIO_API_KEY=SK...
TWILIO_API_SECRET=...
TWILIO_MESSAGING_SERVICE_SID=MG...
```

If you prefer sending from a specific Twilio number instead of a Messaging Service, use:

```text
TWILIO_FROM_PHONE=+1...
```

The backend sends:

- A shop-owner alert to `SHOP_NOTIFICATION_PHONE` when a customer creates a new estimate request.
- A customer confirmation SMS when the customer submits an estimate request and checks the SMS
  consent box.

Other customer-facing workflow messages still use notification intent logging until those steps are
expanded.

## Backend shop login settings

Set these environment variables on the deployed backend before opening `/admin`:

```text
AUTH_SECRET_KEY=use-a-long-random-secret
INITIAL_ADMIN_EMAIL=owner@example.com
INITIAL_ADMIN_PASSWORD=use-a-strong-temporary-password
INITIAL_ADMIN_NAME=Hanks Paints Admin
```

On startup, the backend creates the first admin user if that email does not already exist. After
logging in as the first admin, use the Shop Users section in `/admin` to create employee or
additional admin logins.

## Quick local backend run without Docker

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open:

```text
http://localhost:8000/docs
```

## Quick frontend run

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Docker run with PostgreSQL

```bash
docker compose up --build
```

Frontend:

```text
http://localhost:3000
```

Backend API docs:

```text
http://localhost:8000/docs
```

## Important next build items

This is a functional starter, not a finished production system. Next development steps:

1. Add real customer passwordless login/session handling.
2. Expand SMS/email provider integration for customer-facing notifications.
3. Add password reset/deactivation controls for shop users.
4. Add appointment availability settings UI.
5. Add file upload UI to the quote form.
6. Add object storage for media instead of local file storage.
7. Add signed PDF generation for estimates, supplements, and invoices.
8. Add admin settings pages.
9. Add validation, rate limiting, CAPTCHA, backups, and audit hardening.
10. Have estimate/authorization/disclaimer wording reviewed by a local attorney/business advisor.
