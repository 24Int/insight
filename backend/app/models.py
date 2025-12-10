import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))


class Catalog(Base):
    __tablename__ = "catalogs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255))
    image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    
    # Relationship
    products: Mapped[list["Product"]] = relationship("Product", back_populates="catalog")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255))
    price: Mapped[Numeric] = mapped_column(Numeric(10, 2))
    quantity: Mapped[int] = mapped_column(default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image: Mapped[str | None] = mapped_column(String(512), nullable=True)
    catalog_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalogs.id"), nullable=True
    )
    
    # Relationship
    catalog: Mapped["Catalog | None"] = relationship("Catalog", back_populates="products")


class Request(Base):
    __tablename__ = "requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


