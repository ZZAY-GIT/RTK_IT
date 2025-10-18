from DB.models import Base, User, Robot, Product, InventoryHistory, AIPrediction
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import logging

class DataBaseManager:
    def __init__(self, conn_str: str):
        self.conn_str = conn_str
        self.engine = create_engine(conn_str, echo=False)
        self.DBSession = sessionmaker(bind=self.engine)
        self.create_tables()

    def create_tables(self):
        Base.metadata.create_all(self.engine)
        self.User = User
        self.Robot = Robot
        self.Product = Product
        self.InventoryHistory = InventoryHistory
        self.AIPrediction = AIPrediction

    def _commit_record(self, record):
        try:
            with self.DBSession() as _s:
                _s.add(record)
                _s.commit()
                logging.debug("Record added")
        except Exception as e:
            logging.error(f"Error adding record {e}")
