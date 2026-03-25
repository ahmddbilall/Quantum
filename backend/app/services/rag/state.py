from typing import TypedDict, List, Optional
from langchain_core.messages import BaseMessage

class MetadataFilters(TypedDict, total=False):
    category:   Optional[str]
    source:     Optional[str]
    date_range: Optional[int]
    article_id: Optional[str]

class GraphState(TypedDict):
    messages:            List[BaseMessage]
    filters:             MetadataFilters
    retrieved_articles:  List[dict]
    generation:          str
    hallucination_check: str
    retry_count:         int
