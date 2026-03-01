# 📊 TypeScript & Frontend Code Conventions

## Directory Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── api/               # API routes (if any)
│   └── [feature]/         # Feature-specific pages
├── components/            # Reusable React components
│   ├── layout/            # Layout components (Navbar, Sidebar)
│   ├── features/          # Feature-specific components
│   ├── ui/                # Generic UI components (Button, Card, etc.)
│   └── common/            # Shared components
├── lib/                   # Utilities and helpers
│   ├── utils/             # Pure utility functions
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service clients
│   └── constants/         # App-wide constants
├── types/                 # TypeScript type definitions
│   ├── index.ts           # Re-exports
│   ├── api.ts             # API response/request types
│   ├── domain.ts          # Business domain types
│   └── ui.ts              # UI-specific types
├── styles/                # CSS/Tailwind styles
├── public/                # Static assets
├── prisma/                # Database schema & migrations
└── config/                # Configuration files
```

## Naming Conventions

### Components
```typescript
// PascalCase for component files (React)
export function UserProfile() {
  return <div>...</div>;
}

// Store in: components/features/UserProfile.tsx
// or: components/UserProfile.tsx
```

### Custom Hooks
```typescript
// useCamelCase for hooks
export function useLocalStorage(key: string) {
  // Implementation
}

// Store in: lib/hooks/useLocalStorage.ts
```

### Utility Functions
```typescript
// camelCase for utilities
export function formatDate(date: Date): string {
  // Implementation
}

// Store in: lib/utils/formatDate.ts
```

### Types & Interfaces
```typescript
// PascalCase for types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// or
type Blueprint = {
  id: string;
  title: string;
};

// Store in: types/*.ts
```

### Constants
```typescript
// UPPER_SNAKE_CASE for constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

## Type Safety

### Always use TypeScript
```typescript
// ❌ Avoid 'any'
function getData(id: any) {
  // ...
}

// ✅ Prefer specific types
function getData(id: string): Promise<UserData> {
  // ...
}
```

### Define component prop types
```typescript
interface UserCardProps {
  user: User;
  onSelect?: (id: string) => void;
  isLoading?: boolean;
}

export function UserCard({ user, onSelect, isLoading }: UserCardProps) {
  // ...
}
```

### Generic types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchUsers(): Promise<ApiResponse<User[]>> {
  // ...
}
```

## React Best Practices

### Use Functional Components
```typescript
// ✅ Modern approach
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// ❌ Avoid class components
class Counter extends React.Component {
  // ...
}
```

### Extract Custom Hooks
```typescript
// If a component has internal state logic, extract to a hook
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = () => setCount(count + 1);
  return { count, increment };
}

function Counter() {
  const { count, increment } = useCounter();
  return <button onClick={increment}>{count}</button>;
}
```

### Keep Components Small
```typescript
// ❌ Component too large (>200 lines)
function Dashboard() {
  // ... 300 lines of code
}

// ✅ Extract to smaller components
function Dashboard() {
  return (
    <div>
      <Header />
      <Sidebar />
      <MainContent />
      <Footer />
    </div>
  );
}
```

### Use Next.js Image Component
```typescript
// ✅ Always define width/height for Next.js <Image>
import Image from 'next/image';

export function Avatar({ src, alt }: ImageProps) {
  return <Image src={src} alt={alt} width={48} height={48} />;
}

// ❌ Never do this
export function Avatar() {
  return <img src="avatar.jpg" />;
}
```

## Formatting & Linting

### Use Prettier
- Configured in `.prettierrc.json`
- Runs on file save (configured in `.vscode/settings.json`)
- Format: `bun run format`

### Use ESLint
- Configured in `eslint.config.mjs`
- Check: `bun run lint`
- Fix: `bun run lint --fix`

### Style Guide
```typescript
// Line length: max 100 characters
const veryLongVariableName = 'This is a long string that demonstrates';

// Quotes: prefer single quotes
const message = 'Hello World';

// Semicolons: always required
const value = 42;

// Trailing comma: use es5
const array = [1, 2, 3,];

// Spacing in imports
import { useEffect, useState } from 'react';
```

## Comments & Documentation

### Use JSDoc for public APIs
```typescript
/**
 * Formats a date to a readable string
 * @param date - The date to format
 * @param locale - Optional locale (defaults to 'en')
 * @returns Formatted date string (e.g., "Mar 1, 2026")
 */
export function formatDate(date: Date, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale).format(date);
}
```

### Inline comments for complex logic
```typescript
// Cache the user profile to avoid redundant requests
const memoizedUser = useMemo(() => getUserProfile(userId), [userId]);

// Check if user has required permissions before showing button
const canEdit = userPermissions.includes('EDIT_BLUEPRINT');
```

---

**See also**: [Python_conventions.md](Python_conventions.md) for backend style guide
