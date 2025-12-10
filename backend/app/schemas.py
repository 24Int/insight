from uuid import UUID
from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None


class UserBase(BaseModel):
    username: str


class UserInDB(UserBase):
    id: UUID

    class Config:
        from_attributes = True


class CatalogBase(BaseModel):
    name: str
    image: str | None = None


class CatalogCreate(BaseModel):
    name: str


class CatalogUpdate(BaseModel):
    name: str | None = None
    image: str | None = None


class CatalogOut(CatalogBase):
    id: UUID

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    title: str
    price: Decimal = Field(..., ge=0)
    quantity: int = Field(0, ge=0)
    description: str | None = None
    image: str | None = None
    catalog_id: UUID | None = None


class ProductCreate(BaseModel):
    title: str
    price: Decimal = Field(..., ge=0)
    quantity: int = Field(0, ge=0)
    description: str | None = None
    catalog_id: UUID | None = None


class ProductUpdate(BaseModel):
    title: str | None = None
    price: Decimal | None = Field(None, ge=0)
    quantity: int | None = Field(None, ge=0)
    description: str | None = None
    image: str | None = None
    catalog_id: UUID | None = None


class ProductOut(ProductBase):
    id: UUID

    class Config:
        from_attributes = True


class RequestBase(BaseModel):
    name: str
    phone: str


class RequestCreate(RequestBase):
    pass


class RequestOut(RequestBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


