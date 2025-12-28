## MediFollow

Next.js 16 App Router app backed by Supabase for auth, profiles, organisations, schedules, and appointments across admin/doctor/patient dashboards.

## Setup

```bash
npm install
npm run dev
```

## Environment variables

Core:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

SMTP reminders (Nodemailer):
- SMTP_HOST (defaults to smtp.gmail.com)
- SMTP_PORT (defaults to 465)
- SMTP_USER (Gmail address for SMTP)
- SMTP_PASS (Gmail App Password)
- SMTP_FROM (from address)
- CRON_SECRET (shared secret to call the reminder endpoint)
- SMTP_REMINDER_DUMMY (optional BCC for reminder copies)

Gmail defaults are used when SMTP_HOST/SMTP_PORT are omitted. Use a Gmail App Password for SMTP authentication.

## Appointment reminder cron

- Endpoint: POST /api/cron/send-reminders
- Auth: header Authorization: Bearer $CRON_SECRET
- Behavior: sends reminders ~24h before start_time to doctor and patient, marks appointments.reminder_sent_at to prevent duplicates.
- Emails are sent via Gmail SMTP (App Password recommended); reminders BCC the optional SMTP_REMINDER_DUMMY.


Example cURL:

```bash
curl -X POST "https://your-host/api/cron/send-reminders" \
  -H "Authorization: Bearer $CRON_SECRET"
```
