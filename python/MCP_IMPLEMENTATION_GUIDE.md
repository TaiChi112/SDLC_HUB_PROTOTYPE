# 🚀 MCP Server Implementation Guide

## 📖 ภาพรวม

**Model Context Protocol (MCP)** เป็น protocol มาตรฐานที่ช่วยให้ AI models เชื่อมต่อกับ external tools และ data sources ได้อย่างปลอดภัยและมีโครงสร้าง

ไฟล์นี้อธิบายวิธีตั้งค่า MCP Server สำหรับ Google Calendar และเชื่อมต่อกับ Calendar Agent

---

## 🎯 เป้าหมาย

1. ✅ Setup MCP Server สำหรับ Google Calendar
2. ✅ Implement MCP Client ใน Python
3. ✅ ทดสอบ end-to-end communication
4. ✅ Integration กับ Calendar Agent

---

## 🛠️ ขั้นตอนการติดตั้ง

### Phase 1: ติดตั้ง MCP Server

#### Option A: ใช้ Official Google Calendar MCP Server

```bash
# ติดตั้ง Node.js (ถ้ายังไม่มี)
# ดาวน์โหลดจาก https://nodejs.org/

# ติดตั้ง MCP Google Calendar Server
npm install -g @modelcontextprotocol/server-google-calendar

# หรือใช้ npx (ไม่ต้องติดตั้ง global)
npx @modelcontextprotocol/server-google-calendar
```

#### Option B: สร้าง Custom MCP Server

สร้างไฟล์ `mcp-server/package.json`:

```json
{
  "name": "calendar-agent-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "googleapis": "^130.0.0"
  }
}
```

สร้างไฟล์ `mcp-server/server.js`:

```javascript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { google } from 'googleapis';
import fs from 'fs';

// Initialize MCP Server
const server = new Server({
  name: 'calendar-agent-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Load Google Calendar credentials
const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// Define tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'list_events',
        description: 'List calendar events in a date range',
        inputSchema: {
          type: 'object',
          properties: {
            timeMin: { type: 'string', description: 'ISO 8601 start date' },
            timeMax: { type: 'string', description: 'ISO 8601 end date' },
          },
          required: ['timeMin', 'timeMax'],
        },
      },
      {
        name: 'create_event',
        description: 'Create a new calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Event title' },
            start: { type: 'string', description: 'ISO 8601 start datetime' },
            end: { type: 'string', description: 'ISO 8601 end datetime' },
          },
          required: ['summary', 'start', 'end'],
        },
      },
    ],
  };
});

// Implement tool handlers
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'list_events') {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: args.timeMin,
      timeMax: args.timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data.items || []),
        },
      ],
    };
  }

  if (name === 'create_event') {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: args.summary,
        start: { dateTime: args.start, timeZone: 'Asia/Bangkok' },
        end: { dateTime: args.end, timeZone: 'Asia/Bangkok' },
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Calendar Server running on stdio');
}

main().catch(console.error);
```

ติดตั้ง dependencies:

```bash
cd mcp-server
npm install
```

---

### Phase 2: Implement Python MCP Client

สร้างไฟล์ `mcp_client.py`:

```python
#!/usr/bin/env python3
"""
Python MCP Client สำหรับเชื่อมต่อ MCP Server
"""

import json
import subprocess
from typing import List, Dict, Any, Optional
from datetime import datetime

class MCPClient:
    """Simple MCP Client using stdio transport"""
    
    def __init__(self, server_command: List[str]):
        """
        Args:
            server_command: คำสั่งรัน MCP server (เช่น ['node', 'server.js'])
        """
        self.process = subprocess.Popen(
            server_command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self.request_id = 0
    
    def _send_request(self, method: str, params: Dict[str, Any]) -> Dict:
        """ส่ง JSON-RPC request ไปยัง server"""
        self.request_id += 1
        
        request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params
        }
        
        # ส่ง request
        self.process.stdin.write(json.dumps(request) + "\n")
        self.process.stdin.flush()
        
        # รับ response
        response_line = self.process.stdout.readline()
        if not response_line:
            raise RuntimeError("No response from MCP server")
        
        response = json.loads(response_line)
        
        if "error" in response:
            raise RuntimeError(f"MCP Error: {response['error']}")
        
        return response.get("result", {})
    
    def list_tools(self) -> List[Dict]:
        """ดึงรายการ tools ที่มี"""
        result = self._send_request("tools/list", {})
        return result.get("tools", [])
    
    def call_tool(self, name: str, arguments: Dict) -> Any:
        """เรียกใช้ tool"""
        result = self._send_request("tools/call", {
            "name": name,
            "arguments": arguments
        })
        
        # Parse content
        content = result.get("content", [])
        if content and content[0].get("type") == "text":
            return json.loads(content[0]["text"])
        
        return None
    
    def close(self):
        """ปิด connection"""
        self.process.terminate()
        self.process.wait()

# ตัวอย่างการใช้งาน
if __name__ == "__main__":
    # เชื่อมต่อ MCP Server
    client = MCPClient(["node", "mcp-server/server.js"])
    
    try:
        # 1. ดูรายการ tools
        tools = client.list_tools()
        print("📋 Available tools:")
        for tool in tools:
            print(f"  - {tool['name']}: {tool['description']}")
        
        # 2. ทดสอบ list events
        print("\n📅 Listing events...")
        events = client.call_tool("list_events", {
            "timeMin": datetime.now().isoformat() + "Z",
            "timeMax": datetime(2026, 12, 31).isoformat() + "Z"
        })
        print(f"Found {len(events)} events")
        
        # 3. ทดสอบ create event
        print("\n✨ Creating test event...")
        new_event = client.call_tool("create_event", {
            "summary": "Test Event from MCP",
            "start": datetime(2026, 6, 15, 10, 0).isoformat(),
            "end": datetime(2026, 6, 15, 11, 0).isoformat()
        })
        print(f"✅ Created event: {new_event.get('id')}")
        
    finally:
        client.close()
```

---

### Phase 3: Integration กับ Calendar Agent

แก้ไข `calendar_integrations.py` ใน `GoogleCalendarMCP` class:

```python
class GoogleCalendarMCP(CalendarToolInterface):
    """ต่อ Google Calendar ผ่าน MCP Server"""
    
    def __init__(self, server_command: Optional[List[str]] = None):
        if server_command is None:
            server_command = ["node", "mcp-server/server.js"]
        
        from mcp_client import MCPClient
        self.client = MCPClient(server_command)
        self._initialized = True
        print("   [MCP] ✅ เชื่อมต่อ MCP Server สำเร็จ")
    
    def get_events(self, start_date: datetime, end_date: datetime) -> List[Event]:
        """ดึง events จาก MCP"""
        print(f"   [MCP] 🔍 กำลังค้นหา Event...")
        
        try:
            events_data = self.client.call_tool("list_events", {
                "timeMin": start_date.isoformat() + "Z",
                "timeMax": end_date.isoformat() + "Z"
            })
            
            result = []
            for event_data in events_data:
                start = event_data['start'].get('dateTime', event_data['start'].get('date'))
                end = event_data['end'].get('dateTime', event_data['end'].get('date'))
                
                result.append(Event(
                    summary=event_data.get('summary', '(No title)'),
                    start=datetime.fromisoformat(start.replace('Z', '+00:00')),
                    end=datetime.fromisoformat(end.replace('Z', '+00:00'))
                ))
            
            print(f"   [MCP] ✅ พบ {len(result)} events")
            return result
            
        except Exception as e:
            print(f"   [MCP] ❌ เกิดข้อผิดพลาด: {e}")
            return []
    
    def add_event(self, event: Event) -> bool:
        """เพิ่ม event ผ่าน MCP"""
        print(f"   [MCP] 💾 กำลังบันทึก: {event.summary}")
        
        try:
            result = self.client.call_tool("create_event", {
                "summary": event.summary,
                "start": event.start.isoformat(),
                "end": event.end.isoformat()
            })
            
            print(f"   [MCP] ✅ บันทึกสำเร็จ (ID: {result.get('id')})")
            return True
            
        except Exception as e:
            print(f"   [MCP] ❌ บันทึกไม่สำเร็จ: {e}")
            return False
    
    def __del__(self):
        """ปิด connection เมื่อ object ถูก destroy"""
        if hasattr(self, 'client'):
            self.client.close()
```

---

### Phase 4: Configuration File

สร้างไฟล์ `mcp_config.json`:

```json
{
  "mcpServers": {
    "calendar": {
      "command": "node",
      "args": ["mcp-server/server.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "credentials.json"
      }
    }
  }
}
```

---

## 🧪 การทดสอบ

### 1. ทดสอบ MCP Server แยก

```bash
# รัน server
node mcp-server/server.js

# ใน terminal อื่น ส่ง JSON-RPC request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node mcp-server/server.js
```

### 2. ทดสอบ Python Client

```bash
python mcp_client.py
```

### 3. ทดสอบกับ Agent

```bash
python example_usage.py --mode mcp --interactive
```

---

## 📊 Architecture Diagram

```
┌─────────────────┐
│   User Input    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Calendar Agent  │
│   (main.py)     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ MCP Client      │
│ (mcp_client.py) │
└────────┬────────┘
         │ JSON-RPC
         │ (stdio)
         v
┌─────────────────┐
│  MCP Server     │
│  (server.js)    │
└────────┬────────┘
         │ REST API
         v
┌─────────────────┐
│ Google Calendar │
│      API        │
└─────────────────┘
```

---

## 🐛 Troubleshooting

### Server ไม่ทำงาน

```bash
# ตรวจสอบ Node.js version (>= 18)
node --version

# ตรวจสอบ dependencies
cd mcp-server && npm list

# ดู stderr
node server.js 2> error.log
```

### Client ไม่เชื่อมต่อ

```bash
# ทดสอบ subprocess
python -c "import subprocess; p=subprocess.Popen(['node', '--version'], stdout=subprocess.PIPE); print(p.communicate())"

# ตรวจสอบ PATH
which node
```

### JSON-RPC Errors

- ตรวจสอบ request format ตาม [JSON-RPC 2.0 spec](https://www.jsonrpc.org/specification)
- ใช้ `jq` เพื่อ pretty-print: `echo '...' | jq`

---

## 📚 ทรัพยากรเพิ่มเติม

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP SDK (JavaScript)](https://github.com/modelcontextprotocol/sdk-js)
- [MCP SDK (Python)](https://github.com/modelcontextprotocol/sdk-python)
- [Google Calendar API](https://developers.google.com/calendar/api)

---

## ✅ Checklist

- [ ] ติดตั้ง Node.js >= 18
- [ ] สร้าง MCP Server (`server.js`)
- [ ] ติดตั้ง MCP SDK (`npm install`)
- [ ] สร้าง Python Client (`mcp_client.py`)
- [ ] Integration ใน `calendar_integrations.py`
- [ ] ทดสอบ tools/list
- [ ] ทดสอบ list_events
- [ ] ทดสอบ create_event
- [ ] ทดสอบกับ Calendar Agent

---

**เมื่อเสร็จสิ้น คุณจะสามารถใช้งาน:**

```bash
python example_usage.py --mode mcp --interactive
```

🎉 สำเร็จ! MCP Server พร้อมใช้งาน
