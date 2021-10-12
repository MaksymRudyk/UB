# Описание
Фабричная ф-я `Form` создает стор для формы и рендерит ее в таб или модальное окно.
Стор отслеживает изменения формы и строит запросы на изменение формы.
В форме доступна валидация и ее проверка перед сохранением (see `Validation tutorial`).

> See real form code - [tst_dictionary-ft-fm.vue](https://git-pub.intecracy.com/unitybase/ubjs/-/blob/master/apps/autotest/models/TST/public/forms/tst_dictionary-ft-fm.vue)

## Пример минимального использования

```javascript
const { Form } = require('@unitybase/adminui-vue')

module.exports.mount = function ({ title, entity, instanceID, rootComponent }) {
  Form({
    component: rootComponent,
    entity,
    instanceID,
    title
  }).mount()
}
module.exports.default ={
  name: 'MyCustomVueComponent'
}
```

## Пример полного использования
```javascript
module.exports.mount = function ({ title, entity, instanceID, rootComponent }) {
  Form({
    component: rootComponent,
    entity,
    instanceID,
    title: 'Any custom title',
    isModal: true,
    modalClass: 'test-class', // кастомный класс для модального окна
    modalWidth: '900px', // ширина модального окна
    formCode
  })
    .store({ // .store можно не использовать если не требуется иметь дополнительные параметры в нем
      state: {},
      getters: {},
      mutations: {},
      //...
    })
    .processing({
      // пример хука, список хуков описан ниже в processing
      async beforeSave (store) {
        return $App.dialogYesNo('custom before save', 'are you sure?')
      },
      masterFieldList: ['ID', 'name', 'age', 'phone'], // можно не указывать
      /**
      * collections - запросы для связаных с формой записей.
      * Принимает данные вида {[ключ коллекции]: [UB repository]}
      * Если нужно что б данные в коллекции были загружены не сразу а по какому то событию, то можно добавить коллецию
      * указав данные в таком виде {
      *   [ключ коллекции]: {
      *     repository: [UB repository],
      *     lazy: true
      *   }
      * }
      * В этом случае данные будут загружены только после вызова экшена loadCollections, 
      * который принимает в себя массив ключей коллекций, пример: loadCollections(['todo'])
      *
      * Для коллекции "participants" указаны функции, которые строят запрос на создание записей
      * и обработка ответов от этих запросов, а также удаление записей, вместо логики по-умолчанию.
      */
      collections: {
        todo: {
          repository: ({state}) => UB.connection
            .Repository('tst_dictionary_todo')
            .attrs('ID', 'objectID', 'name', 'status', 'link')
            .where('objectID', '=', state.data.ID),
          lazy: true
        },
          
        dueDate: () => UB.connection
          .Repository('tst_due_date')
          .attrs('ID', 'dateFrom', 'dateTo', 'status')
          .where('dateTo', '<', Date.now()),

        participants: {
          repository: ({state}) => Repository('dfx_Document_ppt')
            .attrs(
              'ID',
              'objectID',
              'subjectID',
              'role'
            )
            .where('objectID', '=', state.data.ID)
            .where('role', 'notIn', inAttrRoles),
          buildRequest({state, collection, fieldList, item}) {
            return {
              entity: 'dfx_Document',
              method: 'addParticipant',
              fieldList,
              execParams: {
                ID: state.data.ID,
                subjectID: item.data.subjectID,
                role: item.data.role
              },
              collection: collection.key
            }
          },
          handleResponse ({ commit, collection, response }) {
            const loadedState = response.resultData
            for (const loadedItem of loadedState) {
              const index = collection.items.findIndex(i => i.data.subjectID === loadedItem.subjectID)
              if (index !== -1) {
                commit('LOAD_COLLECTION_PARTIAL', {
                  collection: 'participants',
                  index,
                  loadedState: loadedItem
                })
              }
            }
          },
          buildDeleteRequest({state, item}) {
            return {
              entity: 'dfx_Document',
              method: 'removeParticipant',
              execParams: {
                ID: state.data.ID,
                subjectID: item.data.subjectID
              }
            }
          }
        }
      }
    })
    .validation()
    .mount()
}

module.exports.default ={
  name: 'MyCustomVueComponent'
}
```

## Проброс значений по умолчанию в форму для новой записи
Forms принимает на вход опциональный параметр `props.parentContext` - object со значениями атрибутов по умолчанию для
метода `addNew`. 

Таким образом можно, например, передать дочерней форме значение идентификатора записи текущей формы (мастер-деталь).
`$App.doCommand` пробрасывает props транзитом в конструктор Form.

В примере ниже мы вызываем форму в режиме добавления записи (не передаем instanceID), при этом значение атрибута `docID`
новой формы будет 123 (если его не изменит серверная реализация метода `addNew`) 

```javascript
  $App.doCommand({
    cmdType: 'showForm',
    entity: 'doc_controltask',
    formCode: 'doc_controltask_form',
    isModal: true,
    props: {
      parentContext: { docID: 123 }
    }
  })
```  

## Предупреждение
> `instance -> processing -> validation` должны использоваться последовательно.
> Tо есть можно использовать instance отдельно, но processing без instance нельзя, то же касается и validation

### Instance
  Хранит данные формы и отслеживает изменения в ней.
  Все взаимодействие со стором рекомендуется делать используя мутации описаные ниже. 
  
#### state
 - `data` - it is an object with actual (to be shown on UI) data values, regardless if values are untouched by user 
 or already edited.
 - `originalData` - his object is initially empty, but as user starts editing, it is filled by original values, as they 
 loaded from DB, so that it would be always possible to say if a certain attribute was changed or not. 
 If after some editing, value returned to its original state, value is deleted from this object. 
 When this object is has no attributes, we know there is nothing to save.
 - `collections` - this is a property for complex object, objects which consist of one master record and collection
 or multiple collections of detail records. Each collection tracks added, changed and deleted items, so that we know
 if there is any change to save in the collection. Collection item is tracked just like the master record, using the
 same technique - "data" and "originalData" properties for item.  Item also has "isNew" property, indicating if item
 was added after original loading of collection or not. The "deleted"

#### getters
 - `isDirty` геттер, вернет `true` если в форме были изменены какие либо данные

#### mutations
 - `SET_DATA`: вносит изменения в `data`
 - `ASSIGN_DATA`: тоже что и `SET_DATA` только для нескольких значений сразу
 - `SET`: вносит изменения в остальные опции стора (не `data`), не влияет на отслеживание изменений
 - `LOAD_DATA`: принимает в себя объект с данными формы и записывает в `data`, мутация очищает `originalData`
 поэтому форма будет `isDirty === false`
 - `LOAD_DATA_PARTIAL`: догружает данные в `data`, чистит из `originalData` только те поля которые были переданы
 - `LOAD_COLLECTION`: тоже что и `LOAD_DATA` только для коллекции
 - `LOAD_COLLECTION_PARTIAL`: тоже что и `LOAD_DATA_PARTIAL` только для коллекции
 - `ADD_COLLECTION_ITEM`: добавляет новый элемент в коллецию. Вместо этой мутации рекомендуюется использовать
 `action -> addCollection` из модуля **processing**  
 - `DELETE_COLLECTION_ITEM`: убирает элемент из коллекции и добавляет его в массив `deleted`,
 после сохранения формы для всех элементом массива `deleted` будут отправлены запросы на удаление. 
 - `DELETE_COLLECTION_ITEM_WITHOUT_TRACKING`: убирает элемент из коллекции и НЕ добавляет его в массив `deleted`,
 запросы на удаление НЕ будут отправлены на сервер при сохранении.  Может быть полезно в случае, когда известно, что
 сервер при сохранении сам удаляет записи, например, при каскадном удалении делаталей.  
 - `CLEAR_ALL_DELETED_ITEMS`: очищает массив `deleted` у всех коллекций, чаще всего вам не прийдется его использовать,
 так как он вызывается автоматически после сохранения формы в модуле **processing**
 - `DELETE_ALL_COLLECTION_ITEMS`: добавляет все элементы коллекции в массив удаления, после сохранения формы для всех
 элементом массива `deleted` будут отправлены запросы на удаление. 

### Processing
  Создает в сторе CRUD экшены в которых лежат UB запросы построенные на основе instance-module data
  
#### state
 - `isNew`: указывает новая ли это форма
 - `formCrashed`: указывает была ли ошибка при загрузке формы

#### getters
 - `loading`: true если происходит какая-либо загрузка в форме
 - `canRefresh`: true если у пользователя есть доступ к обновлению формы
 - `canSave`: true если у пользователя есть доступ к сохранению формы
 - `canDelete`: true если у пользователя есть доступ к удалению формы

#### mutations
 - `LOADING` - добавляет/исключает флаг из массива загрузки.
 > Пример 
 ```javascript
  commit('LOADING', {
    isLoading: true,
    target: 'loadSomeRepo'
  })

  await UB.Repository('some_repo')
    .attrs('*')
    .select()

  commit('LOADING', {
    isLoading: false,
    target: 'loadSomeRepo'
  })
  ```

#### actions
 - `deleteInstance`: выводит yes/no диалоговое окно, при клике на yes удаляет запись
 - `refresh`: обновляет данные в форме
 - `save`: сохраняет форму
 - `loadCollections`: данные в этих коллекциях будут загружены только тогда когда вручную будет вызван этот экшн.
  Это сделано специально для того что б загружать связанные записи только тогда когда они необходимы,
  например когда данные записи коллекции находятся на вкладке которая не включена при открытии формы.

#### hooks
Хук может быть обычной функцией или async (функция которая возвращает промис)

 - **beforeInit**
 - **inited**
 - **beforeSave**: если функция вернет false save не будет выполнен 
 - **saved**
 - **beforeCreate** 
 - **created**
 - **beforeLoad** 
 - **loaded**
 - **beforeDelete**
 - **deleted**

### Validation
  See [Validation tutorial](Validation%20tutorial).

  На основе данных в instance модуле и entitySchema создает объект валидации `$v` - [vuelidate](https://github.com/vuelidate/vuelidate)
  полученный объект через provide прокидывается в компонент.
  Можно получить в любом дочернем компоненте формы с помощью `inject: ['$v']`.
  Можно передать Vue mixin в качестве параметра в котором можно будет перетереть стандартную валидацию.
  
#### Пример кастомной валидации
  dynamicField будет обязательным если someNumber будет больше 25
    
```javascript
const { required, between } = require('vuelidate/lib/validators/index')

module.exports.mount = function ({ title, entity, instanceID, formCode, rootComponent }) {
  Form({
    component: rootComponent,
    entity,
    instanceID,
    title,
    formCode
  })
  .processing()
  .validation({
    computed: {
      name () {
        return this.$store.state.data.name
      },
      
      someNumber () {
        return this.$store.state.data.someNumber
      },
      
      dynamicField () {
        return this.$store.state.data.dynamicField
      },
      
      'dynamicField:caption'() {
        return this.$ut('some.i18n.key.for.dynamicField')
      } 
    },
  
    validations () {
      return {
        name: { required },
        someNumber: {
          required, 
          between: between(20, 30)
        },
        ...(this.someNumber > 25 ? {
          dynamicField: { required }
        } : {})
      }
    }
  })
  .mount()
}

```


## Рекомендации к написанию шаблона формы

```html
<template>
  <!-- класс который растягивает форму на высоту окна и делает правильную работу скрола -->
  <div class="u-form-layout">
    <!-- тулбар-->
    <u-toolbar />

    <!-- компонент позволяет указать ширину для дочерних u-form-row. Лоадер рекомендуется вешать на него -->
    <u-form-container
      v-loading.body="loading"
      :label-width="160"
    >
      <!-- строка формы с заголовком (label) -->
      <u-form-row
        :label="getLabel('code')"
        required
        :error="$v.code.$error"
      >
        <u-base-input v-model="code" />
      </u-form-row>

      <!-- обертка для u-form-row которая смотрит на атрибут в сущности -->
      <!-- и по его типу рендерит нужный html + определяет валидацию -->
      <u-auto-field attribute-name="code" />
    </u-form-container>
  </div>
</template>

<script>
const { mapInstanceFields } = require('@unitybase/adminui-vue')
const { mapGetters } = require('vuex')

export default {
  inject: ['$v'], // валидация, 

  computed: {
    ...mapInstanceFields(['code', 'caption']), // хелпер для получение/изменения данных формы

    ...mapGetters(['loading'])
  }
}
</script>
```
