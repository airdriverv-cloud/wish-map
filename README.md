# Карта желаний — сайт

Одностраничный статический сайт к персональной карте желаний Виктора.

## Локальный запуск

```powershell
cd wish-map
python -m http.server 8080
```

Открыть http://127.0.0.1:8080/

## Структура

- `index.html` — разметка
- `style.css` — стили, адаптив
- `script.js` — табы «лицевая/обратная», лайтбокс, меню, появление блоков
- `assets/fonts/` — Cormorant Garamond и Manrope (OFL)
- `assets/img/` — веб-версии карты и карточек
- `assets/karta-zhelaniy-viktor.pdf` — двухстраничный PDF A4

## Публикация

GitHub Pages: ветка `main`, корень репозитория. Файл `.nojekyll` уже добавлен.

Сайт закрыт от индексации через `<meta name="robots">` и `robots.txt`, но доступен по прямой ссылке.
