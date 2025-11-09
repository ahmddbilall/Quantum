# AI Chat Component

A modular, reusable RAG (Retrieval-Augmented Generation) chatbot component for article discussions.

## 📁 Structure

```
aichat/
├── ArticleChatButton.tsx    # Main entry point - floating button + modal
├── ArticleChat.tsx           # Chat container with state management
├── ChatHeader.tsx            # Chat modal header with close button
├── ChatMessages.tsx          # Message list container
├── ChatMessage.tsx           # Individual message component
├── ChatInput.tsx             # Input field with send button
├── TypingIndicator.tsx       # Animated typing indicator
├── types.ts                  # TypeScript interfaces
├── index.ts                  # Export barrel file
└── README.md                 # This file
```

## 🚀 Usage

### Basic Implementation

```tsx
import { ArticleChatButton } from "@/components/aichat";

function NewsDetailPage() {
  return (
    <div>
      {/* Your page content */}

      <ArticleChatButton articleId="123" articleTitle="Your Article Title" />
    </div>
  );
}
```

## 🔧 Components

### ArticleChatButton

The main component that provides the floating action button and handles the modal state.

**Props:**

- `articleId: string` - Unique identifier for the article
- `articleTitle: string` - Title of the article for context

### ArticleChat

The chat interface container that manages messages and AI responses.

**Props:**

- `articleId: string` - Article identifier for RAG context
- `articleTitle: string` - Article title for personalized responses
- `onClose: () => void` - Callback to close the modal

### ChatMessage

Individual message bubble component.

**Props:**

- `message: ChatMessage` - Message object containing id, type, content, timestamp

### ChatInput

Input field with send functionality.

**Props:**

- `currentMessage: string` - Current input value
- `isTyping: boolean` - Whether AI is generating response
- `onMessageChange: (message: string) => void` - Input change handler
- `onSendMessage: () => void` - Send message handler

## 🎨 Features

- ✅ **Modular Architecture** - Each component is independent and reusable
- ✅ **TypeScript Support** - Full type safety with interfaces
- ✅ **Smooth Animations** - Framer Motion for modal and interactions
- ✅ **Responsive Design** - Works on all screen sizes
- ✅ **RAG-Ready** - Structured for easy RAG API integration
- ✅ **Beautiful UI** - Gradient accents, hover effects, and modern design
- ✅ **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line

## 🔌 RAG Integration

The component is designed to work with a RAG backend. Update the `generateAIResponse` function in `ArticleChat.tsx`:

```tsx
async function generateAIResponse(
  message: string,
  articleId: string,
  articleTitle: string
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      articleId,
      articleTitle,
    }),
  });

  const data = await response.json();
  return data.response;
}
```

## 🎯 API Requirements

Your RAG backend should accept:

```typescript
interface ChatRequest {
  message: string; // User's question
  articleId: string; // Article context identifier
  articleTitle: string; // Article title for context
}

interface ChatResponse {
  response: string; // AI-generated response
}
```

## 🎨 Customization

### Styling

All components use Tailwind CSS classes. Modify the classes in each component to match your design system.

### Colors

- Primary: Indigo (can be changed to any Tailwind color)
- Background: Zinc-900
- Text: White/Gray scale

### Animation

Adjust Framer Motion properties in `ArticleChatButton.tsx` for different animation effects.

## 📝 TypeScript Interfaces

```typescript
interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface ArticleChatProps {
  articleId: string;
  articleTitle: string;
}
```

## 🔒 Best Practices

1. **Error Handling** - Add try-catch blocks in API calls
2. **Loading States** - Use the `isTyping` state for loading indicators
3. **Message Validation** - Trim and validate messages before sending
4. **Rate Limiting** - Implement rate limiting for API calls
5. **Context Management** - Maintain conversation context in the backend

## 🚀 Future Enhancements

- [ ] Message history persistence
- [ ] File attachment support
- [ ] Code syntax highlighting
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Export conversation feature
- [ ] Suggested questions
- [ ] Citation/source linking

## 📄 License

This component is part of the Quantum project.
