// OBJECTS — 5 реальных объектов молодёжной инфраструктуры Татарстана.
// Общий для Zone 01 (ссылки на исходные материалы) и будущей Zone 04
// (ссылки на папку архива) — одна карточка данных, как решено 05.09
// ("не предполагать, что ссылки Zone 01 и Zone 04 одинаковые", но объект
// как сущность — один и тот же, поэтому одна запись с двумя полями).
//
// explicit id — НЕ DOM-index. desktopCoords/mobileCoords — проценты от
// картинки сцены scene-00-01 (те же координаты, что видит камера в обоих
// режимах, если явно не указано иначе).
//
// ВАЖНО (см. отчёт по Этапу 2, known issues): точные координаты — первое
// приближение, откалиброванное по общей композиции approved-иллюстрации
// (полка с фото слева / карта-стенд / инфостойка / доска с фото справа /
// скамья справа), а не по пиксельно-точной разметке — в approved-артворке
// нет 5 явно обособленных "стендов объекта", какими их описывает
// Production-ТЗ. Требуется финальная калибровка через ?debug=1 совместно
// с заказчиком, как это делалось для V1.
//
// sourceMaterialsUrl / archiveFolderUrl — оба null, пока заказчик не
// передал ссылки. Ничего не выдумано (см. решение от 05.09, п.5).

(function (YHApp) {
  'use strict';

  YHApp.OBJECTS = [
    {
      id: 'bugulma',
      number: '01',
      title: 'Бугульма',
      // на полке с фото у левого окна (было: прямо на строке текста)
      desktopCoords: { x: 6.8, y: 72.5 },
      mobileCoords: { x: 6.8, y: 72.5 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    },
    {
      id: 'elabuga',
      number: '02',
      title: 'Елабуга',
      // на самом стенде-карте (уже хорошо совпадало по debug-скрину)
      desktopCoords: { x: 32, y: 63 },
      mobileCoords: { x: 32, y: 63 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    },
    {
      id: 'shemordan',
      number: '03',
      title: 'Шемордан',
      // ближе к инфостойке/ноутбуку у ресепшена (было: в воздухе на фигуре человека)
      desktopCoords: { x: 57.5, y: 71 },
      mobileCoords: { x: 57.5, y: 71 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    },
    {
      id: 'laishevo',
      number: '04',
      title: 'Лаишево',
      // сдвинуто вправо и ниже — было: пересекалось с program wall
      // (см. отчёт по Этапу 2, найденный и исправленный баг)
      desktopCoords: { x: 84.5, y: 61 },
      mobileCoords: { x: 84.5, y: 61 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    },
    {
      id: 'stolbishche',
      number: '05',
      title: 'Столбище',
      desktopCoords: { x: 89, y: 70 },
      mobileCoords: { x: 89, y: 70 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    }
  ];
})(window.YHApp = window.YHApp || {});
