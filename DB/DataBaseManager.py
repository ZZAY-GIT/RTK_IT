from DB.models import Base, User, Robot, Product, InventoryHistory, AIPrediction
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import logging
import bcrypt

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

    def add_user(self, email, password_hash, name, role):
        with self.DBSession() as _s:
            record = (
                _s.query(self.Page)
                .filter(self.Page.session_id == self.user_session_id)
                .filter(self.Page.process_type == process_type)
                .filter(self.Page.court == court)
                .filter(self.Page.page_number == page_number)
                .filter(self.Page.year == year)
                .first()
            )
            
        if not record:
            return None

        self._commit_record(record)
        
    def get_user_password(self, email: str) -> str | None:
        with self.DBSession() as _s:
            record = (
                _s.query(self.User)
                .filter(self.User.email == email)
                .first()
            )
        if not record:
            return None
        record = str(record.password_hash)

        return record
    



def hash_password(password: str) -> bytes:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed

def verify_password(password: str, hashed: bytes) -> bool:
    password_bytes = password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed)
