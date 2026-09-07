// OBJECTS — 5 реальных объектов молодёжной инфраструктуры Татарстана.
// Общий для Zone 01 (ссылки на исходные материалы) и будущей Zone 04
// (ссылки на папку архива) — одна карточка данных, как решено 05.09
// ("не предполагать, что ссылки Zone 01 и Zone 04 одинаковые", но объект
// как сущность — один и тот же, поэтому одна запись с двумя полями).
//
// explicit id — НЕ DOM-index. desktopCoords/mobileCoords — проценты от
// картинки сцены zone-01-desktop/zone-01-mobile соответственно (раздельные
// координаты, композиции не идентичны между breakpoint'ами).
//
// FAST MODE production pass (01+06+07): Zone 01 получила собственный
// production BASE взамен старого общего scene-00-01 placeholder'а — та же
// сущность (5 объектов), но артворк теперь рисует их как 5 физических
// стендов-карточек на столе ("ОБЪЕКТЫ ХАКАТОНА"), а не как элементы общей
// композиции ресепшена. Координаты ниже — первое приближение по
// percentage-grid поверх самого BASE (см. preflight), не финальная
// пиксельная калибровка через ?debug=1 — она обычно уточняется после
// первого визуального прохода.
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
      desktopCoords: { x: 47, y: 70 },
      mobileCoords: { x: 40, y: 69 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    },
    {
      id: 'elabuga',
      number: '02',
      title: 'Елабуга',
      desktopCoords: { x: 54, y: 70 },
      mobileCoords: { x: 47, y: 69 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    },
    {
      id: 'shemordan',
      number: '03',
      title: 'Шемордан',
      desktopCoords: { x: 61, y: 70 },
      mobileCoords: { x: 54, y: 69 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    },
    {
      id: 'laishevo',
      number: '04',
      title: 'Лаишево',
      desktopCoords: { x: 68, y: 70 },
      mobileCoords: { x: 61, y: 69 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    },
    {
      id: 'stolbishche',
      number: '05',
      title: 'Столбище',
      desktopCoords: { x: 75, y: 70 },
      mobileCoords: { x: 68, y: 69 },
      sourceMaterialsUrl: null,
      archiveFolderUrl: null
    }
  ];
})(window.YHApp = window.YHApp || {});
