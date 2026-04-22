from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta, time
from typing import List, Dict, Optional, Tuple

# ==========================================
# 1. Data Models (โครงสร้างข้อมูล)
# ==========================================
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
# 2. Interfaces (หลัก Dependency Inversion)
# ==========================================
class CalendarToolInterface(ABC):
    @abstractmethod
    def get_events(self, start_date: datetime, end_date: datetime) -> List[Event]:
        pass

    @abstractmethod
    def add_event(self, event: Event) -> bool:
        pass

# ==========================================
# 3. Mock Implementation (จำลอง Google Calendar MCP)
# ==========================================
class MockGoogleCalendarMCP(CalendarToolInterface):
    def __init__(self):
        # จำลองว่าในปฏิทินมีนัดอยู่แล้ว 1 นัด (นัดทำฟันวันจันทร์ที่ 2 ของเทอม)
        self.db: List[Event] = [
            Event(
                summary="🦷 นัดทำฟันคลินิกหน้ามอ",
                start=datetime(2026, 6, 8, 10, 0),  # สัปดาห์ที่ 2
                end=datetime(2026, 6, 8, 11, 0)
            )
        ]

    def get_events(self, start_date: datetime, end_date: datetime) -> List[Event]:
        print(f"   [MCP Tool] 🔍 กำลังค้นหา Event ตั้งแต่ {start_date.strftime('%Y-%m-%d')} ถึง {end_date.strftime('%Y-%m-%d')}...")
        return self.db

    def add_event(self, event: Event) -> bool:
        print(f"   [MCP Tool] ✅ บันทึกลงปฏิทินสำเร็จ: {event.summary} ({event.start.strftime('%Y-%m-%d %H:%M')})")
        self.db.append(event)
        return True

# ==========================================
# 4. The Agent Logic (สมองของ AI)
# ==========================================
class CalendarAgent:
    def __init__(self, calendar_tool: CalendarToolInterface):
        # รับเครื่องมือเข้ามาใช้งาน (Inject Dependency)
        self.calendar = calendar_tool

    def expand_recurring_events(self, base_event: Dict) -> List[Event]:
        """ฟังก์ชันขยายตารางเรียน 1 เทอมให้เป็น Event รายสัปดาห์"""
        events = []
        current_date = base_event['start']
        weeks = base_event['duration_weeks']

        for i in range(weeks):
            start_time = current_date + timedelta(weeks=i)
            # สมมติให้เรียน 3 ชั่วโมงตามตัวอย่าง
            end_time = start_time + timedelta(hours=3)

            events.append(Event(
                summary=f"{base_event['summary']} (W{i+1})",
                start=start_time,
                end=end_time
            ))
        return events

    def check_conflict(self, new_event: Event, existing_events: List[Event]) -> List[Event]:
        """ตรวจสอบความขัดแย้งของเวลา: S1 < E2 และ E1 > S2"""
        conflicts = []
        for exist in existing_events:
            if new_event.start < exist.end and new_event.end > exist.start:
                conflicts.append(exist)
        return conflicts

    def find_available_slots(self, target_event: Event, existing_events: List[Event],
                            search_range_hours: int = 8) -> List[Dict]:
        """
        หาช่วงเวลาที่ว่างในวันเดียวกัน

        Args:
            target_event: Event ที่ต้องการหาเวลาใหม่
            existing_events: Event ที่มีอยู่แล้วทั้งหมด
            search_range_hours: ช่วงเวลาค้นหา (ชั่วโมง) จากเวลาเริ่มต้น

        Returns:
            List ของช่วงเวลาว่าง [{"start": datetime, "end": datetime}]
        """
        duration = target_event.end - target_event.start
        target_date = target_event.start.date()

        # กำหนดช่วงเวลาทำงาน (8:00 - 20:00)
        work_start = datetime.combine(target_date, datetime.min.time().replace(hour=8, minute=0))
        work_end = datetime.combine(target_date, datetime.min.time().replace(hour=20, minute=0))

        # กรอง events ที่อยู่ในวันเดียวกัน
        same_day_events = [
            e for e in existing_events
            if e.start.date() == target_date
        ]

        # เรียงตามเวลาเริ่ม
        same_day_events.sort(key=lambda x: x.start)

        # หาช่วงว่าง
        available_slots = []
        current_time = work_start

        for event in same_day_events:
            # ถ้ามีช่องว่างก่อน event นี้
            if current_time + duration <= event.start:
                available_slots.append({
                    "start": current_time,
                    "end": current_time + duration
                })

            # เลื่อนเวลาไปหลัง event ที่มีอยู่
            if event.end > current_time:
                current_time = event.end

        # ตรวจสอบช่องว่างหลัง event สุดท้าย
        if current_time + duration <= work_end:
            available_slots.append({
                "start": current_time,
                "end": current_time + duration
            })

        return available_slots[:3]  # แนะนำแค่ 3 ช่องแรก

    def suggest_alternatives(self, conflict_data: List[Dict]) -> Dict[str, List[Dict]]:
        """สร้างคำแนะนำเวลาทางเลือกสำหรับ event ที่ชน"""
        suggestions = {}

        for item in conflict_data:
            target = item['target']
            date_key = target.start.strftime('%Y-%m-%d')

            # ดึง existing events ทั้งหมดในวันนั้น
            all_events_that_day = self.calendar.get_events(
                target.start.replace(hour=0, minute=0),
                target.start.replace(hour=23, minute=59)
            )

            # หาช่วงเวลาว่าง
            available = self.find_available_slots(target, all_events_that_day)

            if available:
                suggestions[date_key] = available

        return suggestions

    def calculate_time_slot_score(self, slot: Dict, preferences: Optional[Dict] = None) -> float:
        """
        คำนวณคะแนนความเหมาะสมของช่วงเวลา

        Args:
            slot: ช่วงเวลา {"start": datetime, "end": datetime}
            preferences: ความชอบของผู้ใช้

        Returns:
            คะแนน 0-100 (สูงกว่า = ดีกว่า)
        """
        if preferences is None:
            preferences = {
                "prefer_morning": True,    # ชอบช่วงเช้า
                "prefer_afternoon": False, # ชอบช่วงบ่าย
                "avoid_lunch": True,       # หลีกเลี่ยงช่วงกลางวัน 11:30-13:00
                "avoid_evening": True,     # หลีกเลี่ยงหลัง 18:00
                "ideal_start": time(9, 0), # เวลาเริ่มที่ชอบ
                "travel_buffer_mins": 30   # เวลาเดินทางที่ต้องการ
            }

        score = 50.0  # คะแนนพื้นฐาน
        start_time = slot['start'].time()

        # 1. คะแนนตามช่วงเวลา
        hour = start_time.hour

        # ช่วงเช้า (8:00-12:00)
        if 8 <= hour < 12:
            if preferences.get('prefer_morning', True):
                score += 20

        # ช่วงบ่าย (13:00-17:00)
        elif 13 <= hour < 17:
            if preferences.get('prefer_afternoon', False):
                score += 15
            else:
                score += 10  # คะแนนปกติ

        # ช่วงกลางวัน (11:30-13:00)
        elif 11.5 <= hour + start_time.minute/60 < 13:
            if preferences.get('avoid_lunch', True):
                score -= 15

        # ช่วงเย็น (17:00-20:00)
        elif 17 <= hour < 20:
            if preferences.get('avoid_evening', True):
                score -= 10

        # 2. คะแนนตามระยะห่างจากเวลาที่ชอบ
        ideal_start = preferences.get('ideal_start', time(9, 0))
        time_diff = abs(
            (start_time.hour * 60 + start_time.minute) -
            (ideal_start.hour * 60 + ideal_start.minute)
        )
        # ยิ่งใกล้เวลาที่ชอบ = คะแนนสูงขึ้น
        score += max(0, 15 - (time_diff / 60) * 5)

        # 3. คะแนนตามช่วงเวลาตอนต้นวัน (fresh mind)
        if hour == 8 or hour == 9:
            score += 10

        # 4. ลดคะแนนถ้านอกช่วงเวลาทำงานปกติ (8:00-18:00)
        if hour < 8 or hour >= 18:
            score -= 20

        return max(0, min(100, score))  # จำกัดคะแนน 0-100

    def rank_suggestions(self, suggestions: Dict[str, List[Dict]],
                        preferences: Optional[Dict] = None) -> Dict[str, List[Tuple[Dict, float]]]:
        """
        จัดอันดับคำแนะนำตาม scoring system

        Returns:
            Dict[date_str, List[(slot, score)]]
        """
        ranked = {}

        for date_str, slots in suggestions.items():
            scored_slots = [
                (slot, self.calculate_time_slot_score(slot, preferences))
                for slot in slots
            ]
            # เรียงตามคะแนนสูงสุด
            scored_slots.sort(key=lambda x: x[1], reverse=True)
            ranked[date_str] = scored_slots

        return ranked

    def apply_suggestion_to_events(self, conflict_data: List[Dict],
                                  suggestions: Dict[str, List[Dict]],
                                  safe_events: List[Event]) -> List[Event]:
        """
        นำเวลาที่แนะนำมาใช้กับ events ที่ชน

        Returns:
            รายการ events ทั้งหมดที่พร้อมบันทึก
        """
        all_events = list(safe_events)  # copy safe events

        for item in conflict_data:
            target = item['target']
            date_key = target.start.strftime('%Y-%m-%d')

            if date_key in suggestions and suggestions[date_key]:
                # ใช้ช่วงแรกที่แนะนำ (คะแนนสูงสุด)
                best_slot = suggestions[date_key][0]

                # สร้าง event ใหม่ด้วยเวลาที่แนะนำ
                new_event = Event(
                    summary=target.summary,
                    start=best_slot['start'],
                    end=best_slot['end']
                )
                all_events.append(new_event)

                print(f"   [Agent] ✏️ เปลี่ยนเวลา '{target.summary}' จาก {target.start.strftime('%H:%M')} เป็น {best_slot['start'].strftime('%H:%M')}")
            else:
                # ถ้าไม่มีคำแนะนำ ข้ามไป
                print(f"   [Agent] ⏭️ ข้าม '{target.summary}' (ไม่มีเวลาว่าง)")

        return all_events

    def handle_user_choice(self, choice: str, conflict_data: List[Dict],
                          safe_events: List[Event], suggestions: Dict[str, List[Dict]]) -> bool:
        """
        จัดการตัวเลือกที่ผู้ใช้เลือก

        Returns:
            True ถ้าบันทึกสำเร็จ, False ถ้ายกเลิก
        """
        choice = choice.strip()

        if choice == "1":
            # ข้ามการลงตารางในสัปดาห์ที่ชน
            print("\n🤖 [Agent] กำลังบันทึกแค่สัปดาห์ที่ไม่ชน...")
            for ev in safe_events:
                self.calendar.add_event(ev)
            print(f"✅ บันทึกเรียบร้อย {len(safe_events)} events (ข้ามสัปดาห์ที่ชน {len(conflict_data)} events)")
            return True

        elif choice == "2":
            # ลงทับ (Overwrite)
            print("\n🤖 [Agent] กำลังบันทึกทับ events เดิม...")
            all_events = list(safe_events)
            for item in conflict_data:
                all_events.append(item['target'])
                print(f"   [Agent] ⚠️ บันทึกทับ '{item['target'].summary}' (จะชนกับ events อื่น)")

            for ev in all_events:
                self.calendar.add_event(ev)
            print(f"✅ บันทึกเรียบร้อย {len(all_events)} events (รวมทับ {len(conflict_data)} events)")
            return True

        elif choice == "3":
            # ใช้เวลาทางเลือกที่แนะนำ
            if not suggestions:
                print("\n❌ ไม่มีเวลาทางเลือก กรุณาเลือกตัวเลือกอื่น")
                return False

            print("\n🤖 [Agent] กำลังใช้เวลาทางเลือก (auto-suggest)...")

            # Rank suggestions ด้วย scoring system
            ranked = self.rank_suggestions(suggestions)

            # แสดงคะแนน
            print("\n📊 [Scoring] คะแนนเวลาที่แนะนำ:")
            for date_str, scored_slots in ranked.items():
                print(f"  📅 {date_str}:")
                for i, (slot, score) in enumerate(scored_slots, 1):
                    print(f"    {i}. {slot['start'].strftime('%H:%M')}-{slot['end'].strftime('%H:%M')} → คะแนน: {score:.1f}/100")

            # ใช้คำแนะนำที่ได้คะแนนสูงสุด
            best_suggestions = {
                date_str: [slot for slot, score in slots]
                for date_str, slots in ranked.items()
            }

            all_events = self.apply_suggestion_to_events(conflict_data, best_suggestions, safe_events)

            for ev in all_events:
                self.calendar.add_event(ev)

            print(f"\n✅ บันทึกเรียบร้อย {len(all_events)} events (ใช้เวลาทางเลือก {len(conflict_data)} events)")
            return True

        elif choice == "4":
            # ยกเลิก
            print("\n🚫 [Agent] ยกเลิกการบันทึก")
            return False

        else:
            print(f"\n❌ ตัวเลือก '{choice}' ไม่ถูกต้อง กรุณาเลือก 1-4")
            return False

    def process_recurring_request(self, intent_data: Dict, interactive: bool = False):
        """Method หลักในการตัดสินใจ (Reasoning Logic)"""
        print("\n🤖 [Agent] ได้รับคำสั่ง: จัดการตารางเรียน 1 เทอม")

        # 1. แตกข้อมูลออกเป็นรายสัปดาห์ (18 สัปดาห์)
        target_events = self.expand_recurring_events(intent_data)
        term_start = target_events[0].start
        term_end = target_events[-1].end

        # 2. ดึงข้อมูลตารางที่มีอยู่แล้วในเทอมนั้นทั้งหมด (ลดการเรียก API บ่อยๆ)
        existing_events = self.calendar.get_events(term_start, term_end)

        # 3. ตรวจสอบ Conflict ทีละสัปดาห์
        all_conflicts = []
        safe_events = []

        for event in target_events:
            conflicts = self.check_conflict(event, existing_events)
            if conflicts:
                all_conflicts.append({
                    "target": event,
                    "conflicts": conflicts
                })
            else:
                safe_events.append(event)

        # 4. ตัดสินใจ (Decision Making)
        if not all_conflicts:
            print("🤖 [Agent] ไม่พบเวลาชน! กำลังบันทึกตารางเรียนทั้งหมด...")
            for ev in safe_events:
                self.calendar.add_event(ev)
            return "\n🎉 เรียบร้อยครับ ลงตารางเรียนให้ครบทั้งเทอมแล้ว!"
        else:
            # สร้างคำแนะนำเวลาทางเลือก
            suggestions = self.suggest_alternatives(all_conflicts)
            msg = self._notify_human(all_conflicts, len(target_events), suggestions)

            # ถ้าเป็น interactive mode ให้รับ input จากผู้ใช้
            if interactive:
                print(msg)
                while True:
                    try:
                        choice = input("\n👉 เลือกตัวเลือก (1-4): ")
                        success = self.handle_user_choice(choice, all_conflicts, safe_events, suggestions)
                        if success or choice == "4":
                            break
                    except KeyboardInterrupt:
                        print("\n\n🚫 [Agent] ยกเลิกโดยผู้ใช้")
                        return "\n❌ การดำเนินการถูกยกเลิก"
                    except Exception as e:
                        print(f"\n❌ Error: {e}")
                        print("กรุณาลองใหม่อีกครั้ง")

                return "\n✨ การดำเนินการเสร็จสมบูรณ์"
            else:
                # Non-interactive mode: แค่ return message
                return msg

    def _notify_human(self, conflict_data: List[Dict], total_weeks: int,
                     suggestions: Optional[Dict[str, List[Dict]]] = None) -> str:
        """แจ้งเตือนผู้ใช้เมื่อพบปัญหา (Human-in-the-loop)"""
        msg = f"\n⚠️ [Agent Alert] ผมตรวจสอบตารางเรียนทั้งหมด {total_weeks} สัปดาห์ พบเวลาชนกันครับ:\n"
        for item in conflict_data:
            target = item['target']
            for c in item['conflicts']:
                msg += f"  - สัปดาห์วันที่ {target.start.strftime('%Y-%m-%d')}: ชนกับ '{c.summary}' ({c.start.strftime('%H:%M')}-{c.end.strftime('%H:%M')})\n"

        # เพิ่มคำแนะนำเวลาทางเลือก
        if suggestions:
            msg += "\n💡 [Auto-Suggest] ผมหาเวลาว่างทางเลือกให้แล้วครับ:\n"
            for date_str, slots in suggestions.items():
                msg += f"\n  📅 วันที่ {date_str}:\n"
                for i, slot in enumerate(slots, 1):
                    start_time = slot['start'].strftime('%H:%M')
                    end_time = slot['end'].strftime('%H:%M')
                    msg += f"    {i}. {start_time} - {end_time}\n"

        msg += "\nคุณต้องการให้ผม:\n1. ข้ามการลงตารางในสัปดาห์ที่ชน\n2. ลงทับไปเลย (Overwrite)\n3. ใช้เวลาทางเลือกที่แนะนำ (Auto-Suggest)\n4. ยกเลิกทั้งหมดเพื่อไปจัดการคิวใหม่"
        return msg

# ==========================================
# 5. Simulation Execution (จำลองการรันโปรแกรม)
# ==========================================
if __name__ == "__main__":
    import sys

    # 1. ตั้งค่าระบบ (Setup)
    # เลือก mode: "mock" (default), "api", หรือ "mcp"
    # สามารถใช้ calendar_integrations.py สำหรับ production

    print("📅 Calendar Agent System")
    print("=" * 50)
    print("ℹ️  ใช้ Mock Calendar (สำหรับ demo)")
    print("    สำหรับ production: ดู calendar_integrations.py")
    print("=" * 50 + "\n")

    mcp_tool = MockGoogleCalendarMCP()
    agent = CalendarAgent(mcp_tool)

    # 2. จำลองข้อมูล Intent ที่สกัดได้จาก LLM (เช่น ผู้ใช้สั่ง: "ลงตาราง CS301 ทุกวันจันทร์ 9:30 1 เทอม (18 สัปดาห์) เริ่ม 1 มิ.ย.")
    user_intent = {
        "summary": "📘 CS301: Data Mining",
        "start": datetime(2026, 6, 1, 9, 30), # เริ่มจันทร์ที่ 1 มิ.ย. 2026
        "duration_weeks": 4 # สมมติแค่ 4 สัปดาห์ก่อนเพื่อให้เห็นผลลัพธ์ง่ายๆ
    }

    # 3. รัน Agent (Interactive mode)
    response = agent.process_recurring_request(user_intent, interactive=True)

    # 4. แสดงผลลัพธ์
    if not isinstance(response, str) or "เสร็จสมบูรณ์" not in response:
        print(response)
