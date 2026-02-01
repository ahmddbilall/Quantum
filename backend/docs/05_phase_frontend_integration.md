# Phase 5: Frontend Integration

## Objective
Connect the visual frontend components to the live backend API, replacing mock data with real asynchronous data fetching.

## 1. API Logic Layer (Frontend)

We will use standard `fetch` or `axios`. Given the complexity, a library like `@tanstack/react-query` is highly recommended for caching, loading states, and automatic re-fetching.

> [!IMPORTANT]
> **ID Standardization**: The frontend currently uses `number` IDs (from `Date.now()`). The Backend uses `UUID` (string). **Refactor Frontend to use strings for all IDs (User, Chat, Article)**.

### 1.1 API Client (`lib/api.ts`)
- Base URL configuration (`process.env.NEXT_PUBLIC_API_URL`).
- Interceptors:
    - **Request**: Attach `Authorization: Bearer <token>` automatically from AuthContext.
    - **Response**: Handle 401 (Token Expired) -> Redirect to Login or Refresh Token.

## 2. Feature Integration

### 2.1 Authentication (`contexts/AuthContext.tsx`)
- Replace hardcoded check with API calls to `/auth/login` and `/auth/register`.
- Persist JWT in `localStorage` or `HttpOnly` cookie.
- Fetch user profile (`/users/me`) on app load.

### 2.2 News Feed (`app/news-feed/page.tsx`)
- Replace `newsArticles` mock array.
- Use `useQuery` hook to fetch `/news/feed`.
- **Search/Filter**: Map the frontend state (`searchQuery`, `selectedCategory`, `dateRange`) to API query parameters:
    - `?q=...&category=...&start_date=...`
- **Pagination**: Implement "Load More" using API offsets/pages.

### 2.3 Profile & Preferences (`app/profile/page.tsx`)
- **Read**: Populate form fields from `user.preferences` and `user.profile`.
- **Write**: API call to `/users/me` (PATCH) when "Save" is clicked or toggles are changed.

### 2.4 Chatbot (`app/chatbot`)
- **Sidebar**: Fetch list from `/chat/`.
- **Message List**: Fetch history from `/chat/{id}`.
- **Sending**:
    - POST to `/chat/{id}/message`.
    - Handle **Streaming Response**: Use `ReadableStream` reader in the frontend to append text token-by-token to the UI for that "typing" effect.

### 2.5 Market & Watchlist (`app/market-finance`)
- **Watchlist**: Fetch from `/users/watchlist`.
- **Add/Remove**: API endpoints `/users/watchlist/add`, `/users/watchlist/{symbol}/delete`.
- **Watchlist**: Fetch from `/users/watchlist`.
- **Add/Remove**: API endpoints `/users/watchlist/add`, `/users/watchlist/{symbol}/delete`.
- **Market Data**:
    - **Proxy**: Do NOT call Finnhub directly from the client (exposes API keys).
    - Create a backend endpoint `GET /market/quotes?symbols=AAPL,BTC` that fetches from Finnhub (cached in `market_quotes` table for 1-5 mins) and returns data to frontend.

## 3. Implementation Checklist
- [ ] Create `lib/axios.ts` instance.
- [ ] Update `AuthContext` to use real API.
- [ ] Create `hooks/useNews.ts`, `hooks/useChat.ts`.
- [ ] Refactor `NewsFeed` component to async data.
- [ ] Refactor `Chat` component to handle streams.
- [ ] Verify error handling (Toast notifications on API errors).
