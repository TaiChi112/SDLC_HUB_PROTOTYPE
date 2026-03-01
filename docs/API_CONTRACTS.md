# 🔌 Frontend-Backend API Contracts

This document specifies the API contracts between the Next.js frontend and Python FastAPI backend.

## Base Configuration

- **Backend URL**: `http://localhost:8000` (development)
- **API Base Path**: `/api`
- **Authentication**: NextAuth (JWT + session-based)
- **Default Content-Type**: `application/json`

## Response Format

All API responses follow a standard format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Error Handling

Standard HTTP error responses:

```typescript
// 400 - Bad Request
{
  "success": false,
  "error": "Bad Request",
  "message": "Blueprint title is required"
}

// 401 - Unauthorized
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}

// 404 - Not Found
{
  "success": false,
  "error": "Not Found",
  "message": "Blueprint with id 'xyz' not found"
}

// 500 - Server Error
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Failed to generate specification"
}
```

## Endpoints

### 1. Blueprints Management

#### GET /api/blueprints
List all blueprints (with pagination)

**Query Parameters:**
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  is_published?: boolean;
  sort_by?: string;     // Created, updated, title
  order?: "asc" | "desc";
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    items: [
      {
        id: string;
        title: string;
        description: string;
        version: string;
        is_published: boolean;
        created_at: string;  // ISO 8601
        updated_at: string;
        author_id: string;
      }
    ],
    total: number;
    page: number;
    limit: number;
  }
}
```

---

#### GET /api/blueprints/{id}
Get a specific blueprint with all details

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string;
    version: string;
    is_published: boolean;
    status: "draft" | "review" | "approved";
    
    sections: {
      overview: { content: string; type: "text" | "list" | "diagram" };
      problem_statement: { content: string; type: "text" };
      scope: { content: string; type: "list" };
      requirements: { content: string; type: "list" | "diagram" };
      constraints: { content: string; type: "list" };
      assumptions: { content: string; type: "list" };
      acceptance_criteria: { content: string; type: "list" };
      [key: string]: unknown;
    };
    
    created_at: string;
    updated_at: string;
    author: { id: string; name: string; email: string };
  }
}
```

---

#### POST /api/blueprints
Create a new blueprint

**Request:**
```typescript
{
  title: string;              // Required, min 3 chars, max 200
  description?: string;
  version?: string;           // Default: "0.1.0"
}
```

**Response:** `201 Created`
```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string;
    version: string;
    is_published: false;
    sections: {};
    created_at: string;
    updated_at: string;
  }
}
```

---

#### PUT /api/blueprints/{id}
Update a blueprint

**Request:**
```typescript
{
  title?: string;
  description?: string;
  version?: string;
  status?: "draft" | "review" | "approved";
  is_published?: boolean;
  
  // Update specific sections
  sections?: {
    [section_name: string]: {
      content: string;
      type: "text" | "list" | "diagram";
    };
  };
}
```

**Response:** `200 OK` (returns updated blueprint)

---

#### DELETE /api/blueprints/{id}
Delete a blueprint (only if author)

**Response:** `204 No Content`

---

### 2. Specification Generation

#### POST /api/generate
Generate a specification using LLM

**Request:**
```typescript
{
  blueprint_id: string;
  prompt: string;                    // User's generation prompt
  
  // Optional overrides
  llm_model?: "gpt-4" | "gpt-3.5-turbo";
  temperature?: number;              // 0.0 - 1.0
  max_tokens?: number;
}
```

**Response:** `200 OK` (streaming or full response)
```typescript
{
  success: true,
  data: {
    blueprint_id: string;
    generated_sections: {
      [section_name: string]: {
        content: string;
        type: "text" | "list" | "diagram";
      };
    };
    generation_timestamp: string;
    model_used: string;
  }
}
```

---

#### POST /api/generate/multi-turn
Generate specification with conversational follow-up (multi-turn LLM)

**Request:**
```typescript
{
  blueprint_id: string;
  conversation: [
    {
      role: "user" | "assistant";
      content: string;
      timestamp?: string;
    }
  ];
  
  // Optional
  llm_model?: string;
  temperature?: number;
}
```

**Response:** `200 OK`
```typescript
{
  success: true,
  data: {
    blueprint_id: string;
    conversation_id: string;
    last_response: string;
    generated_sections?: { /* sections if generation complete */ };
    status: "waiting_for_input" | "generating" | "complete";
  }
}
```

---

### 3. User Profile & Auth

#### GET /api/user/profile
Get current authenticated user's profile

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
    blueprints_count: number;
  }
}
```

---

#### PUT /api/user/profile
Update user profile

**Request:**
```typescript
{
  name?: string;
  avatar_url?: string;
}
```

**Response:** `200 OK` (updated profile)

---

## Middleware & Authentication

### Required Headers
```
Authorization: Bearer {nextauth_token}
Content-Type: application/json
```

### CORS Configuration
- **Allowed Origins**: `http://localhost:3000`, `http://localhost:3001` (dev)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: true

---

## Rate Limiting

- **Global**: 100 requests per minute per IP
- **Auth Endpoints**: 10 requests per minute per IP
- **Generation Endpoints**: 5 requests per minute per user

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1645000000
```

---

## Versioning

Current API Version: **v1**

**Future Versions**: Use `/api/v2/` path when making breaking changes

---

## Frontend Service Client Example

```typescript
// lib/services/api.ts
class BlueprintAPI {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  async listBlueprints(page = 1, limit = 20) {
    const response = await fetch(`${this.baseURL}/blueprints?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json() as Promise<ApiResponse<BlueprintList>>;
  }

  async getBlueprint(id: string) {
    const response = await fetch(`${this.baseURL}/blueprints/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json() as Promise<ApiResponse<Blueprint>>;
  }

  async generateSpec(blueprintId: string, prompt: string) {
    const response = await fetch(`${this.baseURL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ blueprint_id: blueprintId, prompt }),
    });
    return response.json() as Promise<ApiResponse<GeneratedSpec>>;
  }
}

export const blueprintAPI = new BlueprintAPI();
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-01 | Initial API specification |

---

**Maintainer**: Development Team  
**Last Updated**: March 2026
