#!/usr/bin/env python3
"""
ทดสอบการเชื่อมต่อ Google Calendar API
รันสคริปต์นี้เพื่อยืนยันว่า credentials.json ถูกต้องและสามารถเข้าถึงปฏิทินได้
"""

from datetime import datetime, timedelta
from calendar_integrations import get_calendar_tool

def test_google_calendar_connection():
    """ทดสอบการเชื่อมต่อพื้นฐาน"""
    print("🔧 ทดสอบการเชื่อมต่อ Google Calendar API")
    print("=" * 60)

    try:
        # สร้าง Google Calendar API instance
        print("\n1️⃣  กำลังสร้าง connection...")
        calendar = get_calendar_tool("api", credentials_path="credentials.json")

        # ทดสอบดึงข้อมูล events
        print("2️⃣  ทดสอบดึงข้อมูล events...")
        today = datetime.now()
        week_later = today + timedelta(days=30)

        events = calendar.get_events(today, week_later)

        print(f"\n✅ เชื่อมต่อสำเร็จ!")
        print(f"📅 พบ {len(events)} events ใน 30 วันข้างหน้า")

        if events:
            print("\n📋 รายการ Events:")
            for i, event in enumerate(events[:5], 1):  # แสดงแค่ 5 รายการแรก
                print(f"  {i}. {event.summary}")
                print(f"     {event.start.strftime('%Y-%m-%d %H:%M')} - {event.end.strftime('%H:%M')}")

            if len(events) > 5:
                print(f"  ... และอีก {len(events) - 5} events")
        else:
            print("\n📭 ไม่มี events ในช่วงเวลานี้")

        # ทดสอบสร้าง event (แบบ dry-run)
        print("\n3️⃣  ทดสอบสร้าง event...")
        from main import Event

        test_event = Event(
            summary="🧪 Test Event from Calendar Agent",
            start=datetime.now() + timedelta(days=7),
            end=datetime.now() + timedelta(days=7, hours=1)
        )

        # ถามผู้ใช้ก่อนสร้าง event จริง
        response = input("\n❓ ต้องการทดสอบสร้าง event จริงไหม? (y/N): ")

        if response.lower() == 'y':
            success = calendar.add_event(test_event)
            if success:
                print("✅ สร้าง test event สำเร็จ! (ลองเช็คในปฏิทินของคุณ)")
            else:
                print("❌ สร้าง event ไม่สำเร็จ")
        else:
            print("⏭️  ข้ามการสร้าง event")

        print("\n" + "=" * 60)
        print("🎉 การทดสอบเสร็จสมบูรณ์!")
        print("\n💡 ตอนนี้คุณสามารถใช้งาน Agent กับ Google Calendar จริงได้แล้ว:")
        print("   python example_usage.py --mode api")

        return True

    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\n💡 แนะนำ:")
        print("   1. ตรวจสอบว่ามีไฟล์ credentials.json ใน folder นี้")
        print("   2. ดาวน์โหลดจาก Google Cloud Console")
        print("   3. อ่านวิธีติดตั้งใน README.md")
        return False

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print(f"\n💡 Error type: {type(e).__name__}")
        print("\n🔍 Troubleshooting:")
        print("   1. ตรวจสอบว่า Enable Google Calendar API แล้ว")
        print("   2. ตรวจสอบ OAuth Consent Screen")
        print("   3. ลองลบ token.json แล้วรันใหม่")
        print("   4. อ่าน setup guide: python example_usage.py --mode api --setup-guide")
        return False

if __name__ == "__main__":
    test_google_calendar_connection()
