# Import all models here so Alembic can discover them
from app.core.database import Base
from app.models.user import User
from app.models.article import Article, ArticleEmbedding
from app.models.chat import Chat, Message
from app.models.interaction import Bookmark, Watchlist
from app.models.market import MarketQuote
