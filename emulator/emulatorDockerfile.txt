# Используем официальный Python образ
FROM python:3.12-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только необходимые файлы
COPY emulator/emulator.py .

# Устанавливаем зависимости
RUN pip install --no-cache-dir requests

# Запускаем эмулятор
CMD ["python", "emulator.py"]