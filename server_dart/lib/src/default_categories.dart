import 'models.dart';

/// The current production API serves this catalog as static product data.
const List<JsonRow> defaultCategories = <JsonRow>[
  {
    'id': 1,
    'name': 'سباكة',
    'icon': '🔧',
    'providerCount': 0,
    'specialties': [
      'تمديدات مياه',
      'إصلاح تسربات',
      'تركيب مضخات',
      'صيانة سخانات',
    ],
  },
  {
    'id': 2,
    'name': 'كهرباء',
    'icon': '⚡',
    'providerCount': 0,
    'specialties': [
      'تمديدات كهربائية',
      'لوحات كهرباء',
      'طاقة شمسية',
      'صيانة أعطال',
    ],
  },
  {
    'id': 3,
    'name': 'تكييف وتبريد',
    'icon': '❄️',
    'providerCount': 0,
    'specialties': [
      'تركيب مكيفات',
      'صيانة مكيفات',
      'تنظيف مكيفات',
      'تبريد مركزي',
    ],
  },
  {
    'id': 4,
    'name': 'نجارة',
    'icon': '🪚',
    'providerCount': 0,
    'specialties': ['أثاث منزلي', 'مطابخ', 'أبواب ونوافذ', 'ديكور خشبي'],
  },
  {
    'id': 5,
    'name': 'دهانات',
    'icon': '🎨',
    'providerCount': 0,
    'specialties': [
      'دهان داخلي',
      'دهان خارجي',
      'ديكورات وجدران',
      'ترميم دهانات',
    ],
  },
  {
    'id': 6,
    'name': 'تنظيف',
    'icon': '🧹',
    'providerCount': 0,
    'specialties': ['تنظيف منازل', 'تنظيف مكاتب', 'تنظيف سجاد', 'مكافحة حشرات'],
  },
  {
    'id': 7,
    'name': 'نقل أثاث',
    'icon': '🚚',
    'providerCount': 0,
    'specialties': ['نقل داخل المدينة', 'فك وتركيب', 'تغليف أثاث', 'نقل تجاري'],
  },
  {
    'id': 8,
    'name': 'بناء ومقاولات',
    'icon': '🏗️',
    'providerCount': 0,
    'specialties': [
      'أعمال خرسانة',
      'بناء وتشطيب',
      'بلاط وسيراميك',
      'حدادة وألمنيوم',
    ],
  },
];
