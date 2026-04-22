# ==========================================
# Google Calendar Integration Module
# ==========================================
"""
โมดูลนี้รวบรวม Implementation ต่างๆ ของ CalendarToolInterface:
1. MockGoogleCalendarMCP - สำหรับ testing/demo
2. GoogleCalendarAPI - ต่อ Google Calendar API จริง (OAuth2)
3. GoogleCalendarMCP - ผ่าน MCP Server (MCP Protocol)

วิธีใช้:
    from calendar_integrations import get_calendar_tool

    # เลือก implementation
    calendar = get_calendar_tool(mode="mock")  # หรือ "api", "mcp"
    agent = CalendarAgent(calendar)
"""

import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from typing import List, Optional, Dict, Any

# Import interface จาก main
try:
    from main import CalendarToolInterface, Event
except ImportError:
    # Define locally ถ้า import ไม่ได้
    class CalendarToolInterface(ABC):
        @abstractmethod
        def get_events(self, start_date: datetime, end_date: datetime) -> List['Event']:
            pass

        @abstractmethod
        def add_event(self, event: 'Event') -> bool:
            pass

    @dataclass
    class Event:
        summary: str
        start: datetime
        end: datetime
        event_type: str = "event"  # event, task, working_location, out_of_office, birthday
        location: Optional[str] = None
        description: Optional[str] = None
        is_all_day: bool = False
        reminders_minutes_before: Optional[int] = None

# ==========================================
# 1. Mock Implementation (เดิม - สำหรับ Testing)
# ==========================================
class MockGoogleCalendarMCP(CalendarToolInterface):
    """Mock calendar สำหรับ testing และ demo"""

    def __init__(self):
        self.db: List[Event] = [
            Event(
                summary="🦷 นัดทำฟันคลินิกหน้ามอ",
                start=datetime(2026, 6, 8, 10, 0),
                end=datetime(2026, 6, 8, 11, 0)
            )
        ]

    def get_events(self, start_date: datetime, end_date: datetime) -> List[Event]:
        print(f"   [Mock Tool] 🔍 กำลังค้นหา Event ตั้งแต่ {start_date.strftime('%Y-%m-%d')} ถึง {end_date.strftime('%Y-%m-%d')}...")
        # TODO: อาจเพิ่ม filter ตาม date range
        return self.db

    def add_event(self, event: Event) -> bool:
        print(f"   [Mock Tool] ✅ บันทึกลงปฏิทินสำเร็จ: {event.summary} ({event.start.strftime('%Y-%m-%d %H:%M')})")
        self.db.append(event)
        return True

# ==========================================
# 2. Google Calendar API Implementation (OAuth2)
# ==========================================
class GoogleCalendarAPI(CalendarToolInterface):
    """
    ต่อ Google Calendar API จริงด้วย OAuth2

    Requirements:
        pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

    Setup:
        1. สร้าง project ใน Google Cloud Console
        2. Enable Google Calendar API
        3. สร้าง OAuth 2.0 credentials
        4. ดาวน์โหลด credentials.json
        5. ตั้งค่า environment variable: GOOGLE_CALENDAR_CREDENTIALS_PATH

    Usage:
        calendar = GoogleCalendarAPI(
            credentials_path="path/to/credentials.json",
            token_path="token.json"
        )
    """

    def __init__(
        self,
        credentials_path: Optional[str] = None,
        token_path: str = "token.json",
        calendar_id: str = "primary"
    ):
        self.credentials_path = credentials_path or os.getenv("GOOGLE_CALENDAR_CREDENTIALS_PATH")
        self.token_path = token_path
        self.calendar_id = calendar_id
        self.service = None

        # Lazy initialization - เรียกเมื่อใช้งานจริง
        self._initialized = False

    def _initialize(self):
        """Initialize Google Calendar API service"""
        if self._initialized:
            return

        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from googleapiclient.discovery import build

            SCOPES = ['https://www.googleapis.com/auth/calendar']

            creds = None
            # โหลด token ที่มีอยู่
            if os.path.exists(self.token_path):
                creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)

            # ถ้าไม่มี credentials หรือหมดอายุ
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not self.credentials_path or not os.path.exists(self.credentials_path):
                        raise FileNotFoundError(
                            f"❌ ไม่พบ credentials.json ที่ {self.credentials_path}\n"
                            "กรุณา:\n"
                            "1. สร้าง OAuth credentials ใน Google Cloud Console\n"
                            "2. ดาวน์โหลด credentials.json\n"
                            "3. ตั้งค่า GOOGLE_CALENDAR_CREDENTIALS_PATH environment variable"
                        )

                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, SCOPES
                    )
                    creds = flow.run_local_server(port=0)

                # บันทึก token สำหรับครั้งหน้า
                with open(self.token_path, 'w') as token:
                    token.write(creds.to_json())

            self.service = build('calendar', 'v3', credentials=creds)
            self._initialized = True
            print("   [Google API] ✅ เชื่อมต่อ Google Calendar สำเร็จ")

        except ImportError:
            raise ImportError(
                "❌ ต้องติดตั้ง Google Calendar API libraries:\n"
                "pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client"
            )
        except Exception as e:
            raise RuntimeError(f"❌ เชื่อมต่อ Google Calendar ไม่สำเร็จ: {e}")

    def get_events(self, start_date: datetime, end_date: datetime) -> List[Event]:
        """ดึง events จาก Google Calendar"""
        self._initialize()

        print(f"   [Google API] 🔍 กำลังค้นหา Event ตั้งแต่ {start_date.strftime('%Y-%m-%d')} ถึง {end_date.strftime('%Y-%m-%d')}...")

        try:
            # Convert to RFC3339 timestamp
            time_min = start_date.isoformat() + 'Z'
            time_max = end_date.isoformat() + 'Z'

            events_result = self.service.events().list(
                calendarId=self.calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            events = events_result.get('items', [])

            # แปลงเป็น Event objects
            result = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))

                result.append(Event(
                    summary=event.get('summary', '(No title)'),
                    start=datetime.fromisoformat(start.replace('Z', '+00:00')),
                    end=datetime.fromisoformat(end.replace('Z', '+00:00'))
                ))

            print(f"   [Google API] ✅ พบ {len(result)} events")
            return result

        except Exception as e:
            print(f"   [Google API] ❌ เกิดข้อผิดพลาด: {e}")
            return []

    def add_event(self, event: Event) -> bool:
        """เพิ่ม event เข้า Google Calendar"""
        self._initialize()

        print(f"   [Google API] 💾 กำลังบันทึก: {event.summary} ({event.start.strftime('%Y-%m-%d %H:%M')})")

        try:
            event_body = {
                'summary': event.summary,
                'start': {
                    'dateTime': event.start.isoformat(),
                    'timeZone': 'Asia/Bangkok',  # ปรับตาม timezone ของคุณ
                },
                'end': {
                    'dateTime': event.end.isoformat(),
                    'timeZone': 'Asia/Bangkok',
                },
            }

            reminder_minutes = getattr(event, 'reminders_minutes_before', None)
            if isinstance(reminder_minutes, int) and reminder_minutes >= 0:
                event_body['reminders'] = {
                    'useDefault': False,
                    'overrides': [
                        {
                            'method': 'popup',
                            'minutes': reminder_minutes,
                        }
                    ],
                }

            created_event = self.service.events().insert(
                calendarId=self.calendar_id,
                body=event_body
            ).execute()

            print(f"   [Google API] ✅ บันทึกสำเร็จ (ID: {created_event['id']})")
            return True

        except Exception as e:
            print(f"   [Google API] ❌ บันทึกไม่สำเร็จ: {e}")
            return False

# ==========================================
# 3. MCP Server Implementation
# ==========================================
class GoogleCalendarMCP(CalendarToolInterface):
    """
    ต่อ Google Calendar ผ่าน MCP Server

    Requirements:
        - Node.js MCP Server running (server.js in mcp-server/)
        - MCP Client (mcp_client.py)

    Setup:
        1. ติดตั้ง MCP server dependencies:
           cd mcp-server && npm install

        2. เริ่ม MCP server:
           node mcp-server/server.js

        3. ตั้งค่า environment variables (optional):
           export CREDENTIALS_PATH="./credentials.json"
           export TOKEN_PATH="./token.json"

    Usage:
        calendar = GoogleCalendarMCP(
            server_command=['node', 'mcp-server/server.js'],
            credentials_path='credentials.json'
        )
    """

    def __init__(
        self,
        server_command: Optional[List[str]] = None,
        credentials_path: Optional[str] = None,
        token_path: str = "token.json",
        auto_start: bool = True
    ):
        self.server_command = server_command or [
            'node',
            os.path.join(os.path.dirname(__file__), 'mcp-server', 'server.js')
        ]
        self.credentials_path = credentials_path or os.getenv("CREDENTIALS_PATH", "credentials.json")
        self.token_path = token_path
        self.auto_start = auto_start
        self.client = None
        self._initialized = False

    def _initialize(self):
        """Initialize MCP connection"""
        if self._initialized:
            return

        try:
            # Import MCP client
            from mcp_client import MCPClient

            print(f"   [MCP] 🚀 Starting MCP Server: {' '.join(self.server_command)}")

            # Start MCP client (which starts the server)
            self.client = MCPClient(self.server_command)

            # List available tools
            tools = self.client.list_tools()
            print(f"   [MCP] ✅ เชื่อมต่อ MCP Server สำเร็จ")
            print(f"   [MCP] 📚 Available tools: {len(tools)}")

            self._initialized = True

        except ImportError as e:
            print(f"   [MCP] ❌ Cannot import MCPClient: {e}")
            print(f"   [MCP] Make sure mcp_client.py is available")
            raise

        except Exception as e:
            print(f"   [MCP] ❌ Failed to initialize MCP: {e}")
            raise

    def get_events(self, start_date: datetime, end_date: datetime) -> List[Event]:
        """ดึง events ผ่าน MCP"""
        self._initialize()

        if not self.client:
            return []

        print(f"   [MCP] 🔍 กำลังค้นหา Event ผ่าน MCP Server...")

        try:
            # Call MCP tool
            mcp_events = self.client.list_events(
                start_date.isoformat(),
                end_date.isoformat()
            )

            # Convert to Event objects
            events = []
            for evt in mcp_events:
                events.append(Event(
                    summary=evt.summary,
                    start=datetime.fromisoformat(evt.start.replace('Z', '+00:00')),
                    end=datetime.fromisoformat(evt.end.replace('Z', '+00:00'))
                ))

            print(f"   [MCP] ✅ พบ {len(events)} events")
            return events

        except Exception as e:
            print(f"   [MCP] ❌ Error fetching events: {e}")
            return []

    def add_event(self, event: Event) -> bool:
        """เพิ่ม event ผ่าน MCP"""
        self._initialize()

        if not self.client:
            return False

        print(f"   [MCP] 💾 กำลังบันทึก: {event.summary}")

        try:
            # Call MCP tool
            event_id = self.client.create_event(
                summary=event.summary,
                start=event.start.isoformat(),
                end=event.end.isoformat(),
            )

            print(f"   [MCP] ✅ บันทึกสำเร็จ (ID: {event_id})")
            return True

        except Exception as e:
            print(f"   [MCP] ❌ Error creating event: {e}")
            return False

    def close(self):
        """Close MCP client connection"""
        if self.client:
            try:
                self.client.close()
                print("   [MCP] ✅ Closed MCP connection")
            except:
                pass

# ==========================================
# Factory Function
# ==========================================
def get_calendar_tool(
    mode: str = None,
    **kwargs
) -> CalendarToolInterface:
    """
    Factory function สำหรับสร้าง calendar tool

    Args:
        mode: "mock", "api", หรือ "mcp" (default: อ่านจาก CALENDAR_MODE env var)
        **kwargs: parameters สำหรับแต่ละ implementation

    Returns:
        CalendarToolInterface instance

    Examples:
        # Auto-detect from environment
        calendar = get_calendar_tool()

        # Mock (สำหรับ testing)
        calendar = get_calendar_tool("mock")

        # Google Calendar API
        calendar = get_calendar_tool(
            "api",
            credentials_path="credentials.json"
        )

        # MCP Server
        calendar = get_calendar_tool(
            "mcp",
            server_url="http://localhost:3000"
        )
    """

    # Auto-detect mode from environment if not specified
    if mode is None:
        import os
        mode = os.getenv("CALENDAR_MODE", "mock").lower().strip()
        print(f"[Calendar] 🔍 Auto-detected mode: {mode}")

    if mode == "mock":
        return MockGoogleCalendarMCP()

    elif mode == "api":
        return GoogleCalendarAPI(**kwargs)

    elif mode == "mcp":
        return GoogleCalendarMCP(**kwargs)

    else:
        raise ValueError(f"❌ ไม่รู้จัก mode: {mode}. ใช้ 'mock', 'api', หรือ 'mcp'")

# ==========================================
# Configuration Helper
# ==========================================
def print_setup_guide(mode: str):
    """แสดงคู่มือการติดตั้งสำหรับแต่ละ mode"""

    guides = {
        "api": """
╔════════════════════════════════════════════════════════════════╗
║          Google Calendar API Setup Guide                       ║
╚════════════════════════════════════════════════════════════════╝

1. สร้าง Project ใน Google Cloud Console
   https://console.cloud.google.com/

2. Enable Google Calendar API
   Navigation Menu > APIs & Services > Library
   ค้นหา "Google Calendar API" และกด Enable

3. สร้าง OAuth 2.0 Credentials
   APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
   Application type: Desktop app

4. ดาวน์โหลด credentials.json
   กดปุ่ม Download JSON ข้างๆ OAuth client ที่สร้าง

5. วาง credentials.json ใน project folder

6. ติดตั้ง dependencies:
   pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

7. ตั้งค่า environment variable (optional):
   export GOOGLE_CALENDAR_CREDENTIALS_PATH="/path/to/credentials.json"

8. รันโปรแกรม - browser จะเปิดขึ้นให้ authorize
        """,

        "mcp": """
╔════════════════════════════════════════════════════════════════╗
║          MCP Server Setup Guide                                ║
╚════════════════════════════════════════════════════════════════╝

1. ติดตั้ง MCP Server (ตัวอย่าง - Google Calendar MCP)
   npm install -g @modelcontextprotocol/server-google-calendar

2. สร้าง config file (mcp-config.json):
   {
     "google_calendar": {
       "credentials_path": "/path/to/credentials.json",
       "port": 3000
     }
   }

3. เริ่ม MCP Server:
   mcp-server start --config mcp-config.json

4. ตั้งค่า environment variables:
   export MCP_SERVER_URL="http://localhost:3000"
   export MCP_API_KEY="your-api-key"  # ถ้ามี

5. ติดตั้ง MCP Client library (ถ้าจำเป็น):
   pip install mcp-client

6. รันโปรแกรม
        """
    }

    if mode in guides:
        print(guides[mode])
    else:
        print(f"❌ ไม่มีคู่มือสำหรับ mode: {mode}")

# ==========================================
# Testing / Demo
# ==========================================
if __name__ == "__main__":
    print("\n🔧 Calendar Integration Module - Configuration Test\n")

    # Test 1: Mock (ควรใช้งานได้เสมอ)
    print("1️⃣  Testing Mock Implementation...")
    try:
        mock = get_calendar_tool("mock")
        events = mock.get_events(datetime(2026, 6, 1), datetime(2026, 6, 30))
        print(f"✅ Mock: พบ {len(events)} events\n")
    except Exception as e:
        print(f"❌ Mock failed: {e}\n")

    # Test 2: Google Calendar API
    print("2️⃣  Testing Google Calendar API...")
    try:
        api = get_calendar_tool("api", credentials_path="credentials.json")
        print("✅ Google API: initialized (not tested - requires credentials)\n")
    except Exception as e:
        print(f"⚠️  Google API: {e}\n")
        print("💡 วิธีติดตั้ง:")
        print_setup_guide("api")

    # Test 3: MCP Server
    print("3️⃣  Testing MCP Server...")
    try:
        mcp = get_calendar_tool("mcp")
        print("✅ MCP: initialized (implementation incomplete)\n")
    except Exception as e:
        print(f"⚠️  MCP: {e}\n")

    print("\n" + "="*60)
    print("ใช้ get_calendar_tool(mode) เพื่อสร้าง calendar instance:")
    print("  - mode='mock'  → Mock calendar (testing)")
    print("  - mode='api'   → Google Calendar API (OAuth2)")
    print("  - mode='mcp'   → MCP Server (ยังไม่เสร็จ)")
    print("="*60)
