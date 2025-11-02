# app/db/__init__.py
from .DataBaseManager import db
from .models import User, Product, Robot, InventoryHistory, AIPrediction

__all__ = ["db", "User", "Product", "Robot", "InventoryHistory", "AIPrediction"]
