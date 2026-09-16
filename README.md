
# Matrimony application

## Local Docker development

Copy `.env.example` to `.env` at the repository root and replace both JWT secrets before starting the stack:

```powershell
docker compose up --build
```

The frontend is available at `http://localhost:8080`, the API at `http://localhost:5001`, Swagger at `http://localhost:5001/api`, and Postgres is exposed on port `5433`.

Compose waits for Postgres readiness and runs `prisma migrate deploy` before starting the backend. Keep `.env` files out of Git.

## Manual development

Install dependencies in both `backend` and `frontend`, configure `backend/.env`, then run `npm run start:dev` and `npm run dev` from their respective directories.

## Deployment

### Render

Create a Blueprint from this repository and select `render.yaml`. Render will create the backend service and PostgreSQL database, run Prisma migrations during deploy, and use `/health` for health checks. Set `FRONTEND_URL` in the Render service to the deployed Vercel URL.

### Vercel

Create a Vercel project with `frontend` as the Root Directory. The included `frontend/vercel.json` configures the Vite build and React Router fallback. Set `VITE_API_URL` to the public Render API URL, for example `https://matrimony-api.onrender.com`.

Do not commit provider credentials or `.env` files. Configure Cloudinary, email, payment, and any future third-party secrets directly in the provider dashboards.

### Razorpay payments

The payment flow is server-verified. Configure these values in `backend/.env` locally or in Render:

```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
PREMIUM_PLAN_AMOUNT=49900
PAYMENT_CURRENCY=INR
```

Configure the Razorpay webhook endpoint as:

```text
https://your-render-api.onrender.com/payments/webhook
```

Subscribe to `payment.captured` and `payment.failed`. Never expose `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` to the frontend.
