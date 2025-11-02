import time
import random
from datetime import datetime, timezone
import threading
import requests
import os
import logging

# Shared state for occupied positions
occupied_positions = set()
position_lock = threading.Lock()

class RobotEmulator:
    def __init__(self, robot_id, api_url):
        self.robot_id = robot_id
        self.api_url = api_url
        self.battery = random.uniform(20, 100)  # Random initial battery between 20% and 100%
        self.charging = False
        self.products = self.generate_products(30)  # Generate 30 random products
        self.assign_unique_start_position()



    def generate_products(self, num_products):
        products = []
        for i in range(num_products):
            product_id = f"TEL-{random.randint(1000, 9999)}"
            product_names = [
                "Роутер RT-AC", "Модем DSL-", "Коммутатор SG-", "IP-телефон T",
                "Кабель UTP Cat", "WiFi адаптер USB-", "Свитч PoE-", "Антенна Omni-",
                "Firewall Appliance ", "VoIP Gateway ", "Ethernet Switch ", "Fiber Optic Cable ",
                "Patch Panel ", "Network Card ", "Powerline Adapter ", "Media Converter ",
                "NAS Storage ", "IP Camera ", "Access Point ", "Repeater Extender ",
                "Bluetooth Dongle ", "Satellite Modem ", "LTE Router ", "Mesh System ",
                "Gaming Router ", "Enterprise Switch ", "SFP Module ", "Rack Mount ",
                "Surge Protector ", "KVM Switch "
            ]
            name = random.choice(product_names) + str(random.randint(100, 999))
            products.append({"id": product_id, "name": name})
        return products

    def assign_unique_start_position(self):
        zones = [chr(i) for i in range(ord('A'), ord('E') + 1)]  # A to E
        while True:
            self.current_zone = random.choice(zones)
            self.current_row = random.randint(1, 20)
            self.current_shelf = random.randint(1, 10)
            position = (self.current_zone, self.current_row, self.current_shelf)
            with position_lock:
                if position not in occupied_positions:
                    occupied_positions.add(position)
                    break

    def generate_scan_data(self):
        if self.charging:
            return []
        scanned_products = random.sample(self.products, k=random.randint(1, 3))
        scan_results = []

        for product in scanned_products:
            quantity = random.randint(1, 150)
            # Статусы как в ТЗ: OK, LOW_STOCK, CRITICAL
            if quantity > 50:
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
        if self.charging:
            return

        current_position = (self.current_zone, self.current_row, self.current_shelf)
        with position_lock:
            if current_position in occupied_positions:
                occupied_positions.remove(current_position)

        #next position
        attempts = 0
        while attempts < 100:  # Prevent infinite loop
            self.current_shelf += 1
            if self.current_shelf > 10:
                self.current_shelf = 1
                self.current_row += 1
                if self.current_row > 20:
                    self.current_row = 1
                    zone_index = ord(self.current_zone) - ord('A')
                    self.current_zone = chr(ord('A') + (zone_index + 1) % 5)  # Cycle A to E

            new_position = (self.current_zone, self.current_row, self.current_shelf)
            with position_lock:
                if new_position not in occupied_positions:
                    occupied_positions.add(new_position)
                    break
            attempts += 1


        if attempts >=100:
            logging.info(f"{self.robot_id}: Could not find unique position after 100 attempts!")


        # Расход батареи
        self.battery -= random.uniform(0.1, 0.5)

    def handle_charging(self):
        if self.battery < 20 and not self.charging:
            self.charging = True
            logging.info(f"{self.robot_id} entered charging mode at {self.battery:.1f}%")

        if self.charging:
            self.battery += random.uniform(5, 10)
            if self.battery >= 100:
                self.battery = 100
                self.charging = False
                logging.info(f"{self.robot_id} fully charged and resuming operations")
            return True
        return False

    def send_data(self):
        

        data = {
            "robot_id": self.robot_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "location": {
                "zone": self.current_zone,
                "row": self.current_row,
                "shelf": self.current_shelf
            },
            "scan_results": self.generate_scan_data(),
            "battery_level": round(self.battery, 1),
        }

        try:
            response = requests.post(
                f"{self.api_url}/api/robots/data",
                json=data,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                logging.info(f" {self.robot_id}: Данные отправлены успешно!")
                logging.info(f" Location: {self.current_zone}-{self.current_row}-{self.current_shelf}")
                logging.info(f" Battery: {self.battery:.1f}% |  {len(data['scan_results'])} товаров")
            else:
                logging.info(f" {self.robot_id}: Ошибка {response.status_code}")

        except Exception as e:
            logging.info(f" {self.robot_id}: Ошибка подключения: {e}")

    def run(self):
        """Основной цикл работы робота"""
        logging.info(f" Робот {self.robot_id} запущен!")

        while True:
            is_charging = self.handle_charging()
            if not is_charging:
                self.send_data()
                self.move_to_next_location()

            else:
                logging.info(f"{self.robot_id} charging...{self.battery:.1f}%")
            time.sleep(10)  # Отправка каждые 10 секунд

def generate_random_robot_id():
    robot_id = f"RB-{random.randint(1000, 9999)}"
    return robot_id

if __name__ == "__main__":
    num_robots_str = os.getenv("NUM_ROBOTS", "12")
    try:
        num_robots = int(num_robots_str)
    except ValueError:
        logging.info(f"Ошибка: NUM_ROBOTS должно быть числом, получено '{num_robots_str}'. Запускаю 1 робота.")
        num_robots = 1
    robots = []
    for i in range(num_robots):
        robot_id = generate_random_robot_id()
        api_url = os.getenv("API_URL", "http://localhost:8000")
        robots.append(RobotEmulator(robot_id, api_url))

    threads = []
    for robot in robots:
        thread = threading.Thread(target=robot.run)
        thread.daemon = True
        thread.start()
        threads.append(thread)

    # Держим программу активной
    while True:
        time.sleep(60)
