export interface District {
  name: string;
  nameAr?: string;
  nameEn?: string;
}

export interface Governorate {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  districts: District[];
}

export const YEMEN_GOVERNORATES: Governorate[] = [
  {
    id: 'ye_sanaa',
    name: "Sana'a",
    nameAr: 'صنعاء',
    nameEn: "Sana'a",
    districts: [
      { name: 'أمانة العاصمة', nameAr: 'أمانة العاصمة', nameEn: 'Capital Secretariat' },
      { name: 'صنعاء القديمة', nameAr: 'صنعاء القديمة', nameEn: 'Old City' },
      { name: 'السبعين', nameAr: 'السبعين', nameEn: 'Al Sabeen' },
      { name: 'الوحدة', nameAr: 'الوحدة', nameEn: 'Al Wahdah' },
      { name: 'التحرير', nameAr: 'التحرير', nameEn: 'Al Tahrir' },
      { name: 'معين', nameAr: 'معين', nameEn: 'Maeen' },
      { name: 'بني الحارث', nameAr: 'بني الحارث', nameEn: 'Bani Al Harith' },
      { name: 'همدان', nameAr: 'همدان', nameEn: 'Hamdan' },
      { name: 'خولان', nameAr: 'خولان', nameEn: 'Khwlan' },
      { name: 'سنحان وبني بهلول', nameAr: 'سنحان وبني بهلول', nameEn: 'Sanhan' },
      { name: 'أرحب', nameAr: 'أرحب', nameEn: 'Arhab' },
      { name: 'بني حشيش', nameAr: 'بني حشيش', nameEn: 'Bani Hushaysh' },
      { name: 'الحيمة الداخلية', nameAr: 'الحيمة الداخلية', nameEn: 'Al Haymah Ad Dakhiliyah' },
      { name: 'الحيمة الخارجية', nameAr: 'الحيمة الخارجية', nameEn: 'Al Haymah Al Kharijiyah' },
      { name: 'مناخة', nameAr: 'مناخة', nameEn: 'Manakhah' },
      { name: 'نهم', nameAr: 'نهم', nameEn: 'Nihm' }
    ]
  },
  {
    id: 'ye_aden',
    name: 'Aden',
    nameAr: 'عدن',
    nameEn: 'Aden',
    districts: [
      { name: 'صيرة (كريتر)', nameAr: 'صيرة (كريتر)', nameEn: 'Crater (Seera)' },
      { name: 'المعلا', nameAr: 'المعلا', nameEn: 'Al Mualla' },
      { name: 'التواهي', nameAr: 'التواهي', nameEn: 'Al Tawahi' },
      { name: 'خور مكسر', nameAr: 'خور مكسر', nameEn: 'Khor Maksar' },
      { name: 'الشيخ عثمان', nameAr: 'الشيخ عثمان', nameEn: 'Ash Shaikh Outhman' },
      { name: 'المنصورة', nameAr: 'المنصورة', nameEn: 'Al Mansoora' },
      { name: 'دار سعد', nameAr: 'دار سعد', nameEn: 'Dar Saad' },
      { name: 'البريقة', nameAr: 'البريقة', nameEn: 'Al Buraiqeh' }
    ]
  },
  {
    id: 'ye_taiz',
    name: 'Taiz',
    nameAr: 'تعز',
    nameEn: 'Taiz',
    districts: [
      { name: 'المظفر', nameAr: 'المظفر', nameEn: 'Al Mudhaffar' },
      { name: 'القاهرة', nameAr: 'القاهرة', nameEn: 'Al Qahirah' },
      { name: 'صالة', nameAr: 'صالة', nameEn: 'Salh' },
      { name: 'الحوبان', nameAr: 'الحوبان', nameEn: 'Al Hawban' },
      { name: 'المخا', nameAr: 'المخا', nameEn: 'Al Mokha' },
      { name: 'التربة', nameAr: 'التربة', nameEn: 'Al Turbah' },
      { name: 'الشمايتين', nameAr: 'الشمايتين', nameEn: 'Ash Shamayatayn' },
      { name: 'صبر الموادم', nameAr: 'صبر الموادم', nameEn: 'Sabir Al Mawadim' },
      { name: 'مشرعة وحدنان', nameAr: 'مشرعة وحدنان', nameEn: 'Mashra\'ah Wa Hadnan' },
      { name: 'جبل حبشي', nameAr: 'جبل حبشي', nameEn: 'Jabal Habashy' },
      { name: 'المعافر', nameAr: 'المعافر', nameEn: 'Al Ma\'afer' },
      { name: 'المواسط', nameAr: 'المواسط', nameEn: 'Al Mawasit' },
      { name: 'الصلو', nameAr: 'الصلو', nameEn: 'As Silw' },
      { name: 'حيفان', nameAr: 'حيفان', nameEn: 'Hayfan' },
      { name: 'دمنة خدير', nameAr: 'دمنة خدير', nameEn: 'Dimnat Khadir' },
      { name: 'مقبنة', nameAr: 'مقبنة', nameEn: 'Maqbanah' },
      { name: 'شرعب الرونة', nameAr: 'شرعب الرونة', nameEn: 'Shar\'ab Ar Rawnah' },
      { name: 'شرعب السلام', nameAr: 'شرعب السلام', nameEn: 'Shar\'ab As Salam' },
      { name: 'موزع', nameAr: 'موزع', nameEn: 'Mawza' },
      { name: 'ذباب', nameAr: 'ذباب', nameEn: 'Dhubab' },
      { name: 'الوازعية', nameAr: 'الوازعية', nameEn: 'Al Wazi\'iyah' }
    ]
  },
  {
    id: 'ye_dhale',
    name: 'Al Dhale',
    nameAr: 'الضالع',
    nameEn: 'Al Dhale',
    districts: [
      { name: 'مدينة الضالع', nameAr: 'مدينة الضالع', nameEn: 'Al Dhale City' },
      { name: 'قعطبة', nameAr: 'قعطبة', nameEn: 'Qa\'atabah' },
      { name: 'دمت', nameAr: 'دمت', nameEn: 'Damt' },
      { name: 'مريس', nameAr: 'مريس', nameEn: 'Mureis' },
      { name: 'جبن', nameAr: 'جبن', nameEn: 'Juban' },
      { name: 'الشعيب', nameAr: 'الشعيب', nameEn: 'Ash Shu\'ayb' },
      { name: 'جحاف', nameAr: 'جحاف', nameEn: 'Jahaf' },
      { name: 'الأزارق', nameAr: 'الأزارق', nameEn: 'Al Azariq' },
      { name: 'الحشاء', nameAr: 'الحشاء', nameEn: 'Al Husha' }
    ]
  },
  {
    id: 'ye_hadramout',
    name: 'Hadramout',
    nameAr: 'حضرموت',
    nameEn: 'Hadramout',
    districts: [
      { name: 'المكلا', nameAr: 'المكلا', nameEn: 'Al Mukalla' },
      { name: 'سيئون', nameAr: 'سيئون', nameEn: 'Sayun' },
      { name: 'تريم', nameAr: 'تريم', nameEn: 'Tarim' },
      { name: 'الشحر', nameAr: 'الشحر', nameEn: 'Ash Shihr' },
      { name: 'شبام', nameAr: 'شبام', nameEn: 'Shibam' },
      { name: 'القطن', nameAr: 'القطن', nameEn: 'Al Qatn' },
      { name: 'دوعن', nameAr: 'دوعن', nameEn: 'Daw\'an' },
      { name: 'غيل باوزير', nameAr: 'غيل باوزير', nameEn: 'Ghayl Ba Wazir' },
      { name: 'الديس الشرقية', nameAr: 'الديس الشرقية', nameEn: 'Ad Dis' },
      { name: 'الريدة وقصيعر', nameAr: 'الريدة وقصيعر', nameEn: 'Ar Raydah' },
      { name: 'بروم ميفع', nameAr: 'بروم ميفع', nameEn: 'Brom Mayfa\'a' },
      { name: 'ساه', nameAr: 'ساه', nameEn: 'Sah' },
      { name: 'وادي العين', nameAr: 'وادي العين', nameEn: 'Wadi Al Ayn' },
      { name: 'حريضة', nameAr: 'حريضة', nameEn: 'Huraidhah' },
      { name: 'عمد', nameAr: 'عمد', nameEn: 'Amd' },
      { name: 'حجر', nameAr: 'حجر', nameEn: 'Hajr' },
      { name: 'العبر', nameAr: 'العبر', nameEn: 'Al Abr' },
      { name: 'ثمود', nameAr: 'ثمود', nameEn: 'Thamud' },
      { name: 'رماه', nameAr: 'رماه', nameEn: 'Romah' }
    ]
  },
  {
    id: 'ye_hodeidah',
    name: 'Al Hudaydah',
    nameAr: 'الحديدة',
    nameEn: 'Al Hudaydah',
    districts: [
      { name: 'الميناء', nameAr: 'الميناء', nameEn: 'Al Mina' },
      { name: 'الحوك', nameAr: 'الحوك', nameEn: 'Al Hawak' },
      { name: 'الحالي', nameAr: 'الحالي', nameEn: 'Al Hali' },
      { name: 'باجل', nameAr: 'باجل', nameEn: 'Bajil' },
      { name: 'بيت الفقيه', nameAr: 'بيت الفقيه', nameEn: 'Bayt Al Faqih' },
      { name: 'زبيد', nameAr: 'زبيد', nameEn: 'Zabid' },
      { name: 'الزيدية', nameAr: 'الزيدية', nameEn: 'Az Zaydiyah' },
      { name: 'الضحى', nameAr: 'الضحى', nameEn: 'Ad Dahi' },
      { name: 'اللحية', nameAr: 'اللحية', nameEn: 'Al Luhayyah' },
      { name: 'المنيرة', nameAr: 'المنيرة', nameEn: 'Al Munirah' },
      { name: 'الصليف', nameAr: 'الصليف', nameEn: 'As Salif' },
      { name: 'كمران', nameAr: 'كمران', nameEn: 'Kamaran' },
      { name: 'الدريهمي', nameAr: 'الدريهمي', nameEn: 'Ad Durayhimi' },
      { name: 'التحيتا', nameAr: 'التحيتا', nameEn: 'At Tuhayta' },
      { name: 'الخوخة', nameAr: 'الخوخة', nameEn: 'Al Khawkhah' },
      { name: 'حيس', nameAr: 'حيس', nameEn: 'Hays' },
      { name: 'الجراحي', nameAr: 'الجراحي', nameEn: 'Al Jarrahi' },
      { name: 'المراوعة', nameAr: 'المراوعة', nameEn: 'Al Marawi\'ah' },
      { name: 'السخنة', nameAr: 'السخنة', nameEn: 'As Sukhnah' },
      { name: 'المنصورية', nameAr: 'المنصورية', nameEn: 'Al Mansuriyah' },
      { name: 'برع', nameAr: 'برع', nameEn: 'Bura' }
    ]
  },
  {
    id: 'ye_ibb',
    name: 'Ibb',
    nameAr: 'إب',
    nameEn: 'Ibb',
    districts: [
      { name: 'الظهار', nameAr: 'الظهار', nameEn: 'Ad Dhihar' },
      { name: 'المشنة', nameAr: 'المشنة', nameEn: 'Al Mashannah' },
      { name: 'يريم', nameAr: 'يريم', nameEn: 'Yarim' },
      { name: 'جبلة', nameAr: 'جبلة', nameEn: 'Jiblah' },
      { name: 'العدين', nameAr: 'العدين', nameEn: 'Al Udayn' },
      { name: 'فرع العدين', nameAr: 'فرع العدين', nameEn: 'Far Al Udayn' },
      { name: 'حزم العدين', nameAr: 'حزم العدين', nameEn: 'Hazm Al Udayn' },
      { name: 'مذيخرة', nameAr: 'مذيخرة', nameEn: 'Mudhaykhirah' },
      { name: 'ذي السفال', nameAr: 'ذي السفال', nameEn: 'Dhi As Sufal' },
      { name: 'السياني', nameAr: 'السياني', nameEn: 'As Sayyani' },
      { name: 'السبرة', nameAr: 'السبرة', nameEn: 'As Sabrah' },
      { name: 'بعدان', nameAr: 'بعدان', nameEn: 'Ba\'dan' },
      { name: 'الشعر', nameAr: 'الشعر', nameEn: 'Ash Sha\'ir' },
      { name: 'النادرة', nameAr: 'النادرة', nameEn: 'An Nadirah' },
      { name: 'السدة', nameAr: 'السدة', nameEn: 'As Saddah' },
      { name: 'القفر', nameAr: 'القفر', nameEn: 'Al Qafr' },
      { name: 'المخادر', nameAr: 'المخادر', nameEn: 'Al Makhadir' },
      { name: 'حبيش', nameAr: 'حبيش', nameEn: 'Hubaysh' }
    ]
  },
  {
    id: 'ye_marib',
    name: 'Marib',
    nameAr: 'مأرب',
    nameEn: 'Marib',
    districts: [
      { name: 'مدينة مأرب', nameAr: 'مدينة مأرب', nameEn: 'Marib City' },
      { name: 'مأرب الوادي', nameAr: 'مأرب الوادي', nameEn: 'Marib Al Wadi' },
      { name: 'صرواح', nameAr: 'صرواح', nameEn: 'Sirwah' },
      { name: 'الجوبة', nameAr: 'الجوبة', nameEn: 'Al Jubah' },
      { name: 'حريب', nameAr: 'حريب', nameEn: 'Harib' },
      { name: 'العبدية', nameAr: 'العبدية', nameEn: 'Al Abdiyah' },
      { name: 'ماهلية', nameAr: 'ماهلية', nameEn: 'Mahliyah' },
      { name: 'رحبة', nameAr: 'رحبة', nameEn: 'Rahabah' },
      { name: 'مدغل', nameAr: 'مدغل', nameEn: 'Madghil' },
      { name: 'رغوان', nameAr: 'رغوان', nameEn: 'Raghwan' },
      { name: 'بدبدة', nameAr: 'بدبدة', nameEn: 'Bidbadah' },
      { name: 'مجزر', nameAr: 'مجزر', nameEn: 'Majzar' }
    ]
  },
  {
    id: 'ye_shabwah',
    name: 'Shabwah',
    nameAr: 'شبوة',
    nameEn: 'Shabwah',
    districts: [
      { name: 'عتق', nameAr: 'عتق', nameEn: 'Ataq' },
      { name: 'بيحان', nameAr: 'بيحان', nameEn: 'Bayhan' },
      { name: 'عسيلان', nameAr: 'عسيلان', nameEn: 'Usaylan' },
      { name: 'عين', nameAr: 'عين', nameEn: 'Ain' },
      { name: 'نصاب', nameAr: 'نصاب', nameEn: 'Nisab' },
      { name: 'حبان', nameAr: 'حبان', nameEn: 'Habban' },
      { name: 'الروضة', nameAr: 'الروضة', nameEn: 'Ar Rawdah' },
      { name: 'ميفعة', nameAr: 'ميفعة', nameEn: 'Mayfa\'a' },
      { name: 'رضوم', nameAr: 'رضوم', nameEn: 'Rudum' },
      { name: 'الصعيد', nameAr: 'الصعيد', nameEn: 'As Said' },
      { name: 'مرخة العليا', nameAr: 'مرخة العليا', nameEn: 'Markhah Al Ulya' },
      { name: 'مرخة السفلى', nameAr: 'مرخة السفلى', nameEn: 'Markhah As Sufla' },
      { name: 'جردان', nameAr: 'جردان', nameEn: 'Jardan' },
      { name: 'عرماء', nameAr: 'عرماء', nameEn: 'Arma' },
      { name: 'دهر', nameAr: 'دهر', nameEn: 'Dahr' },
      { name: 'الطلح', nameAr: 'الطلح', nameEn: 'At Talh' }
    ]
  },
  {
    id: 'ye_lahj',
    name: 'Lahj',
    nameAr: 'لحج',
    nameEn: 'Lahj',
    districts: [
      { name: 'الحوطة', nameAr: 'الحوطة', nameEn: 'Al Hawtah' },
      { name: 'تبن', nameAr: 'تبن', nameEn: 'Tuban' },
      { name: 'ردفان (الحبيلين)', nameAr: 'ردفان (الحبيلين)', nameEn: 'Radfan (Al Hubaylin)' },
      { name: 'حبيل جبر', nameAr: 'حبيل جبر', nameEn: 'Habil Jabr' },
      { name: 'حالمين', nameAr: 'حالمين', nameEn: 'Halmin' },
      { name: 'يافع (لبعوس)', nameAr: 'يافع (لبعوس)', nameEn: 'Yafa\' (Labous)' },
      { name: 'يافع (يهر)', nameAr: 'يافع (يهر)', nameEn: 'Yahar' },
      { name: 'يافع (المفلحي)', nameAr: 'يافع (المفلحي)', nameEn: 'Al Maflahi' },
      { name: 'طور الباحة', nameAr: 'طور الباحة', nameEn: 'Tawr Al Bahah' },
      { name: 'المضاربة والعارة', nameAr: 'المضاربة والعارة', nameEn: 'Al Madaribah' },
      { name: 'المقاطرة', nameAr: 'المقاطرة', nameEn: 'Al Maqatirah' },
      { name: 'القبيطة', nameAr: 'القبيطة', nameEn: 'Al Qabbaytah' },
      { name: 'كرش', nameAr: 'كرش', nameEn: 'Karash' },
      { name: 'الملاح', nameAr: 'الملاح', nameEn: 'Al Milah' }
    ]
  },
  {
    id: 'ye_abyan',
    name: 'Abyan',
    nameAr: 'أبين',
    nameEn: 'Abyan',
    districts: [
      { name: 'زنجبار', nameAr: 'زنجبار', nameEn: 'Zinjibar' },
      { name: 'خنفر (جعار)', nameAr: 'خنفر (جعار)', nameEn: 'Khanfir (Ja\'ar)' },
      { name: 'لودر', nameAr: 'لودر', nameEn: 'Lawdar' },
      { name: 'مودية', nameAr: 'مودية', nameEn: 'Mudiyah' },
      { name: 'المحفد', nameAr: 'المحفد', nameEn: 'Al Mahfad' },
      { name: 'أحور', nameAr: 'أحور', nameEn: 'Ahwar' },
      { name: 'جيشان', nameAr: 'جيشان', nameEn: 'Jayshan' },
      { name: 'سباح', nameAr: 'سباح', nameEn: 'Sibah' },
      { name: 'رصد', nameAr: 'رصد', nameEn: 'Rasad' },
      { name: 'سرار', nameAr: 'سرار', nameEn: 'Sarar' },
      { name: 'الوضيع', nameAr: 'الوضيع', nameEn: 'Al Wade\'a' }
    ]
  },
  {
    id: 'ye_mahrah',
    name: 'Al Mahrah',
    nameAr: 'المهرة',
    nameEn: 'Al Mahrah',
    districts: [
      { name: 'الغيضة', nameAr: 'الغيضة', nameEn: 'Al Ghaydah' },
      { name: 'سيحوت', nameAr: 'سيحوت', nameEn: 'Sayhut' },
      { name: 'قشن', nameAr: 'قشن', nameEn: 'Qishn' },
      { name: 'حوف', nameAr: 'حوف', nameEn: 'Hawf' },
      { name: 'شحن', nameAr: 'شحن', nameEn: 'Shahan' },
      { name: 'المسيلة', nameAr: 'المسيلة', nameEn: 'Al Masilah' },
      { name: 'حصوين', nameAr: 'حصوين', nameEn: 'Huswain' },
      { name: 'حات', nameAr: 'حات', nameEn: 'Hat' },
      { name: 'منعر', nameAr: 'منعر', nameEn: 'Man\'ar' }
    ]
  },
  {
    id: 'ye_saada',
    name: 'Sa\'ada',
    nameAr: 'صعدة',
    nameEn: 'Sa\'ada',
    districts: [
      { name: 'مدينة صعدة', nameAr: 'مدينة صعدة', nameEn: 'Sa\'ada City' },
      { name: 'سحار', nameAr: 'سحار', nameEn: 'Sahar' },
      { name: 'حيدان', nameAr: 'حيدان', nameEn: 'Haydan' },
      { name: 'رازح', nameAr: 'رازح', nameEn: 'Razih' },
      { name: 'شدا', nameAr: 'شدا', nameEn: 'Shada\'a' },
      { name: 'منبه', nameAr: 'منبه', nameEn: 'Monabbih' },
      { name: 'غمر', nameAr: 'غمر', nameEn: 'Ghamr' },
      { name: 'باقم', nameAr: 'باقم', nameEn: 'Baqim' },
      { name: 'كتاف والبقع', nameAr: 'كتاف والبقع', nameEn: 'Kitaf Wa Al Boqe\'e' },
      { name: 'الصفراء', nameAr: 'الصفراء', nameEn: 'As Safra' },
      { name: 'مجز', nameAr: 'مجز', nameEn: 'Majz' },
      { name: 'الظاهر', nameAr: 'الظاهر', nameEn: 'Adh Dhahir' }
    ]
  },
  {
    id: 'ye_dhamar',
    name: 'Dhamar',
    nameAr: 'ذمار',
    nameEn: 'Dhamar',
    districts: [
      { name: 'مدينة ذمار', nameAr: 'مدينة ذمار', nameEn: 'Dhamar City' },
      { name: 'عنس', nameAr: 'عنس', nameEn: 'Anss' },
      { name: 'معبر (جهران)', nameAr: 'معبر (جهران)', nameEn: 'Jahran (Ma\'bar)' },
      { name: 'ضوران آنس', nameAr: 'ضوران آنس', nameEn: 'Dhawran Anis' },
      { name: 'المنار', nameAr: 'المنار', nameEn: 'Al Manar' },
      { name: 'مغرب عنس', nameAr: 'مغرب عنس', nameEn: 'Maghrib Anss' },
      { name: 'ميفعة عنس', nameAr: 'ميفعة عنس', nameEn: 'Mayfa\'at Anss' },
      { name: 'عتمة', nameAr: 'عتمة', nameEn: 'Utmah' },
      { name: 'وصاب العالي', nameAr: 'وصاب العالي', nameEn: 'Wusab Al Ali' },
      { name: 'وصاب السافل', nameAr: 'وصاب السافل', nameEn: 'Wusab As Safil' },
      { name: 'الحداء', nameAr: 'الحداء', nameEn: 'Al Hada' }
    ]
  },
  {
    id: 'ye_amran',
    name: 'Amran',
    nameAr: 'عمران',
    nameEn: 'Amran',
    districts: [
      { name: 'مدينة عمران', nameAr: 'مدينة عمران', nameEn: 'Amran City' },
      { name: 'ريدة', nameAr: 'ريدة', nameEn: 'Raydah' },
      { name: 'خمر', nameAr: 'خمر', nameEn: 'Khamir' },
      { name: 'حوث', nameAr: 'حوث', nameEn: 'Huth' },
      { name: 'شهارة', nameAr: 'شهارة', nameEn: 'Shaharah' },
      { name: 'ثلاء', nameAr: 'ثلاء', nameEn: 'Thula' },
      { name: 'عيال سريح', nameAr: 'عيال سريح', nameEn: 'Iyal Surayh' },
      { name: 'جبل عيال يزيد', nameAr: 'جبل عيال يزيد', nameEn: 'Jabal Iyal Yazid' },
      { name: 'ذيبين', nameAr: 'ذيبين', nameEn: 'Dhibin' },
      { name: 'السودة', nameAr: 'السودة', nameEn: 'As Sawd' },
      { name: 'السود', nameAr: 'السود', nameEn: 'As Sudah' },
      { name: 'حرف سفيان', nameAr: 'حرف سفيان', nameEn: 'Harf Sufyan' },
      { name: 'بني صريم', nameAr: 'بني صريم', nameEn: 'Bani Suraim' },
      { name: 'المدان', nameAr: 'المدان', nameEn: 'Al Madan' },
      { name: 'ظليمة حبور', nameAr: 'ظليمة حبور', nameEn: 'Thulaimah' }
    ]
  },
  {
    id: 'ye_hajjah',
    name: 'Hajjah',
    nameAr: 'حجة',
    nameEn: 'Hajjah',
    districts: [
      { name: 'مدينة حجة', nameAr: 'مدينة حجة', nameEn: 'Hajjah City' },
      { name: 'عبس', nameAr: 'عبس', nameEn: 'Abs' },
      { name: 'حرض', nameAr: 'حرض', nameEn: 'Harad' },
      { name: 'ميدي', nameAr: 'ميدي', nameEn: 'Midi' },
      { name: 'المحابشة', nameAr: 'المحابشة', nameEn: 'Al Mahabishah' },
      { name: 'كحلان الشرف', nameAr: 'كحلان الشرف', nameEn: 'Kuhlan Ash Sharaf' },
      { name: 'كحلان عفار', nameAr: 'كحلان عفار', nameEn: 'Kuhlan Affar' },
      { name: 'قفل شمر', nameAr: 'قفل شمر', nameEn: 'Qufl Shamr' },
      { name: 'مستباء', nameAr: 'مستباء', nameEn: 'Mustaba' },
      { name: 'بكيل المير', nameAr: 'بكيل المير', nameEn: 'Bakil Al Mir' },
      { name: 'وشحة', nameAr: 'وشحة', nameEn: 'Washhah' },
      { name: 'كعيدنة', nameAr: 'كعيدنة', nameEn: 'Ku\'aydinah' },
      { name: 'أفلح اليمن', nameAr: 'أفلح اليمن', nameEn: 'Aflah Al Yaman' },
      { name: 'أفلح الشام', nameAr: 'أفلح الشام', nameEn: 'Aflah Ash Sham' },
      { name: 'خيران المحرق', nameAr: 'خيران المحرق', nameEn: 'Khayran Al Muharraq' },
      { name: 'أسلم', nameAr: 'أسلم', nameEn: 'Aslam' },
      { name: 'وضرة', nameAr: 'وضرة', nameEn: 'Wadrah' },
      { name: 'بني قيس', nameAr: 'بني قيس', nameEn: 'Bani Qays' },
      { name: 'شرس', nameAr: 'شرس', nameEn: 'Sharas' },
      { name: 'مبين', nameAr: 'مبين', nameEn: 'Mabyan' }
    ]
  },
  {
    id: 'ye_bayda',
    name: 'Al Bayda',
    nameAr: 'البيضاء',
    nameEn: 'Al Bayda',
    districts: [
      { name: 'مدينة البيضاء', nameAr: 'مدينة البيضاء', nameEn: 'Al Bayda City' },
      { name: 'رداع', nameAr: 'رداع', nameEn: 'Rada\'a' },
      { name: 'مكيراس', nameAr: 'مكيراس', nameEn: 'Mukayras' },
      { name: 'الزاهر', nameAr: 'الزاهر', nameEn: 'Az Zahir' },
      { name: 'ذي ناعم', nameAr: 'ذي ناعم', nameEn: 'Dhi Na\'im' },
      { name: 'الصومعة', nameAr: 'الصومعة', nameEn: 'As Sawma\'ah' },
      { name: 'مسورة', nameAr: 'مسورة', nameEn: 'Maswarah' },
      { name: 'ناطع', nameAr: 'ناطع', nameEn: 'Nata\'e' },
      { name: 'نعمان', nameAr: 'نعمان', nameEn: 'Na\'man' },
      { name: 'السوادية', nameAr: 'السوادية', nameEn: 'As Sawadiyah' },
      { name: 'الشرية', nameAr: 'الشرية', nameEn: 'Ash Sharyah' },
      { name: 'ردمان', nameAr: 'ردمان', nameEn: 'Radman Al Awad' },
      { name: 'ولد ربيع', nameAr: 'ولد ربيع', nameEn: 'Wald Rabi\'e' },
      { name: 'القريشية', nameAr: 'القريشية', nameEn: 'Al Qurayshiyah' }
    ]
  },
  {
    id: 'ye_mahwit',
    name: 'Al Mahwit',
    nameAr: 'المحويت',
    nameEn: 'Al Mahwit',
    districts: [
      { name: 'مدينة المحويت', nameAr: 'مدينة المحويت', nameEn: 'Al Mahwit City' },
      { name: 'شبام كوكبان', nameAr: 'شبام كوكبان', nameEn: 'Shibam Kawkaban' },
      { name: 'الطويلة', nameAr: 'الطويلة', nameEn: 'At Tawilah' },
      { name: 'الرجم', nameAr: 'الرجم', nameEn: 'Ar Rujum' },
      { name: 'ملحان', nameAr: 'ملحان', nameEn: 'Milhan' },
      { name: 'حفاش', nameAr: 'حفاش', nameEn: 'Hufash' },
      { name: 'الخبت', nameAr: 'الخبت', nameEn: 'Al Khabt' },
      { name: 'بني سعد', nameAr: 'بني سعد', nameEn: 'Bani Sa\'d' }
    ]
  },
  {
    id: 'ye_raymah',
    name: 'Raymah',
    nameAr: 'ريمة',
    nameEn: 'Raymah',
    districts: [
      { name: 'الجبين', nameAr: 'الجبين', nameEn: 'Al Jabin' },
      { name: 'بلاد الطعام', nameAr: 'بلاد الطعام', nameEn: 'Bilad At Ta\'am' },
      { name: 'السلفية', nameAr: 'السلفية', nameEn: 'As Salafiyah' },
      { name: 'الجعفرية', nameAr: 'الجعفرية', nameEn: 'Al Jafariyah' },
      { name: 'كسمة', nameAr: 'كسمة', nameEn: 'Kusmah' },
      { name: 'مزهر', nameAr: 'مزهر', nameEn: 'Mazhar' }
    ]
  },
  {
    id: 'ye_jawf',
    name: 'Al Jawf',
    nameAr: 'الجوف',
    nameEn: 'Al Jawf',
    districts: [
      { name: 'الحزم', nameAr: 'الحزم', nameEn: 'Al Hazm' },
      { name: 'المتون', nameAr: 'المتون', nameEn: 'Al Maton' },
      { name: 'المصلوب', nameAr: 'المصلوب', nameEn: 'Al Maslub' },
      { name: 'الغيل', nameAr: 'الغيل', nameEn: 'Al Ghayl' },
      { name: 'الخلق', nameAr: 'الخلق', nameEn: 'Al Khalaq' },
      { name: 'خب والشعف', nameAr: 'خب والشعف', nameEn: 'Khabb Wa Ash Sha\'af' },
      { name: 'برط العنان', nameAr: 'برط العنان', nameEn: 'Barat Al Anan' },
      { name: 'رجوزة', nameAr: 'رجوزة', nameEn: 'Rajuzah' },
      { name: 'خراب المراشي', nameAr: 'خراب المراشي', nameEn: 'Kharab Al Marashi' },
      { name: 'الحميدات', nameAr: 'الحميدات', nameEn: 'Al Humaydat' },
      { name: 'المطمة', nameAr: 'المطمة', nameEn: 'Al Matammah' }
    ]
  },
  {
    id: 'ye_socotra',
    name: 'Socotra',
    nameAr: 'سقطرى',
    nameEn: 'Socotra',
    districts: [
      { name: 'حديبو', nameAr: 'حديبو', nameEn: 'Hadibu' },
      { name: 'قلنسية وعبد الكوري', nameAr: 'قلنسية وعبد الكوري', nameEn: 'Qulensya Wa Abd Al Kuri' }
    ]
  }
];

export const getGovernorateById = (id: string): Governorate | undefined => {
  return YEMEN_GOVERNORATES.find(g => g.id === id || g.id === id.replace('loc_', ''));
};
