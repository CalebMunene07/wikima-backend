# Wikima Safari Backend

Express + TypeScript API connected to **Supabase PostgreSQL**.

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and replace `[YOUR-PASSWORD]` with your Supabase database password.
Get it from: **Supabase Dashboard → Settings → Database → Connection string**

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.bsxzqjalhrhbwsqrqoao.supabase.co:5432/postgres
```

### 3. Set up the database
Run `supabase-setup.sql` in Supabase:
- Go to **Supabase Dashboard → SQL Editor → New query**
- Paste the entire contents of `supabase-setup.sql`
- Click **Run**

This creates all tables, indexes, and the admin user.

**Admin credentials (change after first login):**
- Email: `munenecaleb007@gmail.com`
- Password: `Admin@Wikima2024`

### 4. Run in development
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
npm start
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/tours` | List active tours |
| GET | `/api/tours/:slug` | Get tour by slug |
| POST | `/api/tours` | Create tour (admin) |
| PUT | `/api/tours/:id` | Update tour (admin) |
| DELETE | `/api/tours/:id` | Deactivate tour (admin) |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | List bookings (admin) |
| GET | `/api/bookings/:id` | Get booking by ID |
| GET | `/api/bookings/ref/:ref` | Get booking by reference |
| PATCH | `/api/bookings/:id/status` | Update booking status (admin) |
| POST | `/api/payments/mpesa/stkpush` | Initiate M-Pesa STK push |
| GET | `/api/payments/mpesa/status/:id` | Check M-Pesa status |
| POST | `/api/payments/mpesa/callback` | M-Pesa callback (Safaricom) |
| POST | `/api/payments/stripe/intent` | Create Stripe payment intent |
| POST | `/api/payments/stripe/webhook` | Stripe webhook |
| POST | `/api/newsletter/subscribe` | Newsletter subscribe |
| GET | `/health` | Health check |
