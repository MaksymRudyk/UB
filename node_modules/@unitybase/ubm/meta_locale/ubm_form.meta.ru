{
    "caption": "Форма",
    "description": "Определение интерфейсных форм",
    "attributes": [
        {
            "name": "code",
            "caption": "Код формы",
            "description": ""
        },
        {
            "name": "description",
            "caption": "Описание"
        },
        {
            "name": "caption",
            "caption": "Заголовок формы",
            "description": "Оставьте пустым, чтобы использовать имя объекта в качестве заголовка формы"
        },
        {
            "name": "formType",
            "caption": "Тип формы",
            "description": "Тип определения формы auto или custom"
        },
        {
            "name": "formDef",
            "caption": "Определение формы",
            "description": "Определение интерфейса формы"
        },
        {
            "name": "formCode",
            "caption": "Скрипт формы",
            "description": "JS с клиентской логикой формы"
        },
        {
            "name": "model",
            "caption": "Модель",
            "description": "Модель куда сохранять",
            "documentation": "Модель куда сохраняется форма. Если не заполнено - модель сущности. Использовать для описания форма для сущностей из чужих моделей"
        },
        {
            "name": "entity",
            "caption": "Сущность",
            "description": "Код сущности",
            "documentation": "Используется при автоопределении формы для сущности"
        },
        {
            "name": "isDefault",
            "caption": "По умолчанию",
            "description": "Использовать по умолчанию",
            "documentation": "При вызове команды showForm если не передан код формы будет произведён поиск формы по entity, и если таких несколько - взята та, у которой isDefault=true"
        },
        {
            "name": "ID",
            "caption": "ИД"
        }
    ]
}