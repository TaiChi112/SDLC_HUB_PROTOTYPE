# /api/generate-viz Design & Implementation Plan

**Date:** 2026-03-02  
**Phase:** Phase 2 API Endpoint Design  
**Status:** Design Complete - Ready for Implementation  

---

## 📐 API Design

### Endpoint: `POST /api/generate-viz`

#### Purpose
Generate Excalidraw visualization JSON from a project specification's process description.

---

## 📋 Request Schema

### Option A: Process Description Direct (Recommended for MVP)
```typescript
{
  "processDescription": string;      // Already extracted process flow text
  "specId"?: string;                 // Optional: for logging/tracking
}
```

### Option B: Extract from Spec Data (Future)
```typescript
{
  "projectDescription": string;      // Full spec description
  "specId"?: string;
}
```

### Option C: Fetch from Database (Phase 3)
```typescript
{
  "specId": string;                  // Fetch spec + processDescription from DB
}
```

**MVP Choice:** Option A (process description already available from `/api/generate`)

---

## 📤 Response Schema

### Success Response (200 OK)
```typescript
{
  "status": "success",
  "excalidrawJson": {
    "type": "excalidraw",
    "version": 2,
    "versionNonce": number,
    "elements": Array,
    "appState": Object
  },
  "processDescription": string,      // Original process description for reference
  "elementCount": number,            // Number of shapes + arrows generated
  "timestamp": string,               // ISO 8601 timestamp
  "specId"?: string                  // If provided in request
}
```

### Error Response (4xx/5xx)
```typescript
{
  "status": "error",
  "code": string,     // Error code enum
  "message": string,  // User-friendly message
  "detail"?: string   // Technical details for debugging
}
```

---

## 🚨 Error Handling Strategy

### Error Codes & HTTP Status

| Code | HTTP | Description | Retry? |
|------|------|-------------|--------|
| `INVALID_INPUT` | 400 | Missing/invalid processDescription | ❌ No |
| `EMPTY_PROCESS` | 400 | Process description is blank/null | ❌ No |
| `PARSE_ERROR` | 422 | Failed to parse process steps | ⚠️ Maybe |
| `GENERATION_FAILED` | 500 | Failed to generate Excalidraw JSON | ✅ Yes |
| `INTERNAL_ERROR` | 500 | Unexpected server error | ✅ Yes |
| `SERVICE_TIMEOUT` | 504 | Generation took too long (>30s) | ✅ Yes |

### Error Response Examples

```typescript
// INVALID_INPUT (400)
{
  "status": "error",
  "code": "INVALID_INPUT",
  "message": "Missing required field: processDescription",
  "detail": "Request body must include processDescription string"
}

// PARSE_ERROR (422)
{
  "status": "error",
  "code": "PARSE_ERROR",
  "message": "Failed to parse process steps from description",
  "detail": "No valid steps found matching pattern '→ Step N:'"
}

// GENERATION_FAILED (500)
{
  "status": "error",
  "code": "GENERATION_FAILED",
  "message": "Failed to generate visualization",
  "detail": "Error in excalidraw element creation: ..."
}

// SERVICE_TIMEOUT (504)
{
  "status": "error",
  "code": "SERVICE_TIMEOUT",
  "message": "Diagram generation took too long",
  "detail": "Operation exceeded 30 second timeout"
}
```

---

## 🔄 Implementation Flow

```
POST /api/generate-viz
  ↓
[Validate Input]
  - Check processDescription is not empty
  - Return INVALID_INPUT if missing
  ↓
[Parse Steps]
  - Call parse_process_steps(description)
  - Return PARSE_ERROR if no steps found
  ↓
[Generate Excalidraw JSON]
  - Call process_description_to_excalidraw()
  - Catch JSON generation errors
  ↓
[Validate Output]
  - Call validate_excalidraw_json()
  - Return GENERATION_FAILED if invalid
  ↓
[Return Success]
  - Include: excalidrawJson, elementCount, timestamp
  - Status: 200 OK
```

---

## 📝 Pydantic Request/Response Models

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class GenerateVizRequest(BaseModel):
    """Request body for /api/generate-viz"""
    processDescription: str = Field(
        ..., 
        min_length=10, 
        description="Process flow description text"
    )
    specId: Optional[str] = Field(
        None, 
        description="Optional spec ID for tracking"
    )

    class Config:
        schema_extra = {
            "example": {
                "processDescription": "Process Flow:\n→ Step 1: User submits form\n→ Step 2: Validate input",
                "specId": "spec_123"
            }
        }


class GenerateVizSuccessResponse(BaseModel):
    """Successful response from /api/generate-viz"""
    status: str = "success"
    excalidrawJson: dict
    processDescription: str
    elementCount: int
    timestamp: str
    specId: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response from /api/generate-viz"""
    status: str = "error"
    code: str  # INVALID_INPUT, PARSE_ERROR, GENERATION_FAILED, etc.
    message: str
    detail: Optional[str] = None
```

---

## 🧪 Integration Flow (Full Pipeline)

### Frontend → Backend → Excalidraw JSON

```
User clicks "+ Generate Process Diagram"
            ↓
Frontend calls /api/generate (existing endpoint)
            ↓
Backend:
  - LLM generates spec WITH processDescription
  - Returns: { data: { ...spec, processDescription: "..." } }
            ↓
Frontend receives spec.processDescription
            ↓
Frontend calls /api/generate-viz with:
  { 
    processDescription: spec.processDescription,
    specId: spec.id  
  }
            ↓
Backend:
  - Validates processDescription
  - Parses steps
  - Generates Excalidraw JSON
  - Returns { excalidrawJson, status: "success" }
            ↓
Frontend:
  - Renders diagram in browser (read-only)
  - Auto-saves visualizationProcess to spec state
            ↓
User clicks "Publish" to save spec + visualization to DB
```

---

## 🎯 Success Criteria for Phase 2

✅ Endpoint Created:
- [ ] POST /api/generate-viz implemented
- [ ] Request validation (Pydantic models)
- [ ] Response with proper HTTP status codes
- [ ] Error handling for all edge cases

✅ Integration:
- [ ] Imports llm_to_excalidraw functions
- [ ] Calls process_description_to_excalidraw()
- [ ] Validates output with validate_excalidraw_json()

✅ Testing:
- [ ] Test: Valid process description → Success response
- [ ] Test: Empty processDescription → INVALID_INPUT error
- [ ] Test: Invalid step format → PARSE_ERROR warning (but still render)
- [ ] Test: Full pipeline: /api/generate → /api/generate-viz

✅ Documentation:
- [ ] Add endpoint to API_CONTRACTS.md
- [ ] Include request/response examples

---

## 📊 Endpoint Summary

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Path** | `/api/generate-viz` |
| **Auth** | Not required (optional specId for tracking) |
| **Timeout** | 30 seconds |
| **Rate Limit** | No limit (Phase 1) |
| **Returns** | Excalidraw JSON or error |
| **Content-Type** | application/json |

---

## 🔗 Related Endpoints

- `POST /api/generate` - Generate project spec (returns processDescription)
- `POST /api/specs` - Save spec to DB (can include visualizationProcess)
- (Future) `GET /api/specs/{specId}` - Fetch spec + visualization

---

**Next Step:** Implementation (create endpoint in api.py)  
