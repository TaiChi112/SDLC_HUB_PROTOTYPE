# Natural Language Calendar Agent - Quick Start Guide

## 🚀 ทำได้ตอนนี้เลย (MVP Ready)

### 1. เตรียม `.env`
```bash
cd python/
cp .env.example .env

# (Optional) ให้ LLM แปลง intent
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-1.5-flash
```

### 2. รัน Flask Server
```bash
python app.py
# Server listen ที่ http://localhost:5000
```

### 3. ส่ง Natural Language Command

**3a. Plan mode** (ดูแค่ plan ไม่บันทึก)
```bash
curl -X POST http://localhost:5000/api/nl/plan \
  -H "Content-Type: application/json" \
  -d '{
    "text": "10/01/2027 10:00-11:00 นัดทำฟัน แจ้งเตือนก่อน 1 ชั่วโมง",
    "timezone": "Asia/Bangkok"
  }'
```

**Response:**
```json
{
  "success": true,
  "intent": {
    "intent_type": "single_event",
    "summary": "นัดทำฟัน แจ้งเตือนก่อน 1 ชั่วโมง",
    "start": "2027-01-10T10:00:00",
    "end": "2027-01-10T11:00:00",
    "duration_weeks": 1,
    "reminder_minutes_before": 60,
    "timezone": "Asia/Bangkok",
    "source": "rule-based"
  },
  "events_preview": [
    {
      "summary": "นัดทำฟัน แจ้งเตือนก่อน 1 ชั่วโมง",
      "start": "2027-01-10T10:00:00",
      "end": "2027-01-10T11:00:00",
      "reminders_minutes_before": 60
    }
  ],
  "message": "Parsed 'single_event' with 1 event(s)"
}
```

**3b. Execute mode** (บันทึกเข้าปฏิทินทันที)
```bash
curl -X POST http://localhost:5000/api/nl/execute \
  -H "Content-Type: application/json" \
  -d '{
    "text": "เทอม 1 ปี 69 เรียนวันจันทร์ 09:30-12:30 เป็นเวลา 6 เดือน แจ้งเตือนก่อนเรียน 1 ชั่วโมง",
    "timezone": "Asia/Bangkok",
    "skip_conflicts": true
  }'
```

**Response:**
```json
{
  "success": true,
  "intent": {
    "intent_type": "recurring_weekly",
    "summary": "เรียนเทอม 1 ปี 69",
    "start": "2026-06-08T09:30:00",
    "end": "2026-06-08T12:30:00",
    "duration_weeks": 26,
    "reminder_minutes_before": 60,
    "timezone": "Asia/Bangkok",
    "source": "rule-based"
  },
  "created_count": 25,
  "conflict_count": 1,
  "message": "Created 25 event(s), conflicts 1"
}
```

---

## 📝 เข้าใจสิ่งที่อาจเป็น

### Intent Types (3 แบบ)
1. **single_event** - นัดครั้งเดียว
   - Input: "10/01/2027 10:00-11:00 นัดทำฟัน"
   - Output: 1 event

2. **recurring_weekly** - เรียนซ้ำทุกสัปดาห์
   - Input: "เรียนวันจันทร์ 09:30-12:30 เป็นเวลา 6 เดือน"
   - Output: 26 events (6 months × ~4.3 weeks)

3. **recurring_monthly** (planned)
   - Input: "ประชุมวันที่ 1 ของทุกเดือน"
   - Output: 12 events/year

### Parser Strategy
1. **ลองใช้ Gemini (ถ้า API key มี)**
   - ถ้า `GEMINI_API_KEY` ตั้งไว้ → ส่งไปให้ Gemini แปลง
   - ถ้าไม่มี → ใช้ rule-based parser

2. **Rule-Based Parser** (fallback)
   - รับรู้ regex: `\d{1,2}/\d{1,2}/\d{4}` (DD/MM/YYYY)
   - รับรู้ regex: `\d{1,2}:\d{2}` (HH:MM)
   - รับรู้วันไทย: จันทร์ อังคาร พุธ ฯลฯ
   - รับรู้ reminder: "แจ้งเตือนก่อน 1 ชั่วโมง"

### Reminder Handling
- Input: "แจ้งเตือนก่อน 1 ชั่วโมง" → `reminder_minutes_before: 60`
- Input: "เตือนก่อน 30 นาที" → `reminder_minutes_before: 30`
- Default: 60 นาที (ตั้งในใคร)

---

## ✨ ใหญ่มาก: ตัวอย่างจำนวนมาก

```bash
# 1. นัดเดี่ยว
"10/01/2027 10:00-11:00 นัดทำฟัน"

# 2. นัดซ้ำสัปดาห์ + เตือน
"เรียนวันจันทร์ 09:30-12:30 ทั้งเทอม (16 สัปดาห์) แจ้งเตือนก่อน 1 ชม"

# 3. นัดซ้ำ หลายเดือน
"ประชุม 6 เดือน วันจันทร์ 14:00-15:00"

# 4. นัดพุธนี้
"พุธหน้า 13:00-14:00 ประชุมทีม"

# 5. นัดกับ reminder สั้น
"19/03/2026 09:00-10:00 สอบ เตือนก่อน 15 นาที"
```

---

## 🔧 Config ที่สำคัญ

**ประเภทการ Conflict Handling:**
```json
{
  "skip_conflicts": true,   // Skip event ที่ชน
  "skip_conflicts": false   // Overwrite event เดิม (ยังไม่ implement)
}
```

---

## 🎯 ขั้นตอนต่อไป (ในสัปดาห์นี้)

- [ ] Test กับ Google Calendar API จริง
- [ ] เพิ่ม notification/reminder bell ใน Web UI
- [ ] Support mode="api" เพื่อเขียน Google Calendar จริง
- [ ] เพิ่ม CLI version: `echo "input" | python execute_nl.py`
- [ ] Integration ตรง WeChat/Telegram bot

---

## 📌 Links ที่เกี่ยวข้อง
- [README.md](./README.md) - Full documentation
- [nl_agent.py](./nl_agent.py) - NL parser source code
- [app.py](./app.py) - Flask routes
- [.env.example](./.env.example) - Configuration template
