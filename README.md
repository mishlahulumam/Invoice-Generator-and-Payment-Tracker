# Invoice Generator & Payment Tracker

Aplikasi full-stack untuk membuat invoice, mengirim email, melacak pembayaran, dan mengelola klien.

## Tech Stack

- **Frontend**: React JS + Vite, Tailwind CSS, React Router, Zustand, Recharts
- **Backend**: FastAPI (Python), SQLAlchemy, Alembic
- **Database**: PostgreSQL

## Fitur

- Buat, edit, dan kelola invoice dengan line items, diskon, dan pajak PPN
- Generate PDF otomatis menggunakan ReportLab
- Kirim email invoice ke klien via Mailtrap sandbox
- QRIS payment simulation dengan QR code
- Dashboard revenue dengan chart bar dan pie
- Manajemen klien dengan riwayat invoice
- Recurring invoice otomatis (mingguan/bulanan/tahunan) via APScheduler
- Template invoice customizable (warna tema, layout)
- Autentikasi dengan JWT

## Cara Menjalankan

### Prasyarat
- Python 3.8+
- Node.js 18+
- PostgreSQL

### 1. Setup Database

Buat database PostgreSQL:
```sql
CREATE DATABASE invoice_db;
```

### 2. Setup Backend

```bash
cd backend

# Salin dan isi konfigurasi
copy .env.example .env
# Edit .env: isi DATABASE_URL, SECRET_KEY, Mailtrap credentials

# Install dependencies
pip install -r requirements.txt

# Jalankan migrasi database
alembic upgrade head

# Jalankan server
uvicorn main:app --reload --port 8000
```

Backend berjalan di: http://localhost:8000  
API docs: http://localhost:8000/docs

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di: http://localhost:5173

## Konfigurasi .env

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/invoice_db
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Mailtrap (https://mailtrap.io - gratis)
MAILTRAP_USERNAME=your_username
MAILTRAP_PASSWORD=your_password
MAIL_FROM=noreply@invoiceapp.com

FRONTEND_URL=http://localhost:5173
```

## Struktur Folder

```
├── frontend/          # React JS app
│   └── src/
│       ├── components/   # Reusable components
│       ├── pages/        # Route pages
│       ├── services/     # API calls
│       ├── store/        # Zustand state
│       └── utils/        # Helpers
└── backend/           # FastAPI app
    ├── app/
    │   ├── api/          # Route handlers
    │   ├── models/       # SQLAlchemy models
    │   ├── schemas/      # Pydantic schemas
    │   ├── services/     # Business logic (PDF, email, QR, scheduler)
    │   ├── core/         # Config & security
    │   └── db/           # Database session
    └── alembic/          # Migrations
```
