from typing import List, Literal, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

class ChatMessageRequest(BaseModel):
    content: str
    article_id: Optional[UUID] = None

class SourceCitation(BaseModel):
    article_id: Optional[UUID] = None
    title: str
    url: str
    source: str

class ChatMessageResponse(BaseModel):
    message_id: UUID
    content: str
    role: Literal["assistant"]
    model: str
    sources: List[SourceCitation]
    created_at: datetime


class ChatSummaryResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class CreateChatRequest(BaseModel):
    title: Optional[str] = None


class UpdateChatRequest(BaseModel):
    title: str


class ChatMessageHistoryItem(BaseModel):
    id: UUID
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime
    sources: List[SourceCitation] = []


class ChatHistoryResponse(BaseModel):
    chat_id: UUID
    messages: List[ChatMessageHistoryItem]


class RAGQueryRequest(BaseModel):
    content: str
    article_id: Optional[UUID] = None


class RAGQueryResponse(BaseModel):
    content: str
    model: str
    sources: List[SourceCitation]

class UpdateSecondaryModelRequest(BaseModel):
    secondary_model_url: str
