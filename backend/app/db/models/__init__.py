# app/db/models/__init__.py
from .user import User
from .product import Product
from .robot import Robot
from .inventory import InventoryHistory
from .ai_prediction import AIPrediction

__all__ = ["User", "Product", "Robot", "InventoryHistory", "AIPrediction"]
