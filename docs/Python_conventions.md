# 🐍 Python & Backend Code Conventions

## Directory Structure

```
backend/
├── app.py                # FastAPI main application
├── api/                  # API route modules
│   ├── __init__.py
│   ├── blueprints.py     # Blueprint endpoints
│   ├── generators.py     # Generation endpoints
│   └── auth.py           # Authentication endpoints
├── models/               # Pydantic models & schemas
│   ├── __init__.py
│   ├── blueprint.py      # Blueprint schemas
│   └── user.py           # User schemas
├── services/             # Business logic layer
│   ├── __init__.py
│   ├── blueprint_service.py
│   └── llm_service.py    # LLM integration
├── db/                   # Database layer
│   ├── __init__.py
│   └── database.py       # DB connection & queries
├── utils/                # Utility functions
│   ├── __init__.py
│   ├── validators.py
│   └── helpers.py
├── config/               # Configuration
│   ├── __init__.py
│   └── settings.py       # Environment settings
├── tests/                # Test suite
│   ├── __init__.py
│   ├── test_api.py
│   └── test_services.py
├── pyproject.toml        # Dependencies & metadata
├── .env.example          # Environment template
├── docker-compose.yml    # Docker services
└── README.md             # Backend-specific docs
```

## Naming Conventions

### Modules & Functions
```python
# snake_case for modules and functions
def generate_specification(blueprint_id: str) -> dict:
    """Generate a specification from a blueprint."""
    pass

# Store in: services/blueprint_service.py
```

### Classes & Models
```python
# PascalCase for classes and Pydantic models
class BlueprintModel(BaseModel):
    id: str
    title: str
    description: str

class BlueprintService:
    def get_by_id(self, blueprint_id: str) -> BlueprintModel:
        pass
```

### Constants & Enums
```python
# UPPER_SNAKE_CASE for constants
MAX_GENERATION_RETRIES = 3
DEFAULT_TEMPERATURE = 0.7
API_TIMEOUT_SECONDS = 30

# Use Enum for option sets
from enum import Enum

class SpecificationStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
```

### Variables
```python
# snake_case for all variables
user_id = "12345"
is_published = True
blueprint_sections = []
```

## Style Guide (PEP 8)

### Imports
```python
# Order: standard library, third-party, local
import json
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from services.blueprint_service import BlueprintService

# Don't use: from module import *
# Do use: import specific items
```

### Line Length
```python
# Max 100 characters per line (configured in pyproject.toml)
# Break long lines naturally
function_result = some_function(
    first_argument,
    second_argument,
    third_argument,
)
```

### Type Hints
```python
# ✅ Always use type hints
def get_user(user_id: str) -> Optional[User]:
    """Fetch user by ID."""
    pass

def process_items(items: List[str]) -> dict[str, int]:
    """Process a list of items."""
    pass

# ❌ Avoid missing types
def get_user(user_id):
    pass
```

### String Formatting
```python
# ✅ Use f-strings (Python 3.6+)
name = "Alice"
greeting = f"Hello, {name}!"

# ❌ Avoid old-style formatting
greeting = "Hello, %s!" % name
greeting = "Hello, {}!".format(name)
```

## FastAPI Endpoints

### Route Structure
```python
# routes/blueprints.py
from fastapi import APIRouter, HTTPException
from models.blueprint import BlueprintCreate, BlueprintResponse

router = APIRouter(prefix="/blueprints", tags=["blueprints"])

@router.get("/")
async def list_blueprints() -> list[BlueprintResponse]:
    """Get all blueprints."""
    pass

@router.get("/{blueprint_id}")
async def get_blueprint(blueprint_id: str) -> BlueprintResponse:
    """Get a specific blueprint by ID."""
    pass

@router.post("/")
async def create_blueprint(body: BlueprintCreate) -> BlueprintResponse:
    """Create a new blueprint."""
    pass

@router.put("/{blueprint_id}")
async def update_blueprint(
    blueprint_id: str,
    body: BlueprintCreate,
) -> BlueprintResponse:
    """Update an existing blueprint."""
    pass

@router.delete("/{blueprint_id}")
async def delete_blueprint(blueprint_id: str) -> None:
    """Delete a blueprint."""
    pass
```

### Error Handling
```python
from fastapi import HTTPException, status

@router.get("/{item_id}")
async def get_item(item_id: str):
    item = await db.get_item(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found",
        )
    
    return item
```

## Pydantic Models

### Define Schemas Clearly
```python
from pydantic import BaseModel, Field
from typing import Optional

class BlueprintCreate(BaseModel):
    """Schema for creating a new blueprint."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    version: str = "1.0.0"

class BlueprintResponse(BlueprintCreate):
    """Schema for returning a blueprint with metadata."""
    id: str
    created_at: datetime
    updated_at: datetime
    is_published: bool = False

    class Config:
        from_attributes = True  # For ORM models
```

## Functions & Methods

### Keep Functions Small
```python
# ✅ Single responsibility
def validate_email(email: str) -> bool:
    """Check if email format is valid."""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

# ❌ Too much responsibility
def create_user_and_send_email(email, name, password):
    # validate email
    # hash password
    # create database record
    # send email
    # return user
    pass
```

### Use Docstrings
```python
def generate_spec(blueprint_id: str, llm_config: Optional[dict] = None) -> dict:
    """
    Generate a specification from a blueprint using LLM.

    Args:
        blueprint_id: The ID of the blueprint to generate from
        llm_config: Optional LLM configuration overrides

    Returns:
        Generated specification as a dictionary

    Raises:
        ValueError: If blueprint_id is empty
        Exception: If LLM generation fails
    """
    if not blueprint_id:
        raise ValueError("blueprint_id cannot be empty")
    
    # Implementation
    pass
```

## Testing

### Test File Structure
```python
# tests/test_blueprint_service.py
import pytest
from services.blueprint_service import BlueprintService
from models.blueprint import Blueprint

class TestBlueprintService:
    """Tests for BlueprintService."""

    @pytest.fixture
    def service(self):
        """Create a service instance for testing."""
        return BlueprintService()

    def test_get_blueprint_returns_correct_data(self, service):
        """Test that get_blueprint returns the correct blueprint."""
        blueprint = service.get(blueprint_id="test-1")
        assert blueprint.id == "test-1"
        assert blueprint.title is not None

    def test_create_blueprint_validates_input(self, service):
        """Test that create_blueprint validates required fields."""
        with pytest.raises(ValueError):
            service.create(title="", description="Empty title")
```

## Comments & Documentation

### Docstring Style (Google Format)
```python
def process_blueprint_sections(
    blueprint: Blueprint,
    include_archived: bool = False,
) -> list[Section]:
    """
    Process and filter blueprint sections.

    Args:
        blueprint: The blueprint to process
        include_archived: Whether to include archived sections

    Returns:
        List of processed sections

    Example:
        >>> bp = Blueprint(sections=[...])
        >>> sections = process_blueprint_sections(bp)
        >>> len(sections) > 0
        True
    """
    pass
```

### Inline Comments
```python
# Use UPPER_SNAKE_CASE for important flags/conditions
if is_production:
    # Log to external service only in production
    log_to_datadog(event)
```

## Environment & Configuration

### Use Environment Variables
```python
# config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API
    api_title: str = "Blueprint Hub API"
    api_version: str = "0.1.0"
    
    # Database
    database_url: str = "postgresql://localhost/blueprint_hub"
    
    # LLM
    openai_api_key: str
    llm_model: str = "gpt-4"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

### Never Hardcode Secrets
```python
# ✅ Load from environment
api_key = os.getenv("OPENAI_API_KEY")

# ❌ Don't hardcode
api_key = "sk-abc123xyz"
```

---

**See also**: [TypeScript_conventions.md](TypeScript_conventions.md) for frontend style guide
