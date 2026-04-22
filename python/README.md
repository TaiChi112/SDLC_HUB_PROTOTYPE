# Calendar Agent System (MCP-Based Event Management)

## 📋 ภาพรวมของโปรแกรม

โปรแกรมนี้เป็นระบบจัดการตารางปฏิทิน (Calendar Agent) ที่ใช้ **Model Context Protocol (MCP)** เพื่อจัดการเหตุการณ์ (Events) อย่างอัจฉริยะ โดยสามารถ:

- ✅ ขยายตารางที่เกิดซ้ำ (Recurring Events) ให้เป็นรายสัปดาห์
- ✅ ตรวจสอบความขัดแย้งของเวลา (Conflict Detection)
- ✅ **แนะนำเวลาว่างอัตโนมัติ (Auto-Suggest)** ⭐ ใหม่!
- ✅ **จัดลำดับความเหมาะสมด้วย Scoring System** ⭐ ใหม่!
- ✅ **รับ input จากผู้ใช้แบบ Interactive** ⭐ ใหม่!
- ✅ บันทึกเหตุการณ์ลงปฏิทิน (Event Persistence)

---

## 🚀 Getting Started - ลองใช้งานทันที!

### ✅ Prerequisites (สิ่งที่ต้องมี)

```bash
# ตรวจสอบ Python version (ต้อง >= 3.10)
python --version

# ควรได้: Python 3.10.x หรือสูงกว่า
```

### 📦 Installation (ติดตั้งใน 3 ขั้นตอน)

```bash
# 1. Clone repository (หรือดาวน์โหลด ZIP)
git clone <your-repo-url>
cd special_project_v1/python

# 2. ติดตั้ง dependencies
pip install -r requirements.txt

# 3. ทดสอบว่าติดตั้งสำเร็จ
python -c "import pytest; print('✅ Ready!')"
```

### ⚡ Quick Demo (ทดลอง 30 วินาที)

```bash
# รันโปรแกรม Demo
python main.py
```

**คุณจะเห็น:**
```
📅 Calendar Agent System
==================================================

🤖 [Agent] ได้รับคำสั่ง: จัดการตารางเรียน 1 เทอม
   [MCP Tool] 🔍 กำลังค้นหา Event...

⚠️ [Agent Alert] พบเวลาชนกันครับ:
  - สัปดาห์วันที่ 2026-06-08: ชนกับ '🦷 นัดทำฟัน' (10:00-11:00)

💡 [Auto-Suggest] ผมหาเวลาว่างทางเลือกให้แล้วครับ:
  📅 วันที่ 2026-06-08:
    1. 11:00 - 14:00

👉 เลือกตัวเลือก (1-4): _
```

**ลองเลือก:**
- พิมพ์ `3` = ใช้ Auto-Suggest (Agent จะเลือกเวลาที่ดีที่สุดให้)
- พิมพ์ `1` = ข้ามสัปดาห์ที่ชน
- พิมพ์ `2` = ลงทับ
- พิมพ์ `4` = ยกเลิก

### 📖 Step-by-Step Tutorial

#### Tutorial 1: ทดสอบ Conflict Detection

```bash
# 1. รันโปรแกรม
python main.py

# 2. เมื่อเห็นคำถาม พิมพ์: 1
# → Agent จะข้ามสัปดาห์ที่ชน

# 3. ดูผลลัพธ์:
# ✅ บันทึกเรียบร้อย 3 events (ข้ามสัปดาห์ที่ชน 1 events)
```

#### Tutorial 2: ลอง Auto-Suggest + Scoring

```bash
# 1. รันโปรแกรมอีกครั้ง
python main.py

# 2. เมื่อเห็นคำถาม พิมพ์: 3
# → Agent จะแสดง Scoring

📊 [Scoring] คะแนนเวลาที่แนะนำ:
  📅 2026-06-08:
    1. 11:00-14:00 → คะแนน: 75.0/100  ✨ (ดีที่สุด)

   [Agent] ✏️ เปลี่ยนเวลา 'CS301 (W2)' จาก 09:30 เป็น 11:00
✅ บันทึกเรียบร้อย 4 events (ใช้เวลาทางเลือก 1 events)
```

#### Tutorial 3: ทดสอบกับ Google Calendar จริง

```bash
# 1. ติดตั้ง Google Calendar API
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

# 2. เตรียม credentials.json (ดูคู่มือด้านล่าง)

# 3. ทดสอบการเชื่อมต่อ
python test_google_calendar.py

# 4. ใช้งานจริง
python example_usage.py --mode api --interactive
```

**หมายเหตุ**: ถ้าเจอ Error 403, อ่าน [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

#### Tutorial 4: ทดสอบ Unit Tests

```bash
# รัน tests ทั้งหมด (25 tests)
python -m pytest test_main.py -v

# รันเฉพาะ Auto-Suggest tests
python -m pytest test_main.py::TestAutoSuggest -v

# ดู coverage
python -m pytest test_main.py --cov=main --cov-report=html
# เปิด htmlcov/index.html ดูผลลัพธ์
```

### 🎯 ตัวอย่างการใช้งานจริง

<details>
<summary><strong>📝 Scenario 1: ลงตารางเรียน 1 เทอม</strong></summary>

```python
# แก้ไข main.py ที่บรรทัด user_intent
user_intent = {
    "summary": "📘 CS401: Machine Learning",
    "start": datetime(2026, 6, 1, 13, 0),  # บ่าย 1 โมง
    "duration_weeks": 18                    # เต็มเทอม
}
```

รัน:
```bash
python main.py
```

</details>

<details>
<summary><strong>🔧 Scenario 2: Custom Preferences</strong></summary>

```python
# ในไฟล์ main.py, แก้ที่ calculate_time_slot_score()
preferences = {
    "prefer_morning": False,     # ชอบช่วงบ่าย!
    "prefer_afternoon": True,
    "avoid_lunch": False,        # ไม่ว่า
    "avoid_evening": True,
    "ideal_start": time(14, 0),  # ชอบเริ่ม 14:00
    "travel_buffer_mins": 45     # ต้องการเวลาเดินทาง 45 นาที
}
```

</details>

### 🎮 Interactive Mode Commands

| คำสั่ง | Shortcut | คำอธิบาย |
|--------|----------|----------|
| `python main.py` | - | เปิด Interactive mode |
| `python example_usage.py -i` | `-i` | CLI พร้อม arguments |
| `python test_google_calendar.py` | - | ทดสอบ Google Calendar |
| `pytest test_main.py -v` | `-v` | รัน tests แบบ verbose |

### 🌐 Web UI (Flask) - GUI Interface

**Launch Flask Web Interface:**

```bash
pip install flask flask-cors
python app.py

# Access: http://localhost:5000
```

**Features in Web UI:**
- ✅ Create recurring events with calendar picker
- ✅ Visual conflict detection with alerts
- ✅ One-click resolution options
- ✅ Real-time event list
- ✅ Scoring display (0-100 points)

**Natural Language Agent API (ใหม่):**
- `POST /api/nl/plan` → แปลงข้อความธรรมชาติเป็น event plan
- `POST /api/nl/execute` → แปลง + สร้าง event เข้าปฏิทินทันที

ตัวอย่าง payload:
```json
{
  "text": "เทอม 1 ปี 69 เรียนวันจันทร์ 09:30-12:30 เป็นเวลา 6 เดือน แจ้งเตือนก่อนเรียน 1 ชม",
  "timezone": "Asia/Bangkok",
  "skip_conflicts": true
}
```

ตั้งค่า LLM (optional) ใน `.env`:
```dotenv
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-1.5-flash
NL_DEFAULT_REMINDER_MINUTES=60
```

---

### 🔧 MCP Server Integration

**Run MCP Server (Node.js):**

```bash
# Install MCP dependencies
cd mcp-server
npm install

# Start server in background
node server.js &

# In another terminal, run Python agent
python main.py  # Automatically uses MCP
```

**What's included:**
- ✅ MCP Protocol implementation (server.js)
- ✅ Python MCP Client (mcp_client.py)
- ✅ Integrated with Calendar Agent
- ✅ 5 calendar tools: list_events, create_event, update_event, delete_event, check_availability

See [MCP_WEB_DOCKER_INTEGRATION.md](MCP_WEB_DOCKER_INTEGRATION.md) for full details.

---

### 🐳 Docker Deployment

**Quick Docker Start:**

```bash
# Copy environment template
cp .env.example .env

# Run with Docker (default: mock mode)
docker-compose up --build

# Access:
# - Web UI: http://localhost:5000
# - API Health: http://localhost:5000/api/health
```

**Available Profiles:**

| Profile | Services | Use Case |
|---------|----------|----------|
| `default` | Flask Web | Development |
| `with-db` | Flask + PostgreSQL | Testing |
| `with-mcp` | Flask + PostgreSQL + MCP | Production |
| `production` | All + Nginx | Full Stack |

**Example:**
```bash
docker-compose --profile with-mcp up
```

See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for production guide.

---

### 📚 เอกสารเพิ่มเติม

| ไฟล์ | จุดประสงค์ |
|------|-----------|
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | คำสั่งที่ใช้บ่อย ⭐ เริ่มต้นที่นี่ |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | แก้ปัญหา OAuth 403 |
| [MCP_IMPLEMENTATION_GUIDE.md](MCP_IMPLEMENTATION_GUIDE.md) | Setup MCP Server |
| [MCP_WEB_DOCKER_INTEGRATION.md](MCP_WEB_DOCKER_INTEGRATION.md) | ⭐ MCP + Web UI + Docker Guide |
| [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) | Docker deployment guide |
| [FINAL_SUMMARY.md](FINAL_SUMMARY.md) | สรุปฟีเจอร์ทั้งหมด |

### 💡 Tips สำหรับผู้ใช้ใหม่

- ✅ **ครั้งแรก**: ใช้ `--mode mock` (ไม่ต้อง setup OAuth)
- ✅ **Interactive Mode**: กด Ctrl+C เพื่อยกเลิก
- ✅ **Test Users**: เพิ่มอีเมลใน OAuth Consent Screen (Google Cloud)
- ✅ **Token หมดอายุ**: ลบ `token.json` แล้วรันใหม่

### ❓ คำถามที่พบบ่อย (FAQ)

<details>
<summary><strong>Q: Error "No module named 'pytest'"</strong></summary>

```bash
# ติดตั้ง dependencies ใหม่
pip install -r requirements.txt
```
</details>

<details>
<summary><strong>Q: OAuth Error 403: access_denied</strong></summary>

อ่านวิธีแก้แบบละเอียดใน [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**TL;DR**: เพิ่มอีเมลของคุณใน OAuth Consent Screen → Test users
</details>

<details>
<summary><strong>Q: ต้องการเปลี่ยนตารางเรียนเป็นอย่างอื่น</strong></summary>

แก้ไขใน `main.py` บรรทัด 480-485:
```python
user_intent = {
    "summary": "🎸 Guitar Practice",  # เปลี่ยนได้
    "start": datetime(2026, 6, 1, 19, 0),  # เปลี่ยนเวลาได้
    "duration_weeks": 12  # เปลี่ยนจำนวนสัปดาห์ได้
}
```
</details>

### 🚢 Next Steps (ขั้นต่อไป)

เมื่อทดลองใช้งานแล้ว ลองสำรวจ:

1. **[Python APIs](calendar_integrations.py)** - ดูวิธีต่อ Calendar APIs อื่นๆ
2. **[Unit Tests](test_main.py)** - ศึกษาวิธีเขียน tests
3. **[MCP Server](MCP_IMPLEMENTATION_GUIDE.md)** - Setup MCP protocol (Advanced)
4. **Customization** - ปรับ scoring algorithm ให้เหมาะกับคุณ

---

## 🆕 ฟีเจอร์ใหม่ล่าสุด

### 1. Interactive CLI
รับ input จากผู้ใช้หลังพบ conflict:
- ⭕ ข้ามสัปดาห์ที่ชน
- ⭕ ลงทับ (Overwrite)
- ⭕ **ใช้ Auto-Suggest (แนะนำ!)** ⭐
- ⭕ ยกเลิก

### 2. Smart Rescheduling Algorithm
คำนวณคะแนนความเหมาะสมของแต่ละช่วงเวลา (0-100) โดยพิจารณา:
- ช่วงเช้า/บ่ายที่ชอบ
- หลีกเลี่ยงช่วงกลางวัน/เย็น
- ระยะห่างจากเวลาที่ชอบ
- Fresh mind (ช่วงตอนต้นวัน)

### 3. OAuth Troubleshooting
เพิ่มเอกสาร [TROUBLESHOOTING.md](TROUBLESHOOTING.md) แก้ปัญหา Error 403: access_denied

### 4. MCP Server Guide
เอกสารสมบูรณ์ที่ [MCP_IMPLEMENTATION_GUIDE.md](MCP_IMPLEMENTATION_GUIDE.md)

---

## 🏗️ สถาปัตยกรรม (Architecture)

### 1. **Data Models** (โครงสร้างข้อมูล)
```python
@dataclass
class Event:
    summary: str      # ชื่อเหตุการณ์ (เช่น "📘 CS301: Data Mining")
    start: datetime   # เวลาเริ่ม
    end: datetime     # เวลาสิ้นสุด
```

### 2. **Interfaces** (หลักการ Dependency Inversion)
```python
class CalendarToolInterface(ABC):
    - get_events()    # ดึงรายการเหตุการณ์ที่มีอยู่
    - add_event()     # เพิ่มเหตุการณ์ใหม่
```

**ทำไมถึงใช้ Interface?**
- ✅ ปลดเปลื้อง (Decoupling): Agent ไม่ต้องรู้ว่าใช้ Google Calendar, Outlook, หรือ Mock
- ✅ ง่ายต่อการทดสอบ: สามารถสลับ Implementation ได้ง่าย
- ✅ ขยายได้ (Scalable): เพิ่มวิธีใหม่ได้โดยไม่แก้ Agent

### 3. **Mock Implementation** (การจำลองระบบจริง)
```python
class MockGoogleCalendarMCP(CalendarToolInterface):
```

ในตัวอย่าง มีนัดแพทย์อยู่แล้ว 1 นัด:
- 🦷 นัดทำฟันคลินิกหน้ามอ
- วันจันทร์, 8 มิ.ย. 2026, 10:00-11:00 น.

### 4. **Agent Logic** (สมองของเอay)
```python
class CalendarAgent:
```

มี 3 method หลัก:

#### a) `expand_recurring_events()`
แตกข้อมูลตารางเรียนจากแบบเดิมไป รายสัปดาห์

**ตัวอย่าง:**
- Input: CS301 ทุกจันทร์ เริ่ม 1 มิ.ย. 18 สัปดาห์
- Output: 18 Event objects (W1, W2, ..., W18)

#### b) `check_conflict()`
ตรวจสอบว่า Event ใหม่ชนกับ Event ที่มีอยู่ไหม

**สูตรตรวจสอบ:**
```
ชน = (new_start < exist_end) AND (new_end > exist_start)
```

#### c) `process_recurring_request()`
Method หลักที่ทำการตัดสินใจ 3 ขั้นตอน:

1. **แตกข้อมูล (Decompose)**: ขยาย 1 ตารางเป็น 18 Event
2. **ดึงข้อมูล (Fetch)**: ดึงข้อมูล Event ที่มีในเทอมนั้น
3. **ตรวจสอบและตัดสินใจ (Check & Decide)**:
   - ถ้าไม่มีความชน → บันทึกทั้งหมด
   - ถ้ามีความชน → แจ้งเตือน (Human-in-the-loop)

---

## 🎬 ตัวอย่างการรัน (Execution Example)

### Input (คำสั่งจากผู้ใช้)
```python
user_intent = {
    "summary": "📘 CS301: Data Mining",
    "start": datetime(2026, 6, 1, 9, 30),  # จันทร์ที่ 1 มิ.ย. 2026
    "duration_weeks": 4                      # 4 สัปดาห์
}
```

### Process (ขั้นตอนการประมวลผล)

1. **ขยายตาราง:**
   ```
   W1: 1 มิ.ย. 09:30-12:30
   W2: 8 มิ.ย. 09:30-12:30  ← ชนกับ นัดทำฟัน 10:00-11:00
   W3: 15 มิ.ย. 09:30-12:30
   W4: 22 มิ.ย. 09:30-12:30
   ```

2. **ตรวจสอบความชน:**
   - W1: ปลอดภัย ✅
   - W2: ชนกับ นัดทำฟัน ⚠️
   - W3: ปลอดภัย ✅
   - W4: ปลอดภัย ✅

3. **ตัดสินใจ:**
   ```
   ⚠️ ผมตรวจสอบตารางเรียนทั้งหมด 4 สัปดาห์ พบเวลาชนกันครับ:
   - สัปดาห์วันที่ 2026-06-08: ชนกับ '🦷 นัดทำฟันคลินิกหน้ามอ' (10:00-11:00)
   
   คุณต้องการให้ผม:
   1. ข้ามการลงตารางในสัปดาห์ที่ชน
   2. ลงทับไปเลย (Overwrite)
   3. ยกเลิกทั้งหมดเพื่อไปจัดการคิวใหม่
   ```

---

## 🔑 แนวคิดหลัก (Key Concepts)

### 1. **Dependency Injection (DI)**
Agent รับ `CalendarToolInterface` เข้ามาผ่าน constructor แทนที่จะสร้างเองใน method
```python
agent = CalendarAgent(mcp_tool)  # ส่งเครื่องมือเข้าไป
```

### 2. **Separation of Concerns (SoC)**
- **Agent**: จัดการตรรกะและตัดสินใจ
- **MCP Tool**: สื่อสารกับปฏิทิน
- **Models**: โครงสร้างข้อมูล

### 3. **Human-in-the-Loop**
เมื่อพบปัญหา Agent ไม่สามารถตัดสินใจเอง แต่เสนอตัวเลือกให้ผู้ใช้

### 4. **Recurring Pattern**
ระบุหน่วย "สัปดาห์" แล้วขยายอัตโนมัติ แทนที่ผู้ใช้ต้องใส่รายละเอียด 18 สัปดาห์

---

## 💻 วิธีรัน

### Quick Start (Demo Mode)
```bash
# จาก folder python/
python main.py
```

**Output ที่คาดหวัง:**
```
🤖 [Agent] ได้รับคำสั่ง: จัดการตารางเรียน 1 เทอม
   [Mock Tool] 🔍 กำลังค้นหา Event ...
   [Mock Tool] ✅ บันทึกลงปฏิทิน...
⚠️ [Agent Alert] ผมตรวจสอบตารางเรียนทั้งหมด 4 สัปดาห์ พบเวลาชนกันครับ: ...
```

### With Different Integrations

```bash
# Mock mode (default - สำหรับ demo)
python example_usage.py --mode mock

# Google Calendar API (ต่อปฏิทินจริง)
python example_usage.py --mode api --credentials credentials.json

# MCP Server mode (ผ่าน MCP protocol)
python example_usage.py --mode mcp

# ดูคู่มือการติดตั้ง
python example_usage.py --mode api --setup-guide
```

### Run Tests

```bash
# รัน unit tests ทั้งหมด
python -m pytest test_main.py -v

# รัน test เฉพาะ class
python -m pytest test_main.py::TestCheckConflict -v

# แสดง coverage
python -m pytest test_main.py --cov=main --cov-report=html
```

---

## 🔌 Calendar Integrations

โปรเจคนี้รองรับ 3 วิธีในการเชื่อมต่อปฏิทิน:

### 1. Mock Calendar (Default)
- ✅ ไม่ต้องติดตั้งอะไรเพิ่ม
- ✅ สำหรับ testing และ demo
- ✅ มีข้อมูล mock พร้อมใช้

```python
from calendar_integrations import get_calendar_tool

calendar = get_calendar_tool("mock")
```

### 2. Google Calendar API
- 🔐 ใช้ OAuth2 authentication
- 📅 เชื่อมต่อปฏิทิน Google จริง
- 📝 ต้องตั้งค่า credentials

**Requirements:**
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

**Usage:**
```python
from calendar_integrations import get_calendar_tool

calendar = get_calendar_tool("api", credentials_path="credentials.json")
```

<details>
<summary><strong>📘 คู่มือตั้งค่า Google Cloud (คลิกเพื่อดูรายละเอียด)</strong></summary>

#### 📖 ศัพท์ที่ควรรู้

| คำศัพท์ | คำอธิบาย |
|---------|----------|
| **Google Cloud Project** | "แฟ้มเอกสาร" ที่รวมการตั้งค่า สิทธิ์ และโควต้าการใช้งาน API |
| **Enable API** | เปิดสวิตช์บอก Google ว่า "โปรเจกต์นี้ขอใช้ Calendar" |
| **OAuth Consent Screen** | หน้าจอถามผู้ใช้ว่า "แอปนี้ขอเข้าถึงปฏิทินของคุณ ยอมรับไหม?" |
| **OAuth 2.0 Credentials** | กุญแจ (Client ID + Secret) ที่แอปใช้ยืนยันตัวตนกับ Google โดยไม่ต้องรู้รหัสผ่าน |

#### 🛠️ ขั้นตอนการตั้งค่า

##### Step 1: สร้าง Google Cloud Project

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. ล็อกอินด้วยบัญชี Google
3. คลิก Dropdown ด้านบนสุด (ใกล้โลโก้) → **New Project**
4. ตั้งชื่อโปรเจกต์ เช่น `AI-Calendar-Agent`
5. กด **Create**

📌 คุณจะได้ **Project ID** (ดูได้ใน Dashboard)

##### Step 2: เปิดใช้งาน Google Calendar API

1. ไปที่เมนูด้านซ้าย → **APIs & Services** → **Library**
2. ค้นหา: `Google Calendar API`
3. คลิกผลลัพธ์แรก → กด **Enable**

##### Step 3: ตั้งค่า OAuth Consent Screen

1. ไปที่ **APIs & Services** → **OAuth consent screen**
2. เลือก **User Type: External** → **Create**
3. กรอกข้อมูลที่บังคับ (3 ช่อง):
   - **App name**: My Calendar Agent
   - **User support email**: [อีเมลของคุณ]
   - **Developer contact**: [อีเมลของคุณ]
4. กด **Save and Continue** ข้ามขั้นตอน Scopes และ Test users จนถึง Summary

##### Step 4: สร้าง Credentials

1. ไปที่ **APIs & Services** → **Credentials**
2. คลิก **+ CREATE CREDENTIALS** → **OAuth client ID**
3. เลือก **Application type**: **Desktop app**
4. ตั้งชื่อ เช่น `MCP Python Client` → **Create**
5. จะมี Pop-up แสดง Client ID และ Secret

📌 **สำคัญ**: คลิก **DOWNLOAD JSON**
6. เปลี่ยนชื่อไฟล์เป็น `credentials.json`
7. วางไฟล์ใน folder `python/`

##### Step 5: ตั้งค่า Environment Variables (Optional)

```bash
export GOOGLE_CALENDAR_CREDENTIALS_PATH="credentials.json"
```

##### Step 6: ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

##### Step 7: รันโปรแกรม

```bash
python example_usage.py --mode api
```

🌐 Browser จะเปิดขึ้นให้ authorize ครั้งแรก หลังจากนั้นจะสร้างไฟล์ `token.json` สำหรับใช้ครั้งต่อไป

#### 🔒 Security Best Practices

⚠️ **ห้ามยกเด็ดขาด**:
- ❌ commit `credentials.json` ขึ้น GitHub
- ❌ commit `token.json` ขึ้น GitHub
- ❌ commit `.env` ที่มี secrets

✅ **ทำแทน**:
- ใช้ `.gitignore` (เพิ่มไว้แล้วใน repo นี้)
- สร้าง `.env.example` เป็น template
- เก็บ secrets ใน environment variables สำหรับ production

#### 🧪 ทดสอบการเชื่อมต่อ

```bash
# ทดสอบด้วยคำสั่ง
python example_usage.py --mode api --credentials credentials.json

# ดูคู่มือเพิ่มเติม
python example_usage.py --mode api --setup-guide
```

#### ❓ Troubleshooting

| ปัญหา | วิธีแก้ |
|-------|---------|
| `FileNotFoundError: credentials.json` | ตรวจสอบว่าไฟล์อยู่ใน folder `python/` |
| `invalid_client` | ดาวน์โหลด credentials.json ใหม่ |
| `access_denied` | ตรวจสอบว่า Enable Calendar API แล้ว |
| `redirect_uri_mismatch` | ใช้ Application type เป็น "Desktop app" |

</details>

### 3. MCP Server (Coming Soon)
- 🚀 ใช้ Model Context Protocol
- 🔗 สื่อสารผ่าน MCP server
- ⚠️ ยังอยู่ระหว่างพัฒนา

```python
from calendar_integrations import get_calendar_tool

calendar = get_calendar_tool("mcp", server_url="http://localhost:3000")
```

---

## 🎯 Use Cases (กรณีการใช้งาน)

| Scenario | ผลลัพธ์ |
|----------|---------|
| ลงตารางที่ไม่ชน | ✅ บันทึกทั้งหมด |
| ชนกับนัดอื่น | ⚠️ แจ้งเตือนและรอการตัดสินใจ |
| ชนหลายสัปดาห์ | ⚠️ แสดงรายการความชนทั้งหมด |

---

## 🔮 ขั้นตอนขยาย (Future Extensions)

1. **Auto-Suggest**: ✅ แนะนำช่วงเวลาทางเลือก (เสร็จแล้ว!)
2. **Multiple Calendar Support**: สนับสนุนปฏิทินหลายแบบ (Google, Outlook, etc.)
3. **Smart Scheduling**: ใช้ AI เลือกเวลาที่ดีที่สุดโดยอัตโนมัติ
4. **Notification**: ส่ง reminder เมื่อใกล้เวลา Event
5. **Recurring Patterns**: รองรับรูปแบบซ้ำเพิ่มเติม (รายวัน, รายเดือน)

---

## 🧪 ทดสอบโปรแกรม

### ทดสอบทั้งระบบ
```bash
# รัน tests ทั้งหมด (25 tests)
python -m pytest test_main.py -v

# แสดง test coverage
python -m pytest test_main.py --cov=main --cov-report=term-missing

# รัน specific test suite
python -m pytest test_main.py::TestAutoSuggest -v
```

### ทดสอบ Google Calendar API
```bash
# ต้องมี credentials.json ก่อน
python test_google_calendar.py
```

**หมายเหตุ**: การทดสอบครั้งแรกจะเปิด browser ให้ authorize และสร้าง `token.json` สำหรับใช้ต่อ

---

## 📚 Reference

- **MCP (Model Context Protocol)**: Protocol สำหรับ AI ใช้ทำงานกับเครื่องมือภายนอก
- **Dependency Injection**: Pattern ที่ช่วยให้โค้ดนั้ง loose coupling
- **Recurring Events**: เหตุการณ์ที่เกิดซ้ำตามรูปแบบ (เช่น ทุกวันจันทร์)
