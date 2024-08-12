# TriliumNext Notes

[English](https://github.com/TriliumNext/Notes/blob/master/README.md) | [Chinese](https://github.com/TriliumNext/Notes/blob/master/README-ZH_CN.md) | [Russian](https://github.com/TriliumNext/Notes/blob/master/README.ru.md) | [Japanese](https://github.com/TriliumNext/Notes/blob/master/README.ja.md) | [Italian](https://github.com/TriliumNext/Notes/blob/master/README.it.md)

Trilium Notes – это приложение для заметок с иерархической структурой, ориентированное на создание больших персональных баз знаний. Для быстрого ознакомления посмотрите [скриншот-тур](https://triliumnext.github.io/Docs/Wiki/screenshot-tour):

<a href="https://triliumnext.github.io/Docs/Wiki/screenshot-tour"><img src="https://github.com/TriliumNext/Docs/blob/main/Wiki/images/screenshot.png?raw=true" alt="Trilium Screenshot" width="1000"></a>

## 🎁 Возможности

* Заметки можно расположить в виде дерева произвольной глубины. Отдельную заметку можно разместить в нескольких местах дерева (см. [клонирование](https://triliumnext.github.io/Docs/Wiki/cloning-notes))
* Продвинутый визуальный редактор (WYSIWYG) позволяет работать с таблицами, изображениями, [формулами](https://triliumnext.github.io/Docs/Wiki/text-notes#math-support) и разметкой markdown, имеет [автоформатирование](https://triliumnext.github.io/Docs/Wiki/text-notes#autoformat)
* Редактирование [заметок с исходным кодом](https://triliumnext.github.io/Docs/Wiki/code-notes), включая подсветку синтаксиса
* Быстрая и простая [навигация между заметками](https://triliumnext.github.io/Docs/Wiki/note-navigation), полнотекстовый поиск и [выделение заметок](https://triliumnext.github.io/Docs/Wiki/note-hoisting) в отдельный блок
* Бесшовное [версионирование заметки](https://triliumnext.github.io/Docs/Wiki/note-revisions)
* Специальные [атрибуты](https://triliumnext.github.io/Docs/Wiki/attributes) позволяют гибко организовать структуру, используются для поиска и продвинутого [скриптинга](https://triliumnext.github.io/Docs/Wiki/scripts)
* [Синхронизация](https://triliumnext.github.io/Docs/Wiki/synchronization) заметок со своим сервером
* Надёжное [шифрование](https://triliumnext.github.io/Docs/Wiki/protected-notes) с детализацией по каждой заметке
* [Карты связей](https://triliumnext.github.io/Docs/Wiki/relation-map) и [карты ссылок](https://triliumnext.github.io/Docs/Wiki/link-map) для визуализации их взяимосвязей
* [Скрипты](https://triliumnext.github.io/Docs/Wiki/scripts) - см. [продвинутые примеры](https://triliumnext.github.io/Docs/Wiki/advanced-showcases)
* Хорошо масштабируется, как по удобству использования, так и по производительности до 100000 заметок
* Оптимизированный [мобильный фронтенд](https://triliumnext.github.io/Docs/Wiki/mobile-frontend) смартфонов и планшетов
* [Темная тема](https://triliumnext.github.io/Docs/Wiki/themes)
* Импорт и экпорт [Evernote](https://triliumnext.github.io/Docs/Wiki/evernote-import) и данных в [markdown](https://triliumnext.github.io/Docs/Wiki/markdown) формате
* [Web Clipper](https://triliumnext.github.io/Docs/Wiki/web-clipper) для удобного сохранения веб-контента

## 🏗 Сборки

Trilium предоставляется в виде десктопного приложения (Linux и Windows) или веб-приложения, размещенного на вашем сервере (Linux). Доступна сборка Mac OS, но она [не поддерживается](https://triliumnext.github.io/Docs/Wiki/faq#mac-os-support).

* Если вы хотите использовать Trilium на десктопе, скачайте архив для своей платформы со страницы [релизов](https://github.com/TriliumNext/Notes/releases/latest), распакуйте и запустите исполняемый файл ```trilium```.
* Если вы хотите установить Trilium на сервере, следуйте этой [инструкции](https://triliumnext.github.io/Docs/Wiki/server-installation).
  * В данный момент поддерживаются (протестированы) последние версии браузеров Chrome и Firefox.

## 📝 Документация

[Полный список страниц документации доступен в Wiki.](https://triliumnext.github.io/Docs/)

Вы также можете ознакомиться с [шаблонами персональных баз знаний](https://triliumnext.github.io/Docs/Wiki/patterns-of-personal-knowledge), чтобы получить представление о том, как можно использовать Trilium.

## 💻 Участвуйте в разработке

Или склонируйте на своё устройство и запустите
```
npm install
npm run start-server
```

## 👏 Благодарности

* [CKEditor 5](https://github.com/ckeditor/ckeditor5) - лучший WYSIWYG редактор, очень активная и внимательная команда.
* [FancyTree](https://github.com/mar10/fancytree) - многофункциональная библиотека для создания древовидных структур. Вне конкуренции. Без него Trilium Notes не были бы таким.
* [CodeMirror](https://github.com/codemirror/CodeMirror) - редактор кода с поддержкой огромного количество языков.
* [jsPlumb](https://github.com/jsplumb/jsplumb) - библиотека для визуализации связей. Вне конкуренции. Используется в [картах связей](https://triliumnext.github.io/Docs/Wiki/relation-map) и [картах ссылок](https://triliumnext.github.io/Docs/Wiki/link-map).

## 🔑 Лицензия

Эта программа является бесплатным программным обеспечением: вы можете распространять и/или изменять ее в соответствии с условиями GNU Affero General Public License, опубликованной Free Software Foundation, либо версии 3 Лицензии, либо (по вашему выбору) любой более поздней версии.
