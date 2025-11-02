from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Annotated
from app.api.v1.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.dependencies import access_level, CurrentUser
from app.db.DataBaseManager import db as async_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate, _: Annotated[CurrentUser, Depends(access_level)]
):
    """Создать новый продукт."""
    logger.info(f"Creating product with ID: {product.id}")
    product_id = await async_db.add_product(
        id=product.id,
        name=product.name,
        category=product.category,
        min_stock=product.min_stock,
        optimal_stock=product.optimal_stock,
    )
    if not product_id:
        logger.warning(f"Failed to create product with ID: {product.id}")
        raise HTTPException(status_code=400, detail="Failed to create product")

    created_product = await async_db.get_product(product_id)
    # ИСПРАВЛЕНО: Заменяем from_attributes на model_validate
    return ProductResponse.model_validate(created_product)


@router.get("/", response_model=List[ProductResponse])
async def get_all_products(
    _: Annotated[CurrentUser, Depends(access_level)],
    search: Optional[str] = Query("", description="Search by name or category"),
):
    """Получить список всех продуктов с возможностью поиска."""
    logger.info(f"Fetching all products with search term: '{search}'")
    all_products = await async_db.get_all_products()
    if search:
        filtered_products = [
            p
            for p in all_products
            if search.lower() in p.name.lower() or search.lower() in p.category.lower()
        ]
        logger.info(f"Found {len(filtered_products)} products matching search.")
        return filtered_products
    logger.info(f"Found {len(all_products)} products in total.")
    return all_products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str, _: Annotated[CurrentUser, Depends(access_level)]
):
    """Получить продукт по ID."""
    logger.info(f"Fetching product with ID: {product_id}")
    product = await async_db.get_product(product_id)
    if not product:
        logger.warning(f"Product with ID {product_id} not found.")
        raise HTTPException(status_code=404, detail="Product not found")
    # ИСПРАВЛЕНО: Заменяем from_attributes на model_validate
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    _: Annotated[CurrentUser, Depends(access_level)],
):
    """Обновить данные продукта."""
    logger.info(f"Updating product with ID: {product_id}")
    update_data = product_update.model_dump(exclude_unset=True)
    product = await async_db.update_product(product_id, **update_data)
    if not product:
        logger.warning(
            f"Failed to update product with ID {product_id}. Product not found."
        )
        raise HTTPException(status_code=404, detail="Product not found")
    # ИСПРАВЛЕНО: Заменяем from_attributes на model_validate
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str, _: Annotated[CurrentUser, Depends(access_level)]
):
    """Удалить продукт."""
    logger.info(f"Deleting product with ID: {product_id}")
    success = await async_db.delete_product(product_id)
    if not success:
        logger.warning(
            f"Failed to delete product with ID {product_id}. Product not found."
        )
        raise HTTPException(status_code=404, detail="Product not found")
    logger.info(f"Successfully deleted product with ID: {product_id}")
    return {"status": "success", "message": "Product deleted successfully"}
