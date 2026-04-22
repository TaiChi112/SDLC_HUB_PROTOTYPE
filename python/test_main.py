import pytest
from datetime import datetime, timedelta
from main import (
    Event,
    CalendarAgent,
    MockGoogleCalendarMCP,
    CalendarToolInterface
)

# ==========================================
# Test Fixtures
# ==========================================
@pytest.fixture
def mock_calendar():
    """สร้าง mock calendar tool สำหรับ testing"""
    return MockGoogleCalendarMCP()

@pytest.fixture
def agent(mock_calendar):
    """สร้าง agent instance พร้อม mock calendar"""
    return CalendarAgent(mock_calendar)

@pytest.fixture
def sample_event():
    """Event ตัวอย่างสำหรับทดสอบ"""
    return Event(
        summary="Test Event",
        start=datetime(2026, 6, 1, 10, 0),
        end=datetime(2026, 6, 1, 11, 0)
    )

# ==========================================
# Test 1: expand_recurring_events()
# ==========================================
class TestExpandRecurringEvents:
    """ทดสอบการขยายตารางที่เกิดซ้ำเป็นรายสัปดาห์"""

    def test_expand_4_weeks(self, agent):
        """ทดสอบขยาย 4 สัปดาห์"""
        base_event = {
            "summary": "CS301: Data Mining",
            "start": datetime(2026, 6, 1, 9, 30),
            "duration_weeks": 4
        }

        events = agent.expand_recurring_events(base_event)

        # ตรวจสอบจำนวน events
        assert len(events) == 4

        # ตรวจสอบชื่อและลำดับสัปดาห์
        assert events[0].summary == "CS301: Data Mining (W1)"
        assert events[1].summary == "CS301: Data Mining (W2)"
        assert events[2].summary == "CS301: Data Mining (W3)"
        assert events[3].summary == "CS301: Data Mining (W4)"

        # ตรวจสอบเวลาเริ่มแต่ละสัปดาห์
        assert events[0].start == datetime(2026, 6, 1, 9, 30)
        assert events[1].start == datetime(2026, 6, 8, 9, 30)  # +7 days
        assert events[2].start == datetime(2026, 6, 15, 9, 30) # +14 days
        assert events[3].start == datetime(2026, 6, 22, 9, 30) # +21 days

        # ตรวจสอบระยะเวลา 3 ชั่วโมง
        for event in events:
            duration = event.end - event.start
            assert duration == timedelta(hours=3)

    def test_expand_18_weeks_full_term(self, agent):
        """ทดสอบขยายเต็มเทอม 18 สัปดาห์"""
        base_event = {
            "summary": "Full Term Course",
            "start": datetime(2026, 6, 1, 13, 0),
            "duration_weeks": 18
        }

        events = agent.expand_recurring_events(base_event)

        assert len(events) == 18
        assert events[0].summary == "Full Term Course (W1)"
        assert events[17].summary == "Full Term Course (W18)"

        # ตรวจสอบว่าสัปดาห์สุดท้ายเพิ่ม 17 สัปดาห์จากวันเริ่ม
        expected_last_date = datetime(2026, 6, 1, 13, 0) + timedelta(weeks=17)
        assert events[17].start == expected_last_date

    def test_expand_single_week(self, agent):
        """ทดสอบกรณีเดียว (1 สัปดาห์)"""
        base_event = {
            "summary": "One Time Event",
            "start": datetime(2026, 6, 10, 14, 0),
            "duration_weeks": 1
        }

        events = agent.expand_recurring_events(base_event)

        assert len(events) == 1
        assert events[0].summary == "One Time Event (W1)"

# ==========================================
# Test 2: check_conflict()
# ==========================================
class TestCheckConflict:
    """ทดสอบการตรวจสอบความขัดแย้งของเวลา"""

    def test_no_conflict(self, agent):
        """ทดสอบกรณีไม่มีความชน"""
        new_event = Event(
            summary="New Event",
            start=datetime(2026, 6, 1, 14, 0),  # 14:00-15:00
            end=datetime(2026, 6, 1, 15, 0)
        )

        existing_events = [
            Event(
                summary="Existing Event",
                start=datetime(2026, 6, 1, 10, 0),  # 10:00-11:00
                end=datetime(2026, 6, 1, 11, 0)
            )
        ]

        conflicts = agent.check_conflict(new_event, existing_events)
        assert len(conflicts) == 0

    def test_exact_overlap(self, agent):
        """ทดสอบเวลาซ้อนทับกันพอดี"""
        new_event = Event(
            summary="New Event",
            start=datetime(2026, 6, 1, 10, 0),
            end=datetime(2026, 6, 1, 11, 0)
        )

        existing_events = [
            Event(
                summary="Existing Event",
                start=datetime(2026, 6, 1, 10, 0),
                end=datetime(2026, 6, 1, 11, 0)
            )
        ]

        conflicts = agent.check_conflict(new_event, existing_events)
        assert len(conflicts) == 1
        assert conflicts[0].summary == "Existing Event"

    def test_partial_overlap_start(self, agent):
        """ทดสอบชนบางส่วน (ต้น Event ใหม่ชน)"""
        new_event = Event(
            summary="New Event",
            start=datetime(2026, 6, 1, 10, 30),  # 10:30-12:00
            end=datetime(2026, 6, 1, 12, 0)
        )

        existing_events = [
            Event(
                summary="Existing Event",
                start=datetime(2026, 6, 1, 10, 0),  # 10:00-11:00
                end=datetime(2026, 6, 1, 11, 0)
            )
        ]

        conflicts = agent.check_conflict(new_event, existing_events)
        assert len(conflicts) == 1

    def test_partial_overlap_end(self, agent):
        """ทดสอบชนบางส่วน (ท้าย Event ใหม่ชน)"""
        new_event = Event(
            summary="New Event",
            start=datetime(2026, 6, 1, 9, 0),   # 9:00-10:30
            end=datetime(2026, 6, 1, 10, 30)
        )

        existing_events = [
            Event(
                summary="Existing Event",
                start=datetime(2026, 6, 1, 10, 0),  # 10:00-11:00
                end=datetime(2026, 6, 1, 11, 0)
            )
        ]

        conflicts = agent.check_conflict(new_event, existing_events)
        assert len(conflicts) == 1

    def test_new_event_contains_existing(self, agent):
        """ทดสอบ Event ใหม่ครอบ Event เดิม"""
        new_event = Event(
            summary="New Event",
            start=datetime(2026, 6, 1, 9, 0),   # 9:00-12:00
            end=datetime(2026, 6, 1, 12, 0)
        )

        existing_events = [
            Event(
                summary="Existing Event",
                start=datetime(2026, 6, 1, 10, 0),  # 10:00-11:00
                end=datetime(2026, 6, 1, 11, 0)
            )
        ]

        conflicts = agent.check_conflict(new_event, existing_events)
        assert len(conflicts) == 1

    def test_multiple_conflicts(self, agent):
        """ทดสอบชนหลาย Event พร้อมกัน"""
        new_event = Event(
            summary="New Event",
            start=datetime(2026, 6, 1, 10, 0),  # 10:00-12:00
            end=datetime(2026, 6, 1, 12, 0)
        )

        existing_events = [
            Event(summary="Event 1",
                  start=datetime(2026, 6, 1, 9, 30),
                  end=datetime(2026, 6, 1, 10, 30)),
            Event(summary="Event 2",
                  start=datetime(2026, 6, 1, 11, 0),
                  end=datetime(2026, 6, 1, 11, 30)),
            Event(summary="Event 3",
                  start=datetime(2026, 6, 1, 14, 0),
                  end=datetime(2026, 6, 1, 15, 0)),  # ไม่ชน
        ]

        conflicts = agent.check_conflict(new_event, existing_events)
        assert len(conflicts) == 2  # ชนแค่ Event 1 และ 2
        assert conflicts[0].summary == "Event 1"
        assert conflicts[1].summary == "Event 2"

    def test_adjacent_events_no_conflict(self, agent):
        """ทดสอบ Event ติดกัน แต่ไม่ชน"""
        new_event = Event(
            summary="New Event",
            start=datetime(2026, 6, 1, 11, 0),  # 11:00-12:00
            end=datetime(2026, 6, 1, 12, 0)
        )

        existing_events = [
            Event(
                summary="Existing Event",
                start=datetime(2026, 6, 1, 10, 0),  # 10:00-11:00
                end=datetime(2026, 6, 1, 11, 0)     # จบพอดี 11:00
            )
        ]

        conflicts = agent.check_conflict(new_event, existing_events)
        assert len(conflicts) == 0  # ไม่ควรชนเพราะจบพอดี

# ==========================================
# Test 3: process_recurring_request()
# ==========================================
class TestProcessRecurringRequest:
    """ทดสอบ method หลักในการตัดสินใจ"""

    def test_no_conflict_all_saved(self, agent, mock_calendar):
        """ทดสอบกรณีไม่มีความชน ควรบันทึกทั้งหมด"""
        # ล้าง DB ให้ว่าง
        mock_calendar.db = []

        user_intent = {
            "summary": "Test Course",
            "start": datetime(2026, 6, 1, 14, 0),  # ช่วงบ่ายไม่ชนนัดทำฟัน
            "duration_weeks": 3
        }

        response = agent.process_recurring_request(user_intent)

        # ควรได้ข้อความสำเร็จ
        assert "เรียบร้อย" in response or "ครบทั้งเทอม" in response

        # ตรวจสอบว่ามี 3 events ใน DB
        assert len(mock_calendar.db) == 3

    def test_with_conflict_returns_warning(self, agent, mock_calendar):
        """ทดสอบกรณีมีความชน ควรได้ warning message"""
        # Reset DB มีแค่นัดทำฟันเดิม
        mock_calendar.db = [
            Event(
                summary="🦷 นัดทำฟันคลินิกหน้ามอ",
                start=datetime(2026, 6, 8, 10, 0),  # สัปดาห์ที่ 2
                end=datetime(2026, 6, 8, 11, 0)
            )
        ]

        user_intent = {
            "summary": "CS301: Data Mining",
            "start": datetime(2026, 6, 1, 9, 30),  # จะชนกับนัดทำฟันใน W2
            "duration_weeks": 4
        }

        response = agent.process_recurring_request(user_intent)

        # ควรได้ warning message
        assert "⚠️" in response or "ชนกัน" in response or "ชน" in response
        assert "2026-06-08" in response  # วันที่ชน
        assert "นัดทำฟัน" in response

    def test_conflict_options_presented(self, agent, mock_calendar):
        """ทดสอบว่า warning มีตัวเลือกให้ user"""
        mock_calendar.db = [
            Event(
                summary="Existing",
                start=datetime(2026, 6, 8, 10, 0),
                end=datetime(2026, 6, 8, 11, 0)
            )
        ]

        user_intent = {
            "summary": "New Course",
            "start": datetime(2026, 6, 1, 9, 30),
            "duration_weeks": 4
        }

        response = agent.process_recurring_request(user_intent)

        # ตรวจสอบว่ามีตัวเลือก 1, 2, 3
        assert "1." in response
        assert "2." in response
        assert "3." in response

# ==========================================
# Test 4: MockGoogleCalendarMCP
# ==========================================
class TestMockGoogleCalendarMCP:
    """ทดสอบ Mock Implementation"""

    def test_initial_state(self):
        """ทดสอบสถานะเริ่มต้น (มีนัดทำฟัน 1 นัด)"""
        mcp = MockGoogleCalendarMCP()
        assert len(mcp.db) == 1
        assert "นัดทำฟัน" in mcp.db[0].summary

    def test_add_event(self):
        """ทดสอบการเพิ่ม event"""
        mcp = MockGoogleCalendarMCP()
        initial_count = len(mcp.db)

        new_event = Event(
            summary="Test Event",
            start=datetime(2026, 6, 10, 15, 0),
            end=datetime(2026, 6, 10, 16, 0)
        )

        result = mcp.add_event(new_event)

        assert result is True
        assert len(mcp.db) == initial_count + 1
        assert mcp.db[-1].summary == "Test Event"

    def test_get_events_in_range(self):
        """ทดสอบการดึง events ในช่วงเวลา"""
        mcp = MockGoogleCalendarMCP()

        # ดึง events ในเดือนมิถุนายน 2026
        start = datetime(2026, 6, 1, 0, 0)
        end = datetime(2026, 6, 30, 23, 59)

        events = mcp.get_events(start, end)

        # ควรได้นัดทำฟันที่มีอยู่แล้ว
        assert len(events) >= 1
        assert any("นัดทำฟัน" in e.summary for e in events)

    def test_get_events_outside_range(self):
        """ทดสอบดึง events นอกช่วงเวลา (ควรได้ทุก event ตาม mock)"""
        mcp = MockGoogleCalendarMCP()

        # ดึงเดือนมกราคม (ไม่มีนัดทำฟัน)
        start = datetime(2026, 1, 1, 0, 0)
        end = datetime(2026, 1, 31, 23, 59)

        events = mcp.get_events(start, end)

        # Mock ปัจจุบันคืนทุก event (ยังไม่ filter)
        # ในอนาคตอาจ implement การ filter
        assert isinstance(events, list)

# ==========================================
# Integration Test
# ==========================================
class TestIntegration:
    """ทดสอบการทำงานร่วมกันของทั้งระบบ"""

    def test_full_workflow_no_conflict(self):
        """ทดสอบ workflow เต็ม: ไม่มีความชน"""
        mcp = MockGoogleCalendarMCP()
        mcp.db = []  # ล้าง DB เริ่มต้นใหม่
        agent = CalendarAgent(mcp)

        user_intent = {
            "summary": "Test Course",
            "start": datetime(2026, 7, 1, 10, 0),
            "duration_weeks": 2
        }

        response = agent.process_recurring_request(user_intent)

        assert "เรียบร้อย" in response
        assert len(mcp.db) == 2

    def test_full_workflow_with_conflict(self):
        """ทดสอบ workflow เต็ม: มีความชน"""
        mcp = MockGoogleCalendarMCP()
        agent = CalendarAgent(mcp)

        # มีนัดทำฟันอยู่แล้ว
        user_intent = {
            "summary": "Conflicting Course",
            "start": datetime(2026, 6, 8, 9, 0),  # ชนกับนัดทำฟัน
            "duration_weeks": 2
        }

        response = agent.process_recurring_request(user_intent)

        assert "⚠️" in response
        assert "ชน" in response

# ==========================================
# Test 5: Auto-Suggest Feature
# ==========================================
class TestAutoSuggest:
    """ทดสอบฟีเจอร์ auto-suggest เวลาว่าง"""

    def test_find_available_slots_empty_day(self, agent):
        """ทดสอบหาช่วงว่างในวันที่ไม่มี event"""
        target = Event(
            summary="New Meeting",
            start=datetime(2026, 6, 10, 10, 0),  # 10:00-11:00
            end=datetime(2026, 6, 10, 11, 0)
        )

        existing_events = []  # ไม่มี event

        slots = agent.find_available_slots(target, existing_events)

        # ควรมีช่วงว่างตั้งแต่ 8:00 เช้า
        assert len(slots) > 0
        assert slots[0]['start'].hour == 8

    def test_find_available_slots_with_conflicts(self, agent):
        """ทดสอบหาช่วงว่างเมื่อมี event อื่นอยู่"""
        target = Event(
            summary="New Meeting",
            start=datetime(2026, 6, 10, 10, 0),  # ต้องการ 10:00-11:00
            end=datetime(2026, 6, 10, 11, 0)
        )

        existing_events = [
            Event(
                summary="Existing 1",
                start=datetime(2026, 6, 10, 9, 0),   # 9:00-10:00
                end=datetime(2026, 6, 10, 10, 0)
            ),
            Event(
                summary="Existing 2",
                start=datetime(2026, 6, 10, 14, 0),  # 14:00-15:00
                end=datetime(2026, 6, 10, 15, 0)
            )
        ]

        slots = agent.find_available_slots(target, existing_events)

        # ควรมีช่วงว่าง: 8:00-9:00, 10:00-11:00, 15:00-16:00, etc.
        assert len(slots) > 0

        # ตรวจสอบว่าช่วงแรกเริ่มก่อน 9:00
        assert slots[0]['start'] < datetime(2026, 6, 10, 9, 0)

    def test_find_available_slots_duration_3_hours(self, agent):
        """ทดสอบหาช่วงว่างสำหรับ event ที่ยาว 3 ชั่วโมง"""
        target = Event(
            summary="Long Meeting",
            start=datetime(2026, 6, 10, 10, 0),
            end=datetime(2026, 6, 10, 13, 0)  # 3 ชั่วโมง
        )

        existing_events = [
            Event(
                summary="Morning Block",
                start=datetime(2026, 6, 10, 9, 0),
                end=datetime(2026, 6, 10, 10, 30)  # จบ 10:30
            )
        ]

        slots = agent.find_available_slots(target, existing_events)

        # ช่วงแรกควรเริ่มหลัง Morning Block (10:30)
        # และมีเวลาพอ 3 ชั่วโมง
        if len(slots) > 0:
            first_slot = slots[0]
            duration = first_slot['end'] - first_slot['start']
            assert duration == timedelta(hours=3)
            assert first_slot['start'] >= existing_events[0].end

    def test_suggest_alternatives_no_conflicts(self, agent, mock_calendar):
        """ทดสอบ suggest_alternatives เมื่อไม่มีความชน"""
        mock_calendar.db = []  # ล้าง DB

        conflict_data = []  # ไม่มี conflict

        suggestions = agent.suggest_alternatives(conflict_data)

        assert len(suggestions) == 0  # ไม่ควรมีคำแนะนำ

    def test_suggest_alternatives_with_conflict(self, agent, mock_calendar):
        """ทดสอบ suggest_alternatives เมื่อมีความชน"""
        # Setup: มี event อยู่แล้ว
        mock_calendar.db = [
            Event(
                summary="Existing Event",
                start=datetime(2026, 6, 10, 10, 0),
                end=datetime(2026, 6, 10, 11, 0)
            )
        ]

        # Event ที่ต้องการเพิ่ม (ชนกับ existing)
        target = Event(
            summary="New Event",
            start=datetime(2026, 6, 10, 10, 30),  # ชน!
            end=datetime(2026, 6, 10, 11, 30)
        )

        conflict_data = [{
            "target": target,
            "conflicts": [mock_calendar.db[0]]
        }]

        suggestions = agent.suggest_alternatives(conflict_data)

        # ควรมีคำแนะนำสำหรับวันที่ 2026-06-10
        assert "2026-06-10" in suggestions
        assert len(suggestions["2026-06-10"]) > 0

    def test_process_recurring_with_auto_suggest(self, agent, mock_calendar):
        """ทดสอบ process_recurring_request พร้อม auto-suggest"""
        # Setup: มีนัดทำฟันอยู่แล้ว
        mock_calendar.db = [
            Event(
                summary="Dentist Appointment",
                start=datetime(2026, 6, 8, 10, 0),
                end=datetime(2026, 6, 8, 11, 0)
            )
        ]

        user_intent = {
            "summary": "Weekly Class",
            "start": datetime(2026, 6, 1, 9, 30),  # จะชนใน W2
            "duration_weeks": 3
        }

        response = agent.process_recurring_request(user_intent)

        # ควรมี warning และคำแนะนำ
        assert "⚠️" in response
        assert "💡" in response or "Auto-Suggest" in response
        assert "2026-06-08" in response  # วันที่ชน

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
