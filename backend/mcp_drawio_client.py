"""
Multi-Model MCP Client with Draw.io Support
============================================
รองรับ: Claude, OpenAI (GPT), Google Gemini, Grok, DeepSeek, Qwen, Typhoon
Draw.io: สร้าง .drawio XML file บน local filesystem

ติดตั้ง:
    pip install anthropic openai google-generativeai mcp httpx

รัน:
    python mcp_drawio_client.py
"""

import asyncio
import json
import os
import subprocess
from pathlib import Path
from typing import Any

# ==============================
# 1. MCP CLIENT (เชื่อมต่อ MCP Server)
# ==============================

class MCPClient:
    """
    เชื่อมต่อกับ MCP Server ผ่าน stdio (subprocess)
    รองรับ Draw.io MCP และ MCP server อื่นๆ
    """
    def __init__(self, server_command: list[str], server_name: str = "mcp-server"):
        self.server_command = server_command
        self.server_name = server_name
        self.process = None
        self.request_id = 0

    async def start(self):
        """เปิด MCP server subprocess"""
        self.process = await asyncio.create_subprocess_exec(
            *self.server_command,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        # Initialize handshake
        await self._send_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "custom-client", "version": "1.0.0"}
        })
        await self._send_notification("notifications/initialized", {})
        print(f"✅ Connected to MCP server: {self.server_name}")

    async def _send_request(self, method: str, params: dict) -> dict:
        self.request_id += 1
        message = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params
        }
        line = json.dumps(message) + "\n"
        self.process.stdin.write(line.encode())
        await self.process.stdin.drain()
        response_line = await self.process.stdout.readline()
        return json.loads(response_line.decode().strip())

    async def _send_notification(self, method: str, params: dict):
        message = {"jsonrpc": "2.0", "method": method, "params": params}
        line = json.dumps(message) + "\n"
        self.process.stdin.write(line.encode())
        await self.process.stdin.drain()

    async def list_tools(self) -> list[dict]:
        """ดู tools ที่ MCP server มี"""
        response = await self._send_request("tools/list", {})
        return response.get("result", {}).get("tools", [])

    async def call_tool(self, tool_name: str, arguments: dict) -> Any:
        """เรียก tool บน MCP server"""
        response = await self._send_request("tools/call", {
            "name": tool_name,
            "arguments": arguments
        })
        result = response.get("result", {})
        content = result.get("content", [])
        if content and isinstance(content, list):
            return content[0].get("text", str(result))
        return str(result)

    async def stop(self):
        if self.process:
            self.process.stdin.close()
            await self.process.wait()


# ==============================
# 2. DRAW.IO HANDLER
# (สร้าง .drawio XML โดยตรง)
# ==============================

class DrawIOHandler:
    """
    สร้างและบันทึก Draw.io diagrams
    - ถ้ามี MCP server → ใช้ MCPClient
    - ถ้าไม่มี → สร้าง XML โดยตรง (fallback)
    
    ไฟล์จะถูกบันทึกเป็น .drawio ใน output_dir
    """
    def __init__(self, output_dir: str = "./diagrams", mcp_client: MCPClient = None):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.mcp_client = mcp_client

    def save_diagram(self, xml_content: str, filename: str = "diagram.drawio") -> str:
        """บันทึก .drawio file และคืน path"""
        filepath = self.output_dir / filename
        # ถ้า content ยังไม่มี XML wrapper ให้ห่อให้
        if not xml_content.strip().startswith("<mxfile"):
            xml_content = f"""<mxfile host="custom-client">
  <diagram name="Diagram">
    <mxGraphModel>
      <root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        {xml_content}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>"""
        filepath.write_text(xml_content, encoding="utf-8")
        print(f"📁 Saved diagram: {filepath.absolute()}")
        return str(filepath.absolute())

    def open_in_browser(self, filepath: str):
        """เปิด diagram ใน draw.io desktop หรือ browser"""
        import webbrowser
        # ถ้าติดตั้ง draw.io desktop app
        drawio_app = "/Applications/draw.io.app"  # macOS
        if Path(drawio_app).exists():
            subprocess.Popen(["open", "-a", "draw.io", filepath])
        else:
            # เปิดใน browser ผ่าน drawio.com
            webbrowser.open(f"https://app.diagrams.net/#{filepath}")

    @staticmethod
    def generate_flowchart_xml(steps: list[str]) -> str:
        """สร้าง flowchart XML อย่างง่าย"""
        cells = []
        y = 40
        prev_id = None
        for i, step in enumerate(steps):
            cell_id = str(i + 10)
            shape = "rounded=1" if i == 0 or i == len(steps)-1 else "rhombus" if "?" in step else ""
            cells.append(
                f'<mxCell id="{cell_id}" value="{step}" style="rounded=1;whiteSpace=wrap;" '
                f'vertex="1" parent="1"><mxGeometry x="160" y="{y}" width="160" height="40" as="geometry"/></mxCell>'
            )
            if prev_id:
                edge_id = str(100 + i)
                cells.append(
                    f'<mxCell id="{edge_id}" edge="1" source="{prev_id}" target="{cell_id}" parent="1">'
                    f'<mxGeometry relative="1" as="geometry"/></mxCell>'
                )
            prev_id = cell_id
            y += 80
        return "\n".join(cells)


# ==============================
# 3. LLM PROVIDERS (เปลี่ยน model ได้)
# ==============================

class LLMProvider:
    """Base class สำหรับ LLM providers"""
    async def complete(self, messages: list[dict], system: str = "") -> str:
        raise NotImplementedError


class ClaudeProvider(LLMProvider):
    """Anthropic Claude"""
    def __init__(self, api_key: str, model: str = "claude-opus-4-5"):
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    async def complete(self, messages: list[dict], system: str = "") -> str:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=messages
        )
        return response.content[0].text


class OpenAIProvider(LLMProvider):
    """OpenAI GPT / Grok (xAI) / DeepSeek / Qwen (ต้องการ base_url)"""
    def __init__(self, api_key: str, model: str = "gpt-4o", base_url: str = None):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    async def complete(self, messages: list[dict], system: str = "") -> str:
        all_messages = []
        if system:
            all_messages.append({"role": "system", "content": system})
        all_messages.extend(messages)
        response = self.client.chat.completions.create(
            model=self.model,
            messages=all_messages
        )
        return response.choices[0].message.content


class GeminiProvider(LLMProvider):
    """Google Gemini"""
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)

    async def complete(self, messages: list[dict], system: str = "") -> str:
        # แปลง messages format
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})
        chat = self.model.start_chat(history=history)
        response = chat.send_message(messages[-1]["content"])
        return response.text


# ==============================
# 4. PROVIDER FACTORY
# ==============================

PROVIDER_CONFIGS = {
    # ชื่อ: (Provider class, default model, base_url)
    "claude":    (ClaudeProvider,  "claude-opus-4-5",            None),
    "gpt4o":     (OpenAIProvider,  "gpt-4o",                     None),
    "gemini":    (GeminiProvider,  "gemini-1.5-pro",             None),
    "grok":      (OpenAIProvider,  "grok-3",                     "https://api.x.ai/v1"),
    "deepseek":  (OpenAIProvider,  "deepseek-chat",              "https://api.deepseek.com"),
    "qwen":      (OpenAIProvider,  "qwen-plus",                  "https://dashscope.aliyuncs.com/compatible-mode/v1"),
    "typhoon":   (OpenAIProvider,  "typhoon-v2-70b-instruct",    "https://api.opentyphoon.ai/v1"),
}

def create_provider(name: str, api_key: str) -> LLMProvider:
    """Factory: สร้าง LLM provider จากชื่อ"""
    name = name.lower()
    if name not in PROVIDER_CONFIGS:
        raise ValueError(f"Unknown provider: {name}. ใช้ได้: {list(PROVIDER_CONFIGS.keys())}")
    cls, model, base_url = PROVIDER_CONFIGS[name]
    if base_url:
        return cls(api_key=api_key, model=model, base_url=base_url)
    return cls(api_key=api_key, model=model)


# ==============================
# 5. MAIN AGENT
# ==============================

class DiagramAgent:
    """
    Agent ที่รับ prompt → สร้าง diagram → บันทึกเป็น .drawio
    
    Flow:
    1. ส่ง prompt ไปที่ LLM
    2. LLM ตอบกลับมาเป็น Draw.io XML
    3. บันทึกเป็น .drawio file
    4. (optional) เปิดใน draw.io app
    """
    def __init__(self, provider: LLMProvider, drawio_handler: DrawIOHandler):
        self.provider = provider
        self.drawio = drawio_handler
        self.history = []

    SYSTEM_PROMPT = """You are a diagram expert. 
When asked to create a diagram, respond with ONLY valid Draw.io XML (mxCell elements).
Do NOT include markdown code blocks, explanations, or any text outside the XML.
Example format:
<mxCell id="10" value="Start" style="rounded=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="40" width="120" height="40" as="geometry"/>
</mxCell>
"""

    async def create_diagram(self, user_prompt: str, filename: str = None) -> str:
        """รับ prompt → สร้าง diagram → คืน filepath"""
        print(f"\n🤖 Sending prompt to {self.provider.__class__.__name__}...")
        
        self.history.append({"role": "user", "content": user_prompt})
        
        xml_response = await self.provider.complete(
            messages=self.history,
            system=self.SYSTEM_PROMPT
        )
        
        self.history.append({"role": "assistant", "content": xml_response})
        
        # ตั้งชื่อไฟล์
        if not filename:
            word = user_prompt.split()[0][:10].replace(" ", "_")
            filename = f"{word}_diagram.drawio"
        
        # บันทึก diagram
        filepath = self.drawio.save_diagram(xml_response, filename)
        return filepath


# ==============================
# 6. EXAMPLE USAGE
# ==============================

async def main():
    print("=" * 60)
    print("  Multi-Model Draw.io Diagram Generator")
    print("=" * 60)

    # --- เลือก Provider ---
    # เปลี่ยน provider_name เป็น: claude, gpt4o, gemini, grok, deepseek, qwen, typhoon
    provider_name = "claude"
    api_key = os.environ.get("ANTHROPIC_API_KEY", "your-api-key-here")
    
    # สร้าง provider
    provider = create_provider(provider_name, api_key)
    print(f"✅ Using provider: {provider_name}")

    # --- Draw.io Handler ---
    drawio = DrawIOHandler(output_dir="./diagrams")
    
    # --- Agent ---
    agent = DiagramAgent(provider=provider, drawio_handler=drawio)

    # --- ตัวอย่าง prompts ---
    examples = [
        ("Create a flowchart showing user login process with steps: "
         "Enter credentials, Validate, Check 2FA, Grant access", "login_flow.drawio"),
        
        ("Create a system architecture diagram showing: "
         "Client -> API Gateway -> Microservices -> Database", "architecture.drawio"),
    ]

    for prompt, filename in examples[:1]:  # รัน example แรก
        print(f"\n📝 Prompt: {prompt[:60]}...")
        filepath = await agent.create_diagram(prompt, filename)
        print(f"✨ Diagram saved: {filepath}")
        print("   → เปิดด้วย draw.io app หรือ https://app.diagrams.net")

    # --- MCP Server Integration (ถ้ามี draw.io MCP) ---
    print("\n" + "="*60)
    print("  MCP Server Integration Example")
    print("="*60)
    
    # ตัวอย่าง: เชื่อมต่อกับ draw.io MCP server
    # mcp = MCPClient(
    #     server_command=["npx", "-y", "@modelcontextprotocol/server-drawio"],
    #     server_name="drawio-mcp"
    # )
    # await mcp.start()
    # tools = await mcp.list_tools()
    # print(f"Available MCP tools: {[t['name'] for t in tools]}")
    # result = await mcp.call_tool("create_diagram", {"content": xml_content})
    # await mcp.stop()
    
    print("\n📌 เพื่อใช้ Draw.io MCP server:")
    print("   1. ติดตั้ง: npm install -g @modelcontextprotocol/server-drawio")
    print("   2. Uncomment โค้ด MCPClient ด้านบน")
    print("   3. หรือเพิ่มใน claude_desktop_config.json:")
    print("""   {
     "mcpServers": {
       "drawio": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-drawio"]
       }
     }
   }""")

    print("\n" + "="*60)
    print("  Provider ที่รองรับทั้งหมด:")
    for name, (_, model, url) in PROVIDER_CONFIGS.items():
        endpoint = url or "official API"
        print(f"  • {name:<12} model={model:<35} endpoint={endpoint}")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
