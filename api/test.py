# test_get_filter_inventory_history.py
from datetime import datetime, timedelta
from collections import namedtuple

# === 1. Мок-классы (только данные) ===
InventoryHistory = namedtuple('InventoryHistory', [
    'robot_id', 'product_id', 'quantity', 'zone', 'shelf_number', 'status', 'scanned_at'
])

AIPrediction = namedtuple('AIPrediction', [
    'product_id', 'recommended_order', 'prediction_date'
])

# === 2. Мок-данные ===
def create_mock_inventory():
    now = datetime.now()
    return [
        InventoryHistory("RB-001", "P001", 10, "A", "S1", "OK", now - timedelta(minutes=5)),
        InventoryHistory("RB-001", "P001", 12, "A", "S1", "LOW_STOCK", now - timedelta(minutes=10)),
        InventoryHistory("RB-002", "P002", 5, "B", "S2", "CRITICAL", now - timedelta(minutes=3)),
        InventoryHistory("RB-001", "P003", 20, "A", "S3", "OK", now - timedelta(minutes=7)),
    ]

def create_mock_ai_predictions():
    return {
        "P001": AIPrediction("P001", 15, datetime.now()),
        "P002": AIPrediction("P002", 3, datetime.now() - timedelta(hours=1)),
    }

# === 3. Мок DataBaseManager (без сессий, без query) ===
class MockDB:
    def __init__(self):
        self.inventory = create_mock_inventory()
        self.ai_predictions = create_mock_ai_predictions()

    def get_filter_inventory_history(self, from_date=None, to_date=None, zone=None, shelf=None, status=None, category=None):
        # === ФИЛЬТРАЦИЯ ВРУЧНУЮ ===
        result = []
        for inv in self.inventory:
            if from_date and inv.scanned_at < from_date:
                continue
            if to_date and inv.scanned_at > to_date:
                continue
            if zone and inv.zone != zone:
                continue
            if shelf and inv.shelf_number != shelf:
                continue
            if status and inv.status != status:
                continue

            # === Формируем JSON ===
            item = {
                'robot_id': inv.robot_id,
                'product_id': inv.product_id,
                'quantity': inv.quantity,
                'zone': inv.zone,
                'status': inv.status,
                'scanned_at': inv.scanned_at.isoformat() if inv.scanned_at else None,
            }

            # === AI-предсказание ===
            ai_pred = self.ai_predictions.get(inv.product_id)
            if ai_pred:
                item['recommended_order'] = ai_pred.recommended_order
                item['discrepancy'] = abs(inv.quantity - ai_pred.recommended_order)
            else:
                item['recommended_order'] = 0
                item['discrepancy'] = inv.quantity

            result.append(item)
        return result

# === 4. Создаём мок ===
db = MockDB()

# === 5. ТЕСТЫ ===
if __name__ == "__main__":
    now = datetime.now()

    print("ТЕСТ 1: Все данные")
    result = db.get_filter_inventory_history()
    print(f"→ Найдено: {len(result)}")
    print(result[0] if result else "Пусто")

    print("\nТЕСТ 2: Только зона A")
    result = db.get_filter_inventory_history(zone="A")
    print(f"→ Найдено: {len(result)}")

    print("\nТЕСТ 3: Последние 8 минут")
    result = db.get_filter_inventory_history(from_date=now - timedelta(minutes=8))
    print(f"→ Найдено: {len(result)}")

    print("\nТЕСТ 4: Зона A + статус OK")
    result = db.get_filter_inventory_history(zone="A", status="OK")
    print(f"→ Найдено: {len(result)}")

    print("\nТЕСТ 5: Товар P001 + AI")
    result = db.get_filter_inventory_history(product_id="P001")
    print(f"→ Найдено: {len(result)}")
    if result:
        print(f"   → Расхождение: {result[0]['discrepancy']}")