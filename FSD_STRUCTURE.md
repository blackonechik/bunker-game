# Feature-Sliced Design Structure

Проект реорганизован по методологии FSD (Feature-Sliced Design).

## Структура папок

```
src/
├── app/                # Инициализация приложения
│   ├── providers/      # Провайдеры (Socket, Context)
│   └── styles/         # Глобальные стили
│
├── pages/              # Композиция страниц (в будущем)
│
├── widgets/            # Композитные блоки страниц
│   ├── chat-panel/     # Панель чата
│   ├── player-list/    # Список игроков
│   ├── main-menu/      # Главное меню
│   └── start-screen/   # Стартовый экран
│
├── features/           # Бизнес-фичи
│   ├── room-management/    # Управление комнатами
│   ├── vote-system/        # Система голосования
│   ├── chat/              # Чат
│   ├── card-reveal/       # Открытие карт
│   └── game-flow/         # Игровой процесс
│
├── entities/           # Бизнес-сущности
│   ├── player/         # Игрок
│   ├── room/           # Комната
│   ├── card/           # Карта
│   ├── apocalypse/     # Апокалипсис
│   ├── location/       # Локация
│   ├── session/        # Сессия
│   ├── vote/           # Голосование
│   └── chat-message/   # Сообщение чата
│
└── shared/             # Переиспользуемые модули
    ├── ui/             # UI-kit компоненты
    ├── lib/            # Вспомогательные функции
    ├── api/            # API интеграции (DB, Socket)
    ├── hooks/          # Переиспользуемые хуки
    ├── config/         # Конфигурация
    └── types/          # Общие типы
```

## Правила импортов

Слои импортируются только снизу вверх:
- `app` → `pages` → `widgets` → `features` → `entities` → `shared`

### Примеры:

```typescript
// ✅ Правильно
import { Button } from '@/shared/ui';
import { Player } from '@/entities/player';
import { RoomService } from '@/features/room-management';

// ❌ Неправильно
import { PlayerList } from '@/widgets/player-list'; // из features
import { GameService } from '@/features/game-flow'; // из entities
```

## Алиасы путей

Настроены в `tsconfig.json`:
- `@/shared/*` → `./src/shared/*`
- `@/entities/*` → `./src/entities/*`
- `@/features/*` → `./src/features/*`
- `@/widgets/*` → `./src/widgets/*`
- `@/pages/*` → `./src/pages/*`
- `@/app/*` → `./src/app/*`

## Миграция завершена

✅ Все компоненты перемещены в соответствующие слои
✅ Импорты обновлены на новые пути
✅ TypeORM модели реорганизованы в entities
✅ Сервисы разделены на features
✅ UI компоненты в shared/ui
✅ Виджеты выделены в отдельный слой
