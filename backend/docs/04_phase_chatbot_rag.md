# Phase 4: Chatbot & RAG (Retrieval-Augmented Generation)

## Objective
Implement an intelligent chatbot that uses the news database as context to answer user questions grounded in facts using the Gemini API.

## 1. RAG Architecture

### 1.1 Context Retrieval
- **Input**: User message history + Current question.
- **Rewriting (Optional)**: Use LLM to rewrite the query to be standalone.
- **Search**:
    - Generate embedding for the question.
    - Query `article_embeddings` for top K (e.g., 5) most relevant articles.
    - Filtering: Optionally filter by "last 7 days" if the query implies recency.

### 1.2 Prompt Engineering
- Construct a system prompt:
    ```text
    You are Quantum AI, a helpful news assistant.
    Use the following context articles to answer the user's question.
    If the answer is not in the context, say you don't know based on the provided news.
    Context:
    {context_data}
    
    User Question: {question}
    ```

### 1.3 LLM Integration (Gemini)
- **Library**: `google-generativeai`.
- **Model**: `gemini-1.5-flash` or `gemini-1.5-pro` (Flash is faster/cheaper for chat).
- **Streaming**: The response should be streamed back to the frontend for a responsive UX.

## 2. Conversation Management

### 2.1 Chat History
- Frontend sends `chat_id`.
- Backend retrieves strict history (last N messages) to maintain conversation context within the prompt if needed, OR relies on the client to send context.
- *Decision*: We will store full history in DB (`messages` table) and retrieve the last 10 messages to append to the prompt context window.

### 2.2 Persistence
- Every user message and AI response must be saved to the `messages` table asynchronously.
- Update `chats.updated_at` on new messages.

## 3. API Endpoints (`api/endpoints/chat.py`)

- `POST /chat/`: Create a new chat session.
- `GET /chat/`: List all user chats (for sidebar).
- `GET /chat/{id}`: Get message history for a chat.
- `DELETE /chat/{id}`: Delete a chat.
- `POST /chat/{id}/message`:
    - Input: `content`.
    - Output: Stream of text (Server-Sent Events or Chunked Transfer).
    - Logic:
        1. Save User Msg.
        2. Run RAG Pipeline (Embed -> Search -> Prompt -> Generate).
        3. Save AI Msg (accumulated text).
        4. Return response.

## 4. Implementation Checklist
- [ ] Install `google-generativeai`.
- [ ] Configure `GEMINI_API_KEY`.
- [ ] Implement `services/rag.py`:
    - `retrieve_context(query)`.
    - `generate_response(query, context, history)`.
- [ ] Create Chat Router.
- [ ] Implement StreamingResponse for real-time typing effect.
