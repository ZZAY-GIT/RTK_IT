import time
import random
from datetime import datetime


class RobotEmulator:
    def __init__(self, robot_id, api_url):
        self.robot_id = robot_id
        self.api_url = api_url
        self.battery = 100
        self.current_zone = 'A'
        self.current_row = 1
        self.current_shelf = 1

        # Тестовые товары как в ТЗ
        self.products = [
            {"id": "TEL-4567", "name": "Роутер RT-AC68U"},
            {"id": "TEL-8901", "name": "Модем DSL-2640U"},
            {"id": "TEL-2345", "name": "Коммутатор SG-108"},
            {"id": "TEL-6789", "name": "IP-телефон T46S"},
            {"id": "TEL-3456", "name": "Кабель UTP Cat6"}
        ]

    def generate_scan_data(self):
        scanned_products = random.sample(self.products, k=random.randint(1, 3))
        scan_results = []

        for product in scanned_products:
            quantity = random.randint(5, 100)
            # Статусы как в ТЗ: OK, LOW_STOCK, CRITICAL
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
        """Перемещение робота по складу как в ТЗ"""
        self.current_shelf += 1
        if self.current_shelf > 10:
            self.current_shelf = 1
            self.current_row += 1
            if self.current_row > 20:
                self.current_row = 1
                # Переход к следующей зоне
                self.current_zone = chr(ord(self.current_zone) + 1)
                if ord(self.current_zone) > ord('E'):
                    self.current_zone = 'A'

        # Расход батареи
        self.battery -= random.uniform(0.1, 0.5)
        if self.battery < 20:
            self.battery = 100  # Зарядка
            print(f"🔋 {self.robot_id} заряжается!")

    def send_data(self):
        import requests

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

        try:
            response = requests.post(
                f"{self.api_url}/api/robots/data",
                json=data,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                print(f" {self.robot_id}: Данные отправлены успешно!")
                print(f"    {self.current_zone}-{self.current_row}-{self.current_shelf}")
                print(f"    {self.battery:.1f}% |  {len(data['scan_results'])} товаров")
            else:
                print(f" {self.robot_id}: Ошибка {response.status_code}")

        except Exception as e:
            print(f" {self.robot_id}: Ошибка подключения: {e}")

    def run(self):
        """Основной цикл работы робота"""
        print(f" Робот {self.robot_id} запущен!")

        while True:
            self.send_data()
            self.move_to_next_location()
            time.sleep(10)  # Отправка каждые 10 секунд


def test_single_robot():
    print("Тестируем одного робота...")
    robot = RobotEmulator("RB-001", "http://localhost:8000")

    # Отправляем 5 сообщений для теста
    for i in range(5):
        print(f"\n Цикл {i + 1}/5:")
        robot.send_data()
        robot.move_to_next_location()
        time.sleep(5)


if __name__ == "__main__":
    print("Выберите режим:")
    print("1 - Тестовый режим (5 сообщений)")
    print("2 - Бесконечный режим")

    choice = input("Введите 1 или 2: ")

    if choice == "1":
        test_single_robot()
    else:
        # Запускаем 3 роботов
        import threading

        robots = [
            RobotEmulator("RB-001", "http://localhost:8000"),
            RobotEmulator("RB-002", "http://localhost:8000"),
            RobotEmulator("RB-003", "http://localhost:8000")
        ]

        for robot in robots:
            thread = threading.Thread(target=robot.run)
            thread.daemon = True
            thread.start()

        # Держим программу активной
        while True:
            time.sleep(60)