from sqlalchemy import Column, String, DateTime, Float, func
from app.core.database import Base

class MarketQuote(Base):
    __tablename__ = "market_quotes"

    symbol = Column(String, primary_key=True, index=True)
    price = Column(Float, nullable=False)
    change = Column(Float, nullable=False)
    change_percent = Column(Float, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
