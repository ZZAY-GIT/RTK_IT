from pydantic import BaseModel

class RedisDB(BaseModel):
    cache: int = 0

class RedisConfig(BaseModel):
    host: str = "localhost"
    port: int = 6666
    db: RedisDB = RedisDB()

class CacheNamespace(BaseModel):
    predict_list: str = "predict_list"

class CacheConfig(BaseModel):
    prefix: str = "fastapi-cache"
    namespace: CacheNamespace = CacheNamespace()