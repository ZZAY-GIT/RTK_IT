from DB.models import Base, User, Robot, Product, InventoryHistory, AIPrediction
from sqlalchemy import create_engine

class DataBaseManager:

    def __init__(self, conn=None):
        conn = "postgresql://warehouse_user:secure_password@localhost:5432/warehouse_db"
        self.engine = create_engine(conn)
        self.create_tables()
        
    
    def create_tables(self):
#        Base = declarative_base()

        Base.metadata.create_all(self.engine)
        self.User = User
        self.Robot = Robot
        self.Product = Product
        self.InventoryHistory = InventoryHistory
        self.AIPrediction = AIPrediction
