import requests
import time
from api.simple_version.emulator_simple import RealRobotEmulator


def test_single_robot():
    """Тестируем одного робота"""
    print("🤖 Запускаем тест НАСТОЯЩЕГО робота...")

    # Создаем робота
    robot = RealRobotEmulator("RB-001", "http://localhost:8000")

    # Отправляем 10 сообщений
    for i in range(10):
        print(f"\n📨 Отправка сообщения {i + 1}/10:")

        # Генерируем и отправляем данные
        data = robot.send_data()

        try:
            # Отправляем на сервер
            response = requests.post(
                "http://localhost:8000/api/robots/data",
                json=data
            )

            if response.status_code == 200:
                print("   ✅ Успешно отправлено на сервер!")
            else:
                print(f"   ❌ Ошибка: {response.status_code}")

        except Exception as e:
            print(f"   ❌ Не могу подключиться к серверу: {e}")
            print("   💡 Убедитесь что сервер запущен!")
            break

        # Перемещаем робота
        robot.move_to_next_location()

        # Ждем 3 секунды
        time.sleep(3)

    print("\n🎉 Тестирование завершено!")


def test_multiple_robots():
    """Тестируем нескольких роботов"""
    print("🤖🤖 Запускаем несколько роботов...")

    robots = [
        RealRobotEmulator("RB-001", "http://localhost:8000"),
        RealRobotEmulator("RB-002", "http://localhost:8000"),
        RealRobotEmulator("RB-003", "http://localhost:8000")
    ]

    # Каждый робот отправляет по 5 сообщений
    for i in range(5):
        print(f"\n📨 Цикл {i + 1}/5:")

        for robot in robots:
            data = robot.send_data()

            try:
                response = requests.post(
                    "http://localhost:8000/api/robots/data",
                    json=data
                )

                if response.status_code == 200:
                    print(f"   ✅ {robot.robot_id} отправил данные")
                else:
                    print(f"   ❌ {robot.robot_id} ошибка: {response.status_code}")

            except Exception as e:
                print(f"   ❌ {robot.robot_id} ошибка подключения: {e}")

            robot.move_to_next_location()

        time.sleep(4)


if __name__ == "__main__":
    print("Выберите тест:")
    print("1 - Один робот")
    print("2 - Несколько роботов")

    choice = input("Введите 1 или 2: ")

    if choice == "1":
        test_single_robot()
    else:
        test_multiple_robots()