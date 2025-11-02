<div style="text-align: center; margin-bottom: 32px;">
  <img src="https://avatars.mds.yandex.net/get-entity_search/9707406/687403000/S600xU" alt="Умный склад — Система мониторинга" style="max-width: 100%; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">
</div>

# Умный склад — Система мониторинга  
**Современная система мониторинга склада с интерактивной картой, умными уведомлениями и аналитикой в реальном времени.**

---

## 👥 **Состав команды**  

<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin: 24px 0;">
  <div style="background: #e3f2fd; padding: 16px; border-radius: 12px; text-align: center; border-left: 4px solid #1976d2; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <strong style="color: #1565c0;">Амплеенков Даниил</strong>
  </div>
  <div style="background: #e8f5e9; padding: 16px; border-radius: 12px; text-align: center; border-left: 4px solid #388e3c; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <strong style="color: #2e7d32;">Горячко Дарья</strong>
  </div>
  <div style="background: #fff3e0; padding: 16px; border-radius: 12px; text-align: center; border-left: 4px solid #f57c00; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <strong style="color: #ef6c00;">Жуков Марк</strong>
  </div>
  <div style="background: #f3e5f5; padding: 16px; border-radius: 12px; text-align: center; border-left: 4px solid #7b1fa2; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <strong style="color: #6a1b9a;">Иванов Кирилл</strong>
  </div>
  <div style="background: #e0f2f1; padding: 16px; border-radius: 12px; text-align: center; border-left: 4px solid #00695c; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
    <strong style="color: #00695c;">Якупов Марат</strong>
  </div>
</div>

---

## 🚀 **Быстрый запуск**

```bash
docker-compose build
docker-compose up -d
```

> **Сервер доступен по адресу:**  
> 🌐 [`http://localhost:3000`](http://localhost:3000)

### 🔐 **Данные для входа** *(можно изменить в `.env`)*  
```
email:    admin@admin.com
password: admin1234
```

---

## 🛠 **Технологический стек**

### **Backend**
```bash
Python 3.8+        – основной язык
FastAPI            – современный веб-фреймворк
PostgreSQL         – реляционная база данных
WebSocket          – реальное время
Pydantic           – валидация данных
Poetry             – управление зависимостями
```

### **Frontend**
```bash
React 18           – UI библиотека
Redux Toolkit      – управление состоянием
Tailwind CSS       – утилитарные стили
React Router       – навигация
Chart.js           – графики и аналитика
Heroicons          – иконки
```

---

# **Система управления складом с роботами**

## **Навигация**
| Страница | Описание |
|---------|---------|
| **/dashboard** | Мониторинг в реальном времени |
| **/history** | История и аналитика |
| **/admin** | Администрирование *(admin/operator)* |
| **/login** | Вход в систему |
| **/forgot-password** | Восстановление пароля |

---

## **/dashboard**  
### **Мониторинг в реальном времени**  
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 16px 0;">
  <div style="background: #f0f7ff; padding: 12px; border-radius: 8px; border-left: 4px solid #2196F3;">
    <strong>Интерактивная SVG-карта</strong><br>
    <small>26×50 зон | Масштабирование + панорамирование</small>
  </div>
  <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; border-left: 4px solid #4CAF50;">
    <strong>Отслеживание роботов</strong><br>
    <small>Позиция и статус в реальном времени</small>
  </div>
  <div style="background: #fff3e0; padding: 12px; border-radius: 8px; border-left: 4px solid #FF9800;">
    <strong>Цветовая индикация</strong><br>
    <small>Зоны и роботы: норма / предупреждение / критично</small>
  </div>
</div>

### **Умная система уведомлений**  
- **Автообнаружение** критических остатков  
- **Всплывающие алерты** с кнопками действия  
- **Подсветка** проблемных зон на карте  

### **Аналитика и AI (Yandex GPT)**  
| Функция | Описание |
|--------|----------|
| **Прогноз на 7 дней** | Остатки товаров с точностью по зонам |
| **Визуализация активности** | Тепловая карта перемещений |
| **Статистика в реальном времени** | Загрузка, оборачиваемость |
| **Рекомендации** | Когда и что пополнить |

---

## **/history**  
### **Фильтры**  
```text
По дате • По зоне • По статусу • По артикулу
```

### **Построение графика**  
> История движения товара за выбранный период  

### **Экспорт**  
```bash
→ Выбрать строки → Скачать: история_инвентаризации.xlsx
```

---

## **/admin** *(только admin/operator)*  
<div style="display: flex; flex-wrap: wrap; gap: 16px; margin: 16px 0;">
  <div style="flex: 1; min-width: 200px; background: #f9f0ff; padding: 16px; border-radius: 10px; border: 1px solid #e0c3fc;">
    <strong>Управление товарами</strong><br>
    <small>+ Добавить товар<br>− Удалить товар</small>
  </div>
  <div style="flex: 1; min-width: 200px; background: #e8f5e9; padding: 16px; border-radius: 10px; border: 1px solid #c8e6c9;">
    <strong>Управление роботами</strong><br>
    <small>+ Добавить робота<br>− Удалить робота</small>
  </div>
  <div style="flex: 1; min-width: 200px; background: #fff8e1; padding: 16px; border-radius: 10px; border: 1px solid #ffe082;">
    <strong>Управление пользователями</strong><br>
    <small>+ Добавить пользователя<br>− Удалить пользователя</small>
  </div>
</div>

---

## **/login & /forgot-password**  
- **Безопасный вход**  
- **Восстановление пароля** по email  

---

## **Пользовательский интерфейс**  
```css
Адаптивный • Mobile-first
Темная / Светлая тема
Material Design 3
Интуитивная навигация
```

<div style="text-align: center; margin: 32px 0; font-style: italic; color: #666;">
  Современный склад — под полным контролем.
</div>
