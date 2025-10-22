import time
import random
from datetime import datetime


class RealRobotEmulator:
    def __init__(self, robot_id, api_url):
        self.robot_id = robot_id
        self.api_url = api_url
        self.battery = 100
        self.current_zone = 'A'
        self.current_row = 1
        self.current_shelf = 1

        # Список товаров для сканирования
        self.products = [
            {"id": "TEL-4567", "name": "Роутер RT-AC68U"},
            {"id": "TEL-8901", "name": "Модем DSL-2640U"},
            {"id": "TEL-2345", "name": "Коммутатор SG-108"},
            {"id": "TEL-6789", "name": "IP-телефон T46S"},
            {"id": "TEL-3456", "name": "Кабель UTP Cat6"}
        ]

    def generate_scan_data(self):
        """Генерируем данные сканирования товаров"""
        # Берем случайные товары (от 1 до 3 штук)
        scanned_products = random.sample(self.products, k=random.randint(1, 3))
        scan_results = []

        for product in scanned_products:
            quantity = random.randint(5, 100)  # Случайное количество

            # Определяем статус товара
            if quantity > 20:
                status = "OK"
            elif quantity > 10:
                status = "LOW_STOCK"
            else:
                status = "CRITICAL"

            scan_results.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "quantity": quantity,
                "status": status
            })

        return scan_results

    def move_to_next_location(self):
        """Робот перемещается по складу"""
        # Перемещаемся по полкам
        self.current_shelf += 1
        if self.current_shelf > 5:  # Упростим до 5 полок
            self.current_shelf = 1
            self.current_row += 1
            if self.current_row > 3:  # Упростим до 3 рядов
                self.current_row = 1
                # Переход к следующей зоне
                self.current_zone = chr(ord(self.current_zone) + 1)
                if ord(self.current_zone) > ord('C'):  # Упростим до зон A, B, C
                    self.current_zone = 'A'

        # Тратим батарею
        self.battery -= random.uniform(0.5, 2)
        if self.battery < 15:
            self.battery = 100  # Заряжаемся
            print(f" {self.robot_id} заряжается!")

    def send_data(self):
        """Отправляем данные на сервер"""
        data = {
            "robot_id": self.robot_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "location": {
                "zone": self.current_zone,
                "row": self.current_row,
                "shelf": self.current_shelf
            },
            "scan_results": self.generate_scan_data(),
            "battery_level": round(self.battery, 1),
            "next_checkpoint": f"{self.current_zone}-{self.current_row}-{self.current_shelf + 1}"
        }

        print(f"📤 {self.robot_id} отправляет данные:")
        print(f"    Локация: {self.current_zone}-{self.current_row}-{self.current_shelf}")
        print(f"    Батарея: {self.battery:.1f}%")
        print(f"    Отсканировано товаров: {len(data['scan_results'])}")

        return data

    def run_once(self):
        """Один цикл работы робота (для тестирования)"""
        data = self.send_data()
        self.move_to_next_location()
        return data