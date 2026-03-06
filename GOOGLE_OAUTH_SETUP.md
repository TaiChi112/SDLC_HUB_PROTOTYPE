# Google Calendar OAuth Setup Guide

## 🔐 Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in dengan akun Google Anda
3. Click **"Select a Project"** → **"NEW PROJECT"**
4. Enter project name: `Calendar Agent MVP`
5. Click **CREATE** dan tunggu ~1 menit

## 📅 Step 2: Enable Google Calendar API

1. Di console, search untuk **"Google Calendar API"**
2. Click hasil pencarian
3. Click **ENABLE**
4. Tunggu sampai status menunjukkan "enabled"

## 🔑 Step 3: Create OAuth 2.0 Credentials

1. Left sidebar → **"Credentials"**
2. Click **+ CREATE CREDENTIALS** → pilih **"OAuth client ID"**
3. Akan minta setup "OAuth consent screen" dulu:
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Pilih **"External"** user type
   - Click **CREATE**
   - Isi form:
     - **App name**: Calendar Agent
     - **User support email**: (your email)
     - **Developer contact**: (your email)
   - Click **SAVE AND CONTINUE** (skip scopes)
   - Click **SAVE AND CONTINUE** (skip test users)
   - Click **BACK TO DASHBOARD**

4. Kembali ke **Credentials** tab, click **+ CREATE CREDENTIALS**
5. Pilih **"OAuth client ID"** lagi
6. Pilih application type: **"Desktop app"**
7. Click **CREATE**
8. Di popup, click **DOWNLOAD JSON** (akan download `credentials.json`)

## 💾 Step 4: Add Credentials to Project

1. Copy file `credentials.json` ke folder `python/`
   ```bash
   # Dari folder ~/Downloads atau mana pun file tersimpan
   cp ~/Downloads/credentials.json d:/RepositoryVS/special_project_v1/python/
   ```

2. Verify di terminal:
   ```bash
   cd d:/RepositoryVS/special_project_v1/python
   ls credentials.json  # Harus muncul
   ```

## ⚙️ Step 5: Configure .env

Edit `python/.env`:
```dotenv
CALENDAR_MODE=api
CREDENTIALS_PATH=./credentials.json
TOKEN_PATH=./token.json
TIMEZONE=Asia/Bangkok
```

## 🧪 Step 6: Test OAuth Connection

```bash
cd python/
python -c "
from calendar_integrations import get_calendar_tool
from datetime import datetime, timedelta

# Create calendar tool (akan prompt browser authorization)
calendar = get_calendar_tool('api', credentials_path='credentials.json')

# Test: fetch events dari minggu depan
start = datetime.now()
end = start + timedelta(days=7)
events = calendar.get_events(start, end)
print(f'[OK] Connected to Google Calendar, found {len(events)} events')
"
```

**Expected behavior:**
- Browser akan terbuka ke halaman Google login
- Anda diminta authorize app
- Setelah itu, program berlanjut

## ✅ Step 7: Verify & Create First Event

```bash
python execute_nl.py
```

Ketik:
```
10/01/2027 10:00-11:00 นัดทำฟัน
```

Program akan:
1. Parse input → `single_event`
2. Show preview (1 event)
3. Ask: **Save to calendar? (y/n):**
4. Pilih `y`
5. Event akan muncul di Google Calendar

---

## 🔗 Verify in Google Calendar

### Browser
1. Go to [Google Calendar](https://calendar.google.com)
2. Check apakah event muncul di kiri bawah

### Mobile App
1. Install **Google Calendar** app (iOS/Android)
2. Events akan sync otomatis

---

## ⚠️ Troubleshooting

### "Access denied" di browser
- Pastikan Anda login dengan akun yang sama dengan credentials.json
- Coba clear browser cookies: Ctrl+Shift+Delete

### "credentials.json not found"
- Pastikan file ada di `python/` folder
- Check path di `.env`

### "API not enabled"
- Go to Cloud Console → APIs & Services → Library
- Search "Google Calendar API"
- Click "ENABLE"

### Browser tidak membuka
- Copy-paste URL manual ke browser
- Atau gunakan: `python test_google_calendar.py`

---

## 📝 Apa yang Terjadi Di Balik Layar

1. **Credentials phase:** Program meminta permission ke Google Account Anda
2. **Token generation:** Google memberikan `token.json` (refresh token)
3. **Event creation:** Program pakai token untuk buat event di calendar Anda
4. **Sync:** Event muncul di:
   - Google Calendar website
   - Google Calendar mobile app
   - Outlook (if linked)
   - ICloud (if linked)

---

## 🎯 Next Steps

Setelah setup berhasil:
- [ ] Test dengan 5 event berbeda
- [ ] Cek reminder di Google Calendar app
- [ ] Test recurring class schedule (6 month semester)
- [ ] Setup Gemini LLM untuk parsing yang lebih akurat (optional)
