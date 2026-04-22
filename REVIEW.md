# REVIEW: ภาพรวมโปรเจกต์ `google-calendar-mcp` / Blueprint Hub Monorepo

## 1) โปรเจกต์นี้คืออะไร

โปรเจกต์นี้เป็น monorepo ที่รวมงานไว้ 3 ส่วนหลักใน repo เดียวกัน โดยแกนใหญ่จริง ๆ คือระบบแนว **AI-assisted requirements / architecture platform** และมีอีกก้อนหนึ่งเป็น **Calendar Agent + Google Calendar + MCP integration** อยู่ในโฟลเดอร์ `python/`

ถ้าสรุปแบบสั้นที่สุด:

- `frontend/` คือเว็บแอปหลักของ Blueprint Hub
- `backend/` คือ API และ logic ฝั่ง Python สำหรับ generate spec และ visualization
- `python/` คือ Calendar Agent แยกอีกระบบหนึ่ง สำหรับจัดการ event, recurring events, conflict detection, natural language planning, Google Calendar และ MCP

ดังนั้น repo นี้ไม่ได้เป็นแค่ "Google Calendar MCP" อย่างเดียว แต่เป็น repo ที่มีทั้ง:

- ระบบสร้าง/จัดการ software specs ด้วย AI
- ระบบสร้าง diagram/visualization จาก spec
- ระบบ Calendar Agent ที่ต่อ Google Calendar และ MCP ได้

## 2) เป้าหมายของโปรเจกต์

ภาพรวมของ repo นี้พยายามแก้ 2 ปัญหาหลัก:

1. ทำให้การเปลี่ยน "ไอเดียดิบ" หรือ requirement ที่ยังไม่เป็นระเบียบ ให้กลายเป็นเอกสาร spec ที่อ่านต่อและพัฒนาได้
2. ทำให้การจัดการตารางเวลาและ event ทำได้ฉลาดขึ้น เช่น recurring events, ตรวจเวลาชน, หาเวลาว่างใหม่, และรับคำสั่งแบบภาษาธรรมชาติ

พูดอีกแบบคือ repo นี้รวมทั้งมุมของ:

- AI for software analysis / spec generation
- AI-assisted visualization
- AI-assisted calendar operations

## 3) โครงสร้างหลักของ Monorepo

```text
google-calendar-mcp/
├── frontend/   # Next.js + React + TypeScript + Prisma
├── backend/    # FastAPI + Streamlit + Gemini + JSON/PostgreSQL storage
├── python/     # Calendar Agent + Flask UI + Google Calendar + MCP server
├── docs/       # เอกสารประกอบจำนวนมาก
├── README.md   # ภาพรวมระดับ repo
└── REVIEW.md   # เอกสารสรุปฉบับนี้
```

## 4) สรุปแต่ละส่วนของโปรเจกต์

### 4.1 `frontend/` ทำอะไร

`frontend/` เป็นเว็บแอปหลักของ Blueprint Hub พัฒนาด้วย:

- Next.js
- React
- TypeScript
- Prisma
- NextAuth/Auth.js

หน้าที่หลักของฝั่งนี้คือ:

- แสดงรายการ blueprint / spec / project
- ให้ผู้ใช้ login ผ่าน OAuth
- เรียก API เพื่อ generate spec
- แสดงผลเอกสารที่ AI สร้าง
- แสดง Mermaid / Excalidraw visualization
- บันทึก spec ลง database ผ่าน API routes

สิ่งที่เห็นได้จากโค้ด:

- หน้าแรกอยู่ที่ `frontend/app/page.tsx`
- มีหน้า generator สำหรับสร้าง spec
- มี API routes ใต้ `frontend/app/api/`
- ใช้ Prisma schema ที่ `frontend/prisma/schema.prisma`
- ใช้ NextAuth สำหรับ session / auth

สรุปบทบาท:

> `frontend/` คือ "หน้าบ้าน" ของระบบ Blueprint Hub

### 4.2 `backend/` ทำอะไร

`backend/` เป็นฝั่ง Python สำหรับงาน generate และจัดการข้อมูล spec โดยมีทั้ง:

- FastAPI API server
- Streamlit app
- storage abstraction ที่รองรับ JSON file และ PostgreSQL
- logic สำหรับสร้าง Mermaid / Excalidraw visualization

จากไฟล์หลัก:

- `backend/api.py` คือ FastAPI app หลัก
- `backend/app.py` คือ Streamlit UI สำหรับ generate spec แบบ interactive
- `backend/db.py` คือ abstraction สำหรับบันทึก spec ลงไฟล์ JSON หรือ PostgreSQL
- `backend/run_server.py` คือ helper สำหรับรัน FastAPI บน Windows ได้ง่ายขึ้น

สิ่งที่ backend ทำได้:

- รับ prompt แล้วส่งให้ Gemini สร้าง structured spec
- บันทึก spec ลง JSON และ/หรือ PostgreSQL
- สร้าง process description
- แปลง process description เป็น Mermaid
- แปลง process description เป็น Excalidraw JSON
- รองรับ fallback แบบ mock เมื่อ quota ของ LLM มีปัญหา

สรุปบทบาท:

> `backend/` คือ "สมองฝั่ง spec generation และ visualization" ของ Blueprint Hub

### 4.3 `python/` ทำอะไร

`python/` เป็นอีก subsystem หนึ่งที่แยกจาก Blueprint Hub ค่อนข้างชัด โดยเน้นเรื่อง Calendar Agent

เทคโนโลยีหลัก:

- Python
- Flask
- Google Calendar API
- MCP client/server
- Natural language parsing

หน้าที่หลัก:

- สร้าง recurring events
- ตรวจ conflict ของเวลา
- หาเวลาว่างอัตโนมัติ
- scoring เวลาที่เหมาะสม
- รับคำสั่งภาษาธรรมชาติแล้วแปลงเป็น event plan
- สร้าง event ลง calendar backend
- ต่อ Google Calendar จริง
- ต่อ MCP server ผ่าน Node.js

ไฟล์สำคัญ:

- `python/main.py` เป็นตัวอย่าง core Calendar Agent logic
- `python/app.py` เป็น Flask Web UI + API
- `python/calendar_integrations.py` รวม integration หลายแบบ
- `python/nl_agent.py` สำหรับ parse ภาษาธรรมชาติ
- `python/mcp_client.py` สำหรับคุยกับ MCP
- `python/mcp-server/server.js` เป็น MCP server ฝั่ง Node.js

สรุปบทบาท:

> `python/` คือ "ระบบ Calendar Agent แบบ standalone" ที่มีทั้ง CLI, Flask UI, Google Calendar integration และ MCP

## 5) Architecture แบบย่อ

### ภาพรวมระดับสูง

```text
ผู้ใช้
  |
  v
Frontend (Next.js)
  |
  +--> Next.js API routes / Prisma / Auth
  |
  +--> Backend FastAPI (generate spec / diagram)
  |
  v
PostgreSQL / JSON storage

แยกอีกสาย:

ผู้ใช้
  |
  v
Python Flask UI / CLI
  |
  +--> Calendar Agent logic
  +--> Google Calendar API
  +--> MCP Client <-> MCP Server (Node.js)
```

### ประเด็นสำคัญ

- `frontend` กับ `backend` ทำงานคู่กันเป็นระบบ Blueprint Hub
- `python` เป็นอีกระบบหนึ่งที่อยู่ใน repo เดียวกัน แต่มีจุดประสงค์คนละด้าน
- `backend` ใช้แนวคิด dual storage คือเก็บได้ทั้งไฟล์ JSON และ PostgreSQL
- `python` รองรับหลายโหมด เช่น mock, api, mcp

## 6) Data Flow แบบเข้าใจง่าย

### กรณี Blueprint Hub

1. ผู้ใช้เปิดเว็บจาก `frontend/`
2. ผู้ใช้กรอกไอเดียหรือ requirement
3. `frontend` เรียก API ที่เกี่ยวข้อง
4. `backend/api.py` ส่ง prompt ไปให้ Gemini
5. ได้ structured spec กลับมา
6. บันทึกลง JSON และ/หรือ PostgreSQL
7. ถ้าต้องการ visualization ก็ generate Mermaid หรือ Excalidraw ต่อ
8. `frontend` ดึงข้อมูลกลับมาแสดงใน UI

### กรณี Calendar Agent

1. ผู้ใช้สั่งผ่าน CLI, Flask UI หรือ natural language endpoint
2. Agent parse intent
3. ขยาย recurring events
4. ตรวจสอบเวลาชนกับ event เดิม
5. ถ้ามี conflict จะหาเวลาทางเลือกและจัดอันดับ
6. บันทึกลง mock calendar, Google Calendar API หรือ MCP backend ตาม mode ที่ใช้

## 7) Feature สำคัญของแต่ละส่วน

### ฝั่ง `frontend`

- หน้าเว็บสำหรับดู projects / specs
- login ด้วย OAuth
- เรียก backend เพื่อ generate spec
- แสดงผล document view / JSON view
- แสดง visualization เช่น Mermaid / Excalidraw
- มี unit tests และ E2E tests

### ฝั่ง `backend`

- รับ prompt แล้วสร้าง structured requirement/spec
- บันทึกข้อมูลได้ทั้ง filesystem และ PostgreSQL
- มี health endpoint
- มี endpoint สำหรับ generate diagram และ visualization
- มี fallback เมื่อ quota ของ Gemini หมด
- รองรับการเก็บ visualization กลับเข้า spec

### ฝั่ง `python`

- recurring event expansion
- conflict detection
- slot suggestion
- slot scoring
- natural language event planning
- natural language execution
- Flask Web UI
- Google Calendar API integration
- MCP server integration
- Docker deployment หลาย profile

## 8) ไฟล์และโฟลเดอร์สำคัญที่ควรรู้

### ระดับ repo

- `README.md` ภาพรวมทั้งโปรเจกต์
- `REVIEW.md` สรุปฉบับอ่านเร็ว
- `docs/` เอกสารเชิงลึก

### ฝั่ง `frontend`

- `frontend/package.json` คำสั่งหลักของ frontend
- `frontend/app/page.tsx` หน้าแรก
- `frontend/app/generator-test/page.tsx` หน้า generator หลัก
- `frontend/prisma/schema.prisma` โครงสร้างฐานข้อมูลของฝั่งเว็บ
- `frontend/.env.example` ตัวอย่าง env

### ฝั่ง `backend`

- `backend/api.py` FastAPI endpoints
- `backend/app.py` Streamlit app
- `backend/db.py` storage abstraction
- `backend/run_server.py` ตัวช่วยรัน FastAPI
- `backend/docker-compose.yml` PostgreSQL + pgAdmin
- `backend/.env.example` ตัวอย่าง env

### ฝั่ง `python`

- `python/main.py` logic หลักของ Calendar Agent
- `python/app.py` Flask app
- `python/calendar_integrations.py` integration layer
- `python/nl_agent.py` parse ภาษาธรรมชาติ
- `python/mcp_client.py` MCP client
- `python/mcp-server/server.js` MCP server
- `python/docker-compose.yml` deployment ของ Calendar Agent
- `python/.env.example` ตัวอย่าง env

## 9) Environment Variables ที่ควรรู้

เอกสารนี้จะอ้างอิงเฉพาะ `.env.example` และจะไม่ดึง secret จริงจาก `.env`

### `frontend/.env.example`

ค่าหลักที่ต้องรู้:

- `GEMINI_API_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `GOOGLE_ID`
- `GOOGLE_SECRET`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

ใช้เมื่อ:

- รันเว็บ
- ใช้ auth
- ต่อ Prisma/PostgreSQL
- ใช้ Gemini

### `backend/.env.example`

ค่าหลัก:

- `GEMINI_API_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `ENVIRONMENT`
- `DEBUG`
- `ALLOWED_ORIGINS`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

ใช้เมื่อ:

- รัน FastAPI / Streamlit
- ต่อ PostgreSQL
- เรียกโมเดล

### `python/.env.example`

ค่าหลัก:

- `CALENDAR_MODE`
- `FLASK_ENV`
- `PORT`
- `SECRET_KEY`
- `CREDENTIALS_PATH`
- `TOKEN_PATH`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `TIMEZONE`
- `MCP_SERVER_PORT`

feature flags ที่น่าสนใจ:

- `ENABLE_CONFLICT_DETECTION`
- `ENABLE_AUTO_SUGGEST`
- `ENABLE_SCORING`
- `ENABLE_INTERACTIVE_MODE`

## 10) คำสั่งติดตั้งและเริ่มต้นใช้งาน

## 10.1 Setup แยกตามส่วน

### Frontend

```bash
cd frontend
bun install
```

### Backend

```bash
cd backend
uv sync
```

### Python Calendar Agent

```bash
cd python
pip install -r requirements.txt
```

## 11) คำสั่ง Run ที่เกี่ยวข้องทั้งหมด

## 11.1 Frontend

รัน dev server:

```bash
cd frontend
bun run dev
```

build production:

```bash
cd frontend
bun run build
```

lint:

```bash
cd frontend
bun run lint
```

unit tests:

```bash
cd frontend
bun run test:unit
```

ติดตั้ง browser สำหรับ Playwright:

```bash
cd frontend
bun run test:e2e:install
```

รัน E2E tests:

```bash
cd frontend
bun run test:e2e
```

Prisma generate:

```bash
cd frontend
bunx prisma generate
```

Prisma push:

```bash
cd frontend
bunx prisma db push
```

Prisma migrate:

```bash
cd frontend
bunx prisma migrate dev
```

Prisma Studio:

```bash
cd frontend
bunx prisma studio
```

## 11.2 Backend

รันผ่าน helper script:

```bash
cd backend
uv run python run_server.py
```

รัน FastAPI ตรง ๆ:

```bash
cd backend
uv run uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

รัน Streamlit app:

```bash
cd backend
uv run streamlit run app.py
```

รัน tests:

```bash
cd backend
uv run pytest
```

รัน Docker Compose ของ backend:

```bash
cd backend
docker-compose up -d
```

หมายเหตุ:

- `backend/docker-compose.yml` เน้น PostgreSQL + pgAdmin สำหรับฝั่ง spec storage
- ตัว API app หลักยังรันด้วย `uvicorn`/`run_server.py`

## 11.3 Python Calendar / MCP

รัน demo CLI:

```bash
cd python
python main.py
```

รัน Flask Web UI:

```bash
cd python
python app.py
```

mock mode:

```bash
cd python
python example_usage.py --mode mock
```

Google Calendar API mode:

```bash
cd python
python example_usage.py --mode api --credentials credentials.json
```

MCP mode:

```bash
cd python
python example_usage.py --mode mcp
```

ทดสอบ Google Calendar:

```bash
cd python
python test_google_calendar.py
```

รัน tests:

```bash
cd python
python -m pytest test_main.py -v
```

รัน MCP server:

```bash
cd python/mcp-server
npm install
node server.js
```

จาก `package.json` ใน `python/mcp-server/` ยังมีคำสั่งเพิ่ม:

```bash
cd python/mcp-server
npm start
```

และ dev mode:

```bash
cd python/mcp-server
npm run dev
```

Docker แบบ default:

```bash
cd python
docker-compose up --build
```

Docker พร้อม database:

```bash
cd python
docker-compose --profile with-db up
```

Docker พร้อม MCP:

```bash
cd python
docker-compose --profile with-mcp up
```

Docker production profile:

```bash
cd python
docker-compose --profile production up
```

## 12) ความแตกต่างระหว่าง `backend/` กับ `python/`

จุดนี้สำคัญมาก เพราะชื่อทั้งสองฝั่งเป็น Python เหมือนกัน แต่หน้าที่ไม่เหมือนกัน

### `backend/`

- เป็น backend ของ Blueprint Hub
- โฟกัสที่ spec generation
- โฟกัสที่ visualization
- ใช้ FastAPI และ Streamlit
- เก็บ spec เป็น JSON/PostgreSQL

### `python/`

- เป็น Calendar Agent แยกอีกระบบ
- โฟกัสที่ event scheduling
- โฟกัสที่ Google Calendar และ MCP
- ใช้ Flask, CLI และ Node MCP server
- มี natural language planning/execution

ถ้าอ่าน repo แล้วสับสน ให้จำง่าย ๆ แบบนี้:

- `frontend + backend` = ระบบ Blueprint Hub
- `python` = ระบบ Calendar Agent

## 13) วิธีเริ่มอ่านโปรเจกต์สำหรับคนใหม่

ลำดับที่แนะนำ:

1. อ่าน `README.md` เพื่อเอาภาพรวม
2. อ่านไฟล์นี้ `REVIEW.md` เพื่อเข้าใจภาพรวมแบบย่อ
3. ถ้าสนใจ Blueprint Hub ให้เริ่มที่:
   - `frontend/app/page.tsx`
   - `frontend/app/generator-test/page.tsx`
   - `backend/api.py`
   - `backend/db.py`
4. ถ้าสนใจ Calendar Agent ให้เริ่มที่:
   - `python/README.md`
   - `python/main.py`
   - `python/app.py`
   - `python/calendar_integrations.py`
5. ถ้าจะดูภาพเชิงเอกสารต่อ ให้ไป `docs/`

## 14) ข้อดีของโครงสร้างโปรเจกต์นี้

- มีเอกสารค่อนข้างเยอะ ทำให้ onboard ง่ายขึ้น
- แยก concerns ค่อนข้างชัดระหว่าง UI, API, storage, visualization, calendar logic
- มีหลาย interface สำหรับใช้งาน เช่น web, API, CLI, Docker
- มี test infrastructure หลายแบบ
- มีการเผื่อ fallback เมื่อ external model quota มีปัญหา

## 15) จุดที่ควรระวังเวลาใช้งาน

- repo นี้มีหลาย subsystem อยู่ด้วยกัน ทำให้ชื่อและหน้าที่อาจดูซ้อนกันตอนแรก
- ต้องแยกให้ออกว่าเรากำลังรัน Blueprint Hub หรือ Calendar Agent
- env ของแต่ละโฟลเดอร์ไม่เหมือนกัน
- บางฟีเจอร์ต้องพึ่ง external services เช่น Gemini, Google OAuth, Google Calendar, PostgreSQL
- บางคำสั่งในเอกสารเก่าบางจุดอาจใช้ `npm` หรือ `bun` ปนกัน ต้องอิง `package.json` และไฟล์ config จริงเป็นหลัก

## 16) Troubleshooting เบื้องต้น

### เว็บ frontend เปิดไม่ขึ้น

เช็ก:

- รัน `bun install` แล้วหรือยัง
- ตั้งค่า `frontend/.env` หรือ `.env.local` ครบหรือยัง
- database พร้อมหรือยัง
- `bun run dev` มี error เรื่อง auth หรือ prisma หรือไม่

### FastAPI ฝั่ง backend ใช้งานไม่ได้

เช็ก:

- ติดตั้ง dependencies ด้วย `uv sync` แล้วหรือยัง
- env ของ `backend/` ครบหรือยัง
- รัน `uv run python run_server.py` หรือ `uv run uvicorn api:app --reload ...` ได้หรือไม่
- PostgreSQL พร้อมหรือยังถ้าจะใช้ database backend

### Calendar Agent ใช้ Google Calendar ไม่ได้

เช็ก:

- มี `credentials.json` หรือยัง
- มี `token.json` หรือยัง
- Google OAuth setup ครบหรือยัง
- ลอง `python test_google_calendar.py`

### MCP server ใช้งานไม่ได้

เช็ก:

- Node version ต้องรองรับ `>=18`
- รัน `npm install` ใน `python/mcp-server` แล้วหรือยัง
- server start ได้ด้วย `node server.js` หรือ `npm start` หรือไม่

### Docker profile ทำงานไม่ตรงที่คาด

เช็ก:

- รันในโฟลเดอร์ให้ถูก (`backend/` กับ `python/` มี docker-compose คนละไฟล์)
- ใช้ profile ให้ตรงกับสิ่งที่ต้องการ
- env ที่ compose ต้องใช้มีครบหรือยัง

## 17) สรุปสุดท้าย

โปรเจกต์นี้เป็น monorepo ที่รวม 2 domain ใหญ่ไว้ด้วยกัน:

- ระบบ Blueprint Hub สำหรับแปลงไอเดีย/requirements ให้กลายเป็น spec และ visualization
- ระบบ Calendar Agent สำหรับจัดการ event, Google Calendar และ MCP

ถ้าเป้าหมายของคุณคืออ่านเพื่อเข้าใจทั้ง repo:

- มอง `frontend + backend` เป็นชุดแรก
- มอง `python` เป็นชุดที่สอง

ถ้าเป้าหมายของคุณคือเริ่มรัน:

- เว็บและ spec generation ให้เริ่มที่ `frontend/` และ `backend/`
- งาน calendar / MCP ให้เริ่มที่ `python/`

## 18) Cheat Sheet แบบสั้นมาก

Blueprint Hub:

```bash
cd backend
uv sync
uv run python run_server.py
```

```bash
cd frontend
bun install
bun run dev
```

Calendar Agent:

```bash
cd python
pip install -r requirements.txt
python app.py
```

Calendar CLI demo:

```bash
cd python
python main.py
```
