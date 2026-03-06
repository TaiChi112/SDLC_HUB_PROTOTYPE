"""
Test /api/visualize-spec endpoint to diagnose issues
"""

import requests
import json

API_BASE_URL = "http://localhost:8000/api"

def test_visualize_spec():
    print("🔍 Testing /api/visualize-spec endpoint...\n")

    # Test 1: Check if backend is running
    try:
        health_response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        print(f"✅ Health check: {health_response.status_code}")
        print(f"   Response: {health_response.json()}\n")
    except Exception as e:
        print(f"❌ Backend not reachable: {e}\n")
        return

    # Test 2: Generate a spec first (to have specId)
    print("📝 Generating a test spec first...")
    spec_payload = {
        "prompt": "Build a simple task management app",
        "userId": "test@example.com",
        "preferences": {}
    }

    try:
        spec_response = requests.post(
            f"{API_BASE_URL}/generate",
            json=spec_payload,
            timeout=30
        )

        if spec_response.status_code == 200:
            spec_result = spec_response.json()
            spec_data = spec_result.get('data', {})
            filename = spec_result.get('filename')
            print(f"✅ Spec generated: {spec_data.get('project_name', 'N/A')}")
            print(f"   Spec ID/Filename: {filename}\n")

            spec_id = filename or spec_data.get('project_name')
        else:
            print(f"❌ Spec generation failed: {spec_response.status_code}")
            print(f"   Response: {spec_response.text[:500]}\n")
            return
    except Exception as e:
        print(f"❌ Spec generation error: {e}\n")
        return

    # Test 3: Call /api/visualize-spec
    print(f"🎨 Testing diagram generation for spec: {spec_id}...")
    visualize_payload = {
        "specId": spec_id,
        "userId": "test@example.com",
        "forceRegenerate": False,
        "diagramTypes": ["excalidraw"]
    }

    try:
        viz_response = requests.post(
            f"{API_BASE_URL}/visualize-spec",
            json=visualize_payload,
            timeout=30
        )

        print(f"\n📊 Response Status: {viz_response.status_code}")

        if viz_response.status_code == 200:
            viz_data = viz_response.json()
            print(f"✅ Diagram generated successfully!")
            print(f"   Diagram type: {viz_data.get('diagramType')}")
            print(f"   MCP: {viz_data.get('mcp')}")
            print(f"   Elements count: {len(viz_data.get('diagram', {}).get('elements', []))}")
            print(f"   Rate limit remaining: {viz_data.get('rateLimitRemaining')}")
            print(f"   Is mock: {viz_data.get('isMock', False)}")

            # Save to file for inspection
            with open('test_diagram_output.json', 'w', encoding='utf-8') as f:
                json.dump(viz_data.get('diagram'), f, indent=2, ensure_ascii=False)
            print(f"\n💾 Full diagram saved to: test_diagram_output.json")
        else:
            print(f"❌ Visualization failed!")
            print(f"   Status: {viz_response.status_code}")
            try:
                error_data = viz_response.json()
                print(f"   Error: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Raw response: {viz_response.text[:1000]}")

    except Exception as e:
        print(f"❌ Visualization request error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_visualize_spec()
