// Модель данных пространства: зоны 00–07 и панорамные сцены, в которых они находятся.
// Координаты hotspot'ов на карте и фокус камеры на панорамах заданы в процентах
// относительно натуральных размеров изображений (устойчиво к любому масштабу экрана).

const ZONES = {
  '00': {
    id: '00',
    title: 'УЛИЦА / ВХОД',
    color: '#e0483e',
    scene: 'scene-00-01',
    map: { x: 8.8, y: 72.1 },
    camera: { x: 20, y: 55, scale: 1.15 }
  },
  '01': {
    id: '01',
    title: 'ХОЛЛ',
    color: '#f07a1f',
    scene: 'scene-00-01',
    map: { x: 25.8, y: 36.9 },
    camera: { x: 62, y: 55, scale: 1.15 }
  },
  '02': {
    id: '02',
    title: 'ИССЛЕДОВАТЕЛЬСКАЯ',
    color: '#e8b923',
    scene: 'scene-02-03',
    map: { x: 34.6, y: 70.6 },
    camera: { x: 26, y: 52, scale: 1.15 }
  },
  '03': {
    id: '03',
    title: 'ПРОЕКТНАЯ МАСТЕРСКАЯ',
    color: '#3f6fd1',
    scene: 'scene-02-03',
    map: { x: 44.6, y: 38.7 },
    camera: { x: 74, y: 52, scale: 1.15 }
  },
  '04': {
    id: '04',
    title: 'АРХИВ / КАРТОТЕКА',
    color: '#1f8f5f',
    scene: 'scene-04-05',
    map: { x: 57.4, y: 69.9 },
    camera: { x: 25, y: 52, scale: 1.15 }
  },
  '05': {
    id: '05',
    title: 'ГАЛЕРЕЯ',
    color: '#d63e8a',
    scene: 'scene-04-05',
    map: { x: 59.3, y: 38.3 },
    camera: { x: 75, y: 52, scale: 1.15 }
  },
  '06': {
    id: '06',
    title: 'КОМАНДА',
    color: '#7a4fc9',
    scene: 'scene-06-07',
    map: { x: 79.8, y: 37.5 },
    camera: { x: 27, y: 52, scale: 1.15 }
  },
  '07': {
    id: '07',
    title: 'АМФИТЕАТР',
    color: '#e0692a',
    scene: 'scene-06-07',
    map: { x: 91.7, y: 36.3 },
    camera: { x: 76, y: 52, scale: 1.15 }
  }
};

const ZONE_ORDER = ['00', '01', '02', '03', '04', '05', '06', '07'];

const SCENES = {
  'scene-00-01': { file: 'assets/scenes/scene-00-01.png', w: 1536, h: 1024, zones: ['00', '01'] },
  'scene-02-03': { file: 'assets/scenes/scene-02-03.png', w: 1717, h: 916, zones: ['02', '03'] },
  'scene-04-05': { file: 'assets/scenes/scene-04-05.png', w: 1690, h: 931, zones: ['04', '05'] },
  'scene-06-07': { file: 'assets/scenes/scene-06-07.png', w: 1672, h: 941, zones: ['06', '07'] }
};

const MAP_IMAGE = { file: 'assets/scenes/scene-map.png', w: 1690, h: 931 };
