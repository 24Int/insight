import os
import shutil
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from . import auth, models, schemas
from .config import settings
from .database import Base, engine, get_db

# Создаём директорию для загруженных файлов
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Insight API", version="1.0.0")

# CORS настройки для production
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "https://24int.ru,http://24int.ru,http://localhost:4000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статическая раздача загруженных файлов
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
def on_startup() -> None:
    """
    Инициализация схемы БД и демонстрационных данных.
    Если старая схема (например, нет столбца quantity), аккуратно пересоздаём таблицы.
    """
    # Базовое создание таблиц (если их ещё нет)
    Base.metadata.create_all(bind=engine)

    db = next(get_db())
    try:
        # Проверяем, что структура таблиц соответствует моделям
        try:
            _ = db.query(models.Product).first()
        except SQLAlchemyError:
            # Старый формат таблиц — пересоздаём все таблицы под актуальные модели.
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        # Админ-пользователь
        user = (
            db.query(models.User)
            .filter(models.User.username == settings.admin_username)
            .first()
        )
        if user is None:
            hashed_password = auth.get_password_hash(settings.admin_password)
            admin = models.User(
                username=settings.admin_username,
                password=hashed_password,
            )
            db.add(admin)
            db.commit()

        # Демонстрационные товары для лэндинга — только если таблица пуста
        has_products = db.query(models.Product).first() is not None
        if not has_products:
            demo_products: list[models.Product] = [
                models.Product(
                    title="Сухая смесь РУСЕАН Штукатурка гипсовая, 30 кг",
                    price=420,
                    quantity=260,
                    description=(
                        "Белая гипсовая штукатурка для машинного и ручного "
                        "нанесения по бетону и кирпичу. Идеальна для выравнивания "
                        "стен в новостройках."
                    ),
                    image="https://images.pexels.com/photos/5691605/pexels-photo-5691605.jpeg",
                ),
                models.Product(
                    title="Перчатки трикотажные с ПВХ, плотность 10 класс (уп. 120 пар)",
                    price=1550,
                    quantity=540,
                    description=(
                        "Рабочие перчатки для общестроительных работ. "
                        "Усиленное ПВХ-покрытие для уверенного хвата инструмента."
                    ),
                    image="https://images.pexels.com/photos/8961065/pexels-photo-8961065.jpeg",
                ),
                models.Product(
                    title="Диск отрезной по металлу 125×1.0×22.23 для УШМ",
                    price=45,
                    quantity=3200,
                    description=(
                        "Тонкий отрезной диск по стали и нержавейке. "
                        "Ровный рез, минимальный нагрев заготовки."
                    ),
                    image="https://images.pexels.com/photos/1216544/pexels-photo-1216544.jpeg",
                ),
                models.Product(
                    title="Шурупы по бетону 7.5×112 (100 шт.)",
                    price=980,
                    quantity=850,
                    description=(
                        "Надёжный крепёж для фасадных и внутренних работ. "
                        "Подходит для монтажа окон, дверных рам и подсистем."
                    ),
                    image="https://images.pexels.com/photos/162557/fasteners-screw-metal-screwdriver-162557.jpeg",
                ),
                models.Product(
                    title="Наливной пол цементный, слой 5–80 мм, 25 кг",
                    price=670,
                    quantity=190,
                    description=(
                        "Самовыравнивающаяся смесь для полов в жилых и коммерческих "
                        "помещениях. Совместима с тёплыми полами."
                    ),
                    image="https://images.pexels.com/photos/6474410/pexels-photo-6474410.jpeg",
                ),
                models.Product(
                    title="Профессиональный перфоратор 900 Вт, SDS+",
                    price=7890,
                    quantity=36,
                    description=(
                        "Трёхрежимный перфоратор для монтажных и общестроительных работ. "
                        "Поддержка SDS+ и плавный пуск."
                    ),
                    image="https://images.pexels.com/photos/4792479/pexels-photo-4792479.jpeg",
                ),
            ]
            db.add_all(demo_products)
            db.commit()
    finally:
        db.close()


@app.post("/auth/login", response_model=schemas.Token, tags=["auth"])
async def login(token: schemas.Token = Depends(auth.login_for_access_token)):
    # login_for_access_token уже возвращает Token, просто пробрасываем
    return token


@app.get("/products", response_model=list[schemas.ProductOut], tags=["products"])
def list_products(catalog_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Product)
    if catalog_id:
        query = query.filter(models.Product.catalog_id == catalog_id)
    products = query.all()
    return products


@app.get(
    "/products/{product_id}",
    response_model=schemas.ProductOut,
    tags=["products"],
)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return product


@app.post(
    "/products",
    response_model=schemas.ProductOut,
    status_code=status.HTTP_201_CREATED,
    tags=["products"],
)
async def create_product(
    title: str = Form(...),
    price: str = Form(...),
    quantity: str = Form("0"),
    description: str | None = Form(None),
    catalog_id: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    from decimal import Decimal
    
    image_path = None
    if image:
        # Сохраняем файл
        file_ext = Path(image.filename).suffix if image.filename else ".jpg"
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        image_path = f"/uploads/{file_name}"
    
    product_data = {
        "title": title,
        "price": Decimal(price),
        "quantity": int(quantity) if quantity else 0,
        "description": description,
        "catalog_id": uuid.UUID(catalog_id) if catalog_id and catalog_id.strip() else None,
        "image": image_path,
    }
    
    product = models.Product(**product_data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.put("/products/{product_id}", response_model=schemas.ProductOut, tags=["products"])
async def update_product(
    product_id: str,
    title: str | None = Form(None),
    price: str | None = Form(None),
    quantity: str | None = Form(None),
    description: str | None = Form(None),
    catalog_id: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    from decimal import Decimal
    
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    if title is not None:
        product.title = title
    if price is not None:
        product.price = Decimal(price)
    if quantity is not None:
        product.quantity = int(quantity)
    if description is not None:
        product.description = description
    if catalog_id is not None:
        product.catalog_id = uuid.UUID(catalog_id) if catalog_id and catalog_id.strip() else None
    
    if image:
        # Удаляем старое изображение, если есть
        if product.image:
            old_path = UPLOAD_DIR / Path(product.image).name
            if old_path.exists():
                old_path.unlink()
        
        # Сохраняем новое изображение
        file_ext = Path(image.filename).suffix if image.filename else ".jpg"
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        product.image = f"/uploads/{file_name}"

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["products"],
)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    
    # Удаляем изображение, если есть
    if product.image:
        image_path = UPLOAD_DIR / Path(product.image).name
        if image_path.exists():
            image_path.unlink()
    
    db.delete(product)
    db.commit()
    return None


@app.post(
    "/requests",
    response_model=schemas.RequestOut,
    status_code=status.HTTP_201_CREATED,
    tags=["requests"],
)
def create_request(
    request_in: schemas.RequestCreate,
    db: Session = Depends(get_db),
):
    """
    Публичный эндпоинт: создание заявки (имя + телефон).
    """
    req = models.Request(**request_in.model_dump())
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@app.get(
    "/requests",
    response_model=list[schemas.RequestOut],
    tags=["requests"],
)
def list_requests(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    """
    Список всех заявок — только для авторизованного пользователя (админ).
    """
    return db.query(models.Request).all()


# ========== CATALOGS ENDPOINTS ==========

@app.get("/catalogs", response_model=list[schemas.CatalogOut], tags=["catalogs"])
def list_catalogs(db: Session = Depends(get_db)):
    catalogs = db.query(models.Catalog).all()
    return catalogs


@app.get(
    "/catalogs/{catalog_id}",
    response_model=schemas.CatalogOut,
    tags=["catalogs"],
)
def get_catalog(catalog_id: str, db: Session = Depends(get_db)):
    catalog = db.query(models.Catalog).filter(models.Catalog.id == catalog_id).first()
    if catalog is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Catalog not found"
        )
    return catalog


@app.post(
    "/catalogs",
    response_model=schemas.CatalogOut,
    status_code=status.HTTP_201_CREATED,
    tags=["catalogs"],
)
async def create_catalog(
    name: str = Form(...),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    image_path = None
    if image:
        # Сохраняем файл
        file_ext = Path(image.filename).suffix if image.filename else ".jpg"
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        image_path = f"/uploads/{file_name}"
    
    catalog = models.Catalog(name=name, image=image_path)
    db.add(catalog)
    db.commit()
    db.refresh(catalog)
    return catalog


@app.put("/catalogs/{catalog_id}", response_model=schemas.CatalogOut, tags=["catalogs"])
async def update_catalog(
    catalog_id: str,
    name: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    catalog = db.query(models.Catalog).filter(models.Catalog.id == catalog_id).first()
    if catalog is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Catalog not found"
        )

    if name is not None:
        catalog.name = name
    
    if image:
        # Удаляем старое изображение, если есть
        if catalog.image:
            old_path = UPLOAD_DIR / Path(catalog.image).name
            if old_path.exists():
                old_path.unlink()
        
        # Сохраняем новое изображение
        file_ext = Path(image.filename).suffix if image.filename else ".jpg"
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        catalog.image = f"/uploads/{file_name}"

    db.add(catalog)
    db.commit()
    db.refresh(catalog)
    return catalog


@app.delete(
    "/catalogs/{catalog_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["catalogs"],
)
def delete_catalog(
    catalog_id: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    catalog = db.query(models.Catalog).filter(models.Catalog.id == catalog_id).first()
    if catalog is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Catalog not found"
        )
    
    # Удаляем изображение, если есть
    if catalog.image:
        image_path = UPLOAD_DIR / Path(catalog.image).name
        if image_path.exists():
            image_path.unlink()
    
    db.delete(catalog)
    db.commit()
    return None


