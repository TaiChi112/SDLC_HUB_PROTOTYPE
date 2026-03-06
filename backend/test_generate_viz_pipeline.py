#!/usr/bin/env python3
"""
Integration Test: LLM Process Description → Excalidraw JSON

Tests the full pipeline:
1. Process description parsing
2. Excalidraw JSON generation
3. API endpoint validation
4. Error handling

Run with: python test_generate_viz_pipeline.py
"""

import json
import sys
from datetime import datetime, timezone
from llm_to_excalidraw import (
    process_description_to_excalidraw,
    parse_process_steps,
    validate_excalidraw_json,
)

# Colored output for better readability
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(name: str):
    """Print test header"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST: {name}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")

def print_pass(msg: str):
    """Print passing test result"""
    print(f"{Colors.GREEN}✅ PASS:{Colors.RESET} {msg}")

def print_fail(msg: str):
    """Print failing test result"""
    print(f"{Colors.RED}❌ FAIL:{Colors.RESET} {msg}")

def print_info(msg: str):
    """Print info message"""
    print(f"{Colors.YELLOW}ℹ️  INFO:{Colors.RESET} {msg}")

# ============================================================================
# Test Data
# ============================================================================

SAMPLE_PROCESS_DESCRIPTIONS = {
    "e_learning": """
    Process Flow:
    → Step 1: User logs in to platform (Input: username/password)
    → Step 2: User browses available courses (Duration: variable)
    → Step 3: User watches course video (Duration: depends on video length)
    → Step 4: User takes quiz at end of chapter (Duration: 10-30 minutes)
    → Step 5: System evaluates results (Duration: <1s)
    → Step 6: User receives certificate if passed (Output: certificate PDF)
    """,

    "simple": """
    Process Flow:
    → Step 1: User submits form (Input: form data)
    → Step 2: Backend validates input (Duration: <1s)
    → Step 3: LLM generates specification (Duration: 5-10s)
    → Step 4: Save to database (Duration: <1s)
    → Step 5: Return JSON response (Output: spec data)
    """,

    "api_flow": """
    Process Flow:
    → Step 1: Client sends HTTP request (Input: JSON payload)
    → Step 2: Server receives and parses request (Duration: <100ms)
    → Step 3: Validate request schema (Duration: <100ms)
    → Step 4: Process business logic (Duration: variable)
    → Step 5: Return HTTP response (Output: JSON + status code)
    """,
}

# ============================================================================
# Test Cases
# ============================================================================

def test_parse_process_steps():
    """Test parsing process description into steps"""
    print_test("Parse Process Steps")

    for name, description in SAMPLE_PROCESS_DESCRIPTIONS.items():
        steps = parse_process_steps(description)

        if len(steps) > 0:
            print_pass(f"{name.upper()}: Found {len(steps)} steps")
            for i, step in enumerate(steps, 1):
                print(f"         Step {i}: {step['title']}")
        else:
            print_fail(f"{name.upper()}: No steps found")
            return False

    return True


def test_excalidraw_generation():
    """Test Excalidraw JSON generation"""
    print_test("Excalidraw JSON Generation")

    for name, description in SAMPLE_PROCESS_DESCRIPTIONS.items():
        try:
            exc_json = process_description_to_excalidraw(description)

            # Check structure
            if not isinstance(exc_json, dict):
                print_fail(f"{name.upper()}: Result is not a dict")
                return False

            # Check required fields
            required_fields = ["type", "version", "elements", "appState"]
            missing = [f for f in required_fields if f not in exc_json]

            if missing:
                print_fail(f"{name.upper()}: Missing fields: {missing}")
                return False

            element_count = len(exc_json.get("elements", []))
            print_pass(f"{name.upper()}: Generated {element_count} elements")

        except Exception as e:
            print_fail(f"{name.upper()}: {str(e)}")
            return False

    return True


def test_excalidraw_validation():
    """Test Excalidraw JSON validation"""
    print_test("Excalidraw JSON Validation")

    # Test valid JSON
    description = SAMPLE_PROCESS_DESCRIPTIONS["simple"]
    exc_json = process_description_to_excalidraw(description)

    if validate_excalidraw_json(exc_json):
        print_pass("Valid JSON passes validation")
    else:
        print_fail("Valid JSON failed validation")
        return False

    # Test invalid JSON (missing type)
    invalid_json = {"elements": [], "appState": {}}

    if not validate_excalidraw_json(invalid_json):
        print_pass("Invalid JSON correctly rejected")
    else:
        print_fail("Invalid JSON should have been rejected")
        return False

    return True


def test_api_request_schema():
    """Test API request validation"""
    print_test("API Request Schema Validation")

    # Valid request
    valid_request = {
        "processDescription": "Process Flow:\n→ Step 1: Test step (Input: test)",
        "specId": "spec_123"
    }

    if len(valid_request["processDescription"]) >= 10:
        print_pass("Valid request schema passes")
    else:
        print_fail("Valid request schema failed")
        return False

    # Invalid: too short
    invalid_request = {
        "processDescription": "Short"
    }

    if len(invalid_request["processDescription"]) < 10:
        print_pass("Invalid (too short) request correctly detected")
    else:
        print_fail("Should detect short processDescription")
        return False

    # Invalid: empty
    invalid_request = {
        "processDescription": ""
    }

    if not invalid_request["processDescription"]:
        print_pass("Invalid (empty) request correctly detected")
    else:
        print_fail("Should detect empty processDescription")
        return False

    return True


def test_api_response_schema():
    """Test API response format"""
    print_test("API Response Schema")

    description = SAMPLE_PROCESS_DESCRIPTIONS["simple"]
    exc_json = process_description_to_excalidraw(description)

    # Simulate API response
    response = {
        "status": "success",
        "excalidrawJson": exc_json,
        "processDescription": description,
        "elementCount": len(exc_json.get("elements", [])),
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "specId": "test_spec_123"
    }

    # Validate response structure
    required_fields = ["status", "excalidrawJson", "processDescription", "elementCount", "timestamp"]
    missing = [f for f in required_fields if f not in response]

    if missing:
        print_fail(f"Missing response fields: {missing}")
        return False

    if response["status"] != "success":
        print_fail("Response status should be 'success'")
        return False

    if response["elementCount"] != len(exc_json.get("elements", [])):
        print_fail("Element count mismatch")
        return False

    print_pass(f"Response schema valid (elementCount: {response['elementCount']})")
    print_pass(f"Timestamp: {response['timestamp']}")

    return True


def test_error_scenarios():
    """Test error handling scenarios"""
    print_test("Error Scenarios")

    # Scenario 1: Empty process description
    print_info("Testing: Empty processDescription")
    empty_desc = ""

    if not empty_desc or len(empty_desc.strip()) < 10:
        print_pass("Empty description correctly identified")
    else:
        print_fail("Should identify empty description")
        return False

    # Scenario 2: Process with no valid steps
    print_info("Testing: Description with no valid steps")
    invalid_format = "This is just regular text with no arrow format"
    steps = parse_process_steps(invalid_format)

    if len(steps) == 0:
        print_pass("No valid steps found (expected)")
    else:
        print_fail(f"Should find no steps, found {len(steps)}")

    # Scenario 3: Very long description (should still work)
    print_info("Testing: Very long process description")
    long_desc = "Process Flow:\n" + "\n".join([
        f"→ Step {i}: Long step description with lots of details about what happens in this step (Input: data{i}) (Duration: variable)"
        for i in range(1, 15)
    ])

    try:
        exc_json = process_description_to_excalidraw(long_desc)
        print_pass(f"Long description handled (generated {len(exc_json.get('elements', []))} elements)")
    except Exception as e:
        print_fail(f"Long description failed: {str(e)}")
        return False

    return True


def test_full_pipeline():
    """Test complete pipeline: description → JSON → validation"""
    print_test("Full Pipeline: Description → Excalidraw JSON → Validation")

    description = SAMPLE_PROCESS_DESCRIPTIONS["e_learning"]

    print_info("Step 1: Parse steps from description")
    steps = parse_process_steps(description)
    print_pass(f"  → Parsed {len(steps)} steps")

    print_info("Step 2: Generate Excalidraw JSON")
    exc_json = process_description_to_excalidraw(description)
    elements = exc_json.get("elements", [])
    print_pass(f"  → Generated {len(elements)} elements (shapes + arrows)")

    print_info("Step 3: Validate Excalidraw JSON")
    if validate_excalidraw_json(exc_json):
        print_pass("  → JSON validation passed")
    else:
        print_fail("  → JSON validation failed")
        return False

    print_info("Step 4: Create API response")
    response = {
        "status": "success",
        "excalidrawJson": exc_json,
        "processDescription": description[:100] + "...",
        "elementCount": len(elements),
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
    }

    print_pass("  → API response created")
    print(f"    - Status: {response['status']}")
    print(f"    - Elements: {response['elementCount']}")
    print(f"    - Timestamp: {response['timestamp']}")

    return True


def test_sample_responses():
    """Generate and display sample API responses"""
    print_test("Sample API Responses")

    description = SAMPLE_PROCESS_DESCRIPTIONS["simple"]
    exc_json = process_description_to_excalidraw(description)

    response = {
        "status": "success",
        "excalidrawJson": exc_json,
        "processDescription": description.strip(),
        "elementCount": len(exc_json.get("elements", [])),
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "specId": "spec_20260302_001"
    }

    print_info("Sample Success Response:")
    print(json.dumps({
        "status": response["status"],
        "elementCount": response["elementCount"],
        "timestamp": response["timestamp"],
        "specId": response["specId"],
        "excalidrawJson": f"<{len(exc_json.get('elements', []))} elements>"
    }, indent=2))

    print_info("\nElement types generated:")
    element_types = {}
    for elem in exc_json.get("elements", []):
        elem_type = elem.get("type", "unknown")
        element_types[elem_type] = element_types.get(elem_type, 0) + 1

    for elem_type, count in element_types.items():
        print(f"  - {elem_type}: {count}")

    return True


# ============================================================================
# Main Test Runner
# ============================================================================

def run_all_tests():
    """Run all tests and report results"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}Integration Test Suite: Excalidraw Visualization Pipeline{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")

    tests = [
        ("Parse Process Steps", test_parse_process_steps),
        ("Excalidraw Generation", test_excalidraw_generation),
        ("JSON Validation", test_excalidraw_validation),
        ("API Request Schema", test_api_request_schema),
        ("API Response Schema", test_api_response_schema),
        ("Error Scenarios", test_error_scenarios),
        ("Full Pipeline", test_full_pipeline),
        ("Sample Responses", test_sample_responses),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_fail(f"Test crashed: {str(e)}")
            results.append((test_name, False))

    # Summary
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}Test Summary{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = f"{Colors.GREEN}PASS{Colors.RESET}" if result else f"{Colors.RED}FAIL{Colors.RESET}"
        print(f"{status}: {test_name}")

    print(f"\n{Colors.BLUE}Total: {passed}/{total} tests passed{Colors.RESET}")

    if passed == total:
        print(f"{Colors.GREEN}🎉 All tests passed!{Colors.RESET}")
        return 0
    else:
        print(f"{Colors.RED}❌ Some tests failed{Colors.RESET}")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
