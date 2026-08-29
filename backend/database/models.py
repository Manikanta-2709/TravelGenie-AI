from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, Text

from backend.database.db import Base


class TravelPlan(Base):
    """SQLAlchemy model for storing generated travel plans."""

    __tablename__ = "travel_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    starting_city = Column(String, nullable=False)
    budget = Column(Float, nullable=False)
    days = Column(Integer, nullable=False)
    interests = Column(JSON, nullable=False)
    travelers = Column(Integer, nullable=False)
    destination = Column(String, nullable=False)
    destination_reason = Column(Text, nullable=True)
    weather = Column(String, nullable=False)
    tips = Column(Text, nullable=False)
    route = Column(JSON, nullable=True)
    itinerary = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        """Serialize model to dictionary."""
        return {
            "id": self.id,
            "starting_city": self.starting_city,
            "budget": self.budget,
            "days": self.days,
            "interests": self.interests,
            "travelers": self.travelers,
            "destination": self.destination,
            "destination_reason": self.destination_reason,
            "weather": self.weather,
            "tips": self.tips,
            "route": self.route,
            "itinerary": self.itinerary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
