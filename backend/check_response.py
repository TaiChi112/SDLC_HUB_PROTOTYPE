import requests
import json

resp = requests.post("http://localhost:8000/api/visualize-spec", json={
    "userId": "test",
    "specId": "spec_2026-03-04-01-54-26-851830.json",
    "diagramTypes": ["excalidraw"]
})
data = resp.json()
diagram = data['diagram']

print(f"Response keys: {list(diagram.keys())}")
print(f"Type: {diagram.get('type')}")
print(f"Version: {diagram.get('version')}")
print(f"Elements count: {len(diagram.get('elements', []))}")
print(f"Has appState: {'appState' in diagram}")
print(f"Has files: {'files' in diagram}")
print(f"Source: {diagram.get('source')}")

# Check first element
if diagram.get('elements'):
    el = diagram['elements'][0]
    print(f"\nFirst element type: {el.get('type')}")
    print(f"Has all required fields:")
    required = ['id', 'type', 'x', 'y', 'width', 'height', 'strokeColor', 'backgroundColor']
    for field in required:
        print(f"  {field}: {field in el}")
