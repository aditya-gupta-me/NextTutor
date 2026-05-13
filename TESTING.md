# Testing

## Quick Start

```bash
# Run all tests once
npm test

# Watch mode — re-runs on file changes (use during development)
npm run test:watch
```

## Stack

| Tool | Role |
|---|---|
| [Vitest](https://vitest.dev) | Test runner — fast, ESM-native, understands TypeScript out of the box |
| [React Testing Library](https://testing-library.com/react) | Renders components and queries them the way a user would (by text, labels, roles) |
| [jsdom](https://github.com/jsdom/jsdom) | Simulates a browser DOM so tests run in Node without a real browser |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) | Fires realistic user interactions — clicks, typing, file uploads |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | Adds DOM matchers: `.toBeInTheDocument()`, `.toBeVisible()`, `.toHaveClass()`, etc. |

## Where Tests Live

Tests go in `__tests__/` folders next to the code they test. This keeps things easy to find and makes it obvious when something is covered.

```
src/
├── components/
│   └── ui/
│       ├── AvatarUpload.tsx
│       └── __tests__/
│           └── AvatarUpload.test.tsx
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts                ← when we add lib tests
└── test/
    └── setup.ts                         ← global test setup
```

**Convention**: test files are named `<module>.test.tsx` (or `.test.ts` for non-React code).

## Writing a Test

Here's the general shape of a test file in this project:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyComponent from "../MyComponent";

// Mock external dependencies
vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({ /* mock methods */ }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("MyComponent", () => {
    it("renders the expected content", () => {
        render(<MyComponent name="Test" />);
        expect(screen.getByText("Test")).toBeInTheDocument();
    });

    it("handles user interaction", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(<MyComponent onSubmit={onSubmit} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));

        expect(onSubmit).toHaveBeenCalled();
    });
});
```

### Test Naming

Write descriptions from the user's perspective:

```typescript
// Good — describes observable behavior
it("shows error when file is too large", ...);
it("disables submit button while saving", ...);
it("redirects to dashboard after login", ...);

// Bad — describes implementation details
it("calls setState with null", ...);
it("renders a div with className 'error'", ...);
```

## What to Test

### Do test

- **Rendering states** — empty, loading, loaded, error
- **User interactions** — clicking buttons, submitting forms, uploading files
- **Validation logic** — bad inputs, edge cases, boundary values
- **Error handling** — network failures, unexpected data
- **Callbacks** — does the parent get notified with the right data?

### Skip testing

- Pure layout wrappers that just pass `children` through
- CSS classes and visual styling (that's what your eyes are for)
- Server Components that only fetch and display — those are better covered by E2E tests later
- Third-party library internals

## Mocking

### What gets mocked

External dependencies that would make tests slow, flaky, or require real infrastructure:

| Dependency | How to mock |
|---|---|
| **Supabase client** | `vi.mock("@/lib/supabase/client", ...)` — mock the methods you call |
| **Toast context** | `vi.mock("@/components/ui/ToastContext", ...)` — return mock functions |
| **next/navigation** | `vi.mock("next/navigation", ...)` — mock `useRouter`, `redirect`, etc. |
| **Google Maps** | `vi.mock("@/lib/google-maps", ...)` — mock `loadGoogleMaps`, `geocodeAddress` |

### Mock example: Supabase Storage

```typescript
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        storage: {
            from: () => ({
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl,
            }),
        },
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: "https://example.com/file.jpg" },
    });
});
```

### Mock example: Supabase Database

```typescript
const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        from: () => ({
            select: mockSelect,
            insert: mockInsert,
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
        }),
    }),
}));
```

## Async Patterns

Always use `waitFor` instead of arbitrary timeouts:

```typescript
// Correct — waits until assertion passes (up to timeout)
await waitFor(() => {
    expect(screen.getByText("Upload complete")).toBeInTheDocument();
});

// Wrong — brittle, slow, fails randomly
await new Promise(r => setTimeout(r, 1000));
expect(screen.getByText("Upload complete")).toBeInTheDocument();
```

For user interactions that trigger async operations (API calls, state updates), combine `userEvent` with `waitFor`:

```typescript
const user = userEvent.setup();
await user.click(screen.getByRole("button", { name: /save/i }));

await waitFor(() => {
    expect(mockInsert).toHaveBeenCalled();
});
```

## Testing Utilities

### Creating mock files (for upload tests)

```typescript
function createMockFile(name: string, sizeInBytes: number, type: string): File {
    const content = new Uint8Array(sizeInBytes);
    return new File([content], name, { type });
}

// Usage
const image = createMockFile("photo.jpg", 500_000, "image/jpeg");
```

### Accessing elements by test ID

When semantic queries (`getByRole`, `getByText`) aren't practical, use `data-testid`:

```tsx
// Component
<button data-testid="remove-btn" onClick={handleRemove}>×</button>

// Test
screen.getByTestId("remove-btn");
```

Prefer semantic queries when possible — they catch accessibility issues for free.

## Config Files

| File | Purpose |
|---|---|
| `vitest.config.ts` | Test runner config — environment, path aliases, setup files |
| `src/test/setup.ts` | Loads RTL DOM matchers into Vitest |

## Current Coverage

| Module | Tests | What's covered |
|---|---|---|
| `AvatarUpload` | 9 | Rendering, file validation, upload flow, removal, error handling |

This table should be updated as new test files are added.

## When to Add Tests

The rule of thumb: **if you'd manually test it in the browser after a change, write an automated test instead.**

Specifically:
- Every new interactive component should have tests
- Every non-trivial utility function should have tests
- Every bug fix should start with a failing test (then fix it)

## CI Integration

When CI is set up, `npm test` will run on every pull request. Target: total test run under **15 seconds**.

```yaml
# .github/workflows/test.yml
name: Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
```
