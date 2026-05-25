
// Geographic hierarchy: Country → Region/Province → Districts → Locations
// Used by the App Level configuration in System Settings

export type GeoLocation = string;

export type GeoDistrict = {
  name: string;
  locations: GeoLocation[];
};

export type GeoRegion = {
  [regionName: string]: GeoDistrict[];
};

export type GeoData = {
  [country: string]: GeoRegion;
};

export const GEO_DATA: GeoData = {
  Malawi: {
    'Northern Region': [
      { name: 'Chitipa', locations: ['Chitipa Boma', 'Nthalire', 'Kapoka'] },
      { name: 'Karonga', locations: ['Karonga Boma', 'Chilumba', 'Ngana', 'Kaporo'] },
      { name: 'Likoma', locations: ['Likoma Island', 'Chizumulu'] },
      { name: 'Mzimba', locations: ['Mzuzu', 'Ekwendeni', 'Embangweni', 'Euthini', 'Mzimba Boma'] },
      { name: 'Nkhata Bay', locations: ['Nkhata Bay Boma', 'Chintheche', 'Bandawe', 'Kande'] },
      { name: 'Rumphi', locations: ['Rumphi Boma', 'Nyika', 'Bolero', 'Katumbi'] },
    ],
    'Central Region': [
      { name: 'Dedza', locations: ['Dedza Boma', 'Linthipe', 'Ntakataka', 'Lobi'] },
      { name: 'Dowa', locations: ['Dowa Boma', 'Mponela', 'Madisi', 'Mvera'] },
      { name: 'Kasungu', locations: ['Kasungu Boma', 'Kasungu Town', 'Bua', 'Chamama'] },
      { name: 'Lilongwe', locations: ['Area 47', 'Area 18', 'Area 25', 'Area 36', 'Kauma', 'Kawale', 'Chilinde', 'Lumbadzi', 'Lilongwe City Centre'] },
      { name: 'Mchinji', locations: ['Mchinji Boma', 'Kapiri', 'Mkanda', 'Chioza'] },
      { name: 'Nkhotakota', locations: ['Nkhotakota Boma', 'Dwambazi', 'Benga', 'Malengachanzi'] },
      { name: 'Ntcheu', locations: ['Ntcheu Boma', 'Balaka', 'Golomoti', 'Tsangano'] },
      { name: 'Ntchisi', locations: ['Ntchisi Boma', 'Nkhulambe', 'Chinthembwe'] },
      { name: 'Salima', locations: ['Salima Boma', 'Senga Bay', 'Nankumba', 'Chipoka'] },
    ],
    'Southern Region': [
      { name: 'Balaka', locations: ['Balaka Boma', 'Nkaya', 'Ulongwe'] },
      { name: 'Blantyre', locations: ['Chirimba', 'Ndirande', 'Kanjedza', 'Chilomoni', 'Limbe', 'Bangwe', 'Misesa', 'Zingwangwa', 'Blantyre CBD'] },
      { name: 'Chikwawa', locations: ['Chikwawa Boma', 'Nchalo', 'Ngabu', 'Makhanga'] },
      { name: 'Chiradzulu', locations: ['Chiradzulu Boma', 'Chiradzulu Town', 'Thekerani', 'Lirangwe'] },
      { name: 'Machinga', locations: ['Machinga Boma', 'Liwonde', 'Namwera', 'Mtema'] },
      { name: 'Mangochi', locations: ['Mangochi Boma', 'Monkey Bay', 'Chipoka', 'Namwera', 'Lungwena'] },
      { name: 'Mulanje', locations: ['Mulanje Boma', 'Mulanje Town', 'Chitakale', 'Phalombe'] },
      { name: 'Mwanza', locations: ['Mwanza Boma', 'Neno', 'Mwanza Town'] },
      { name: 'Neno', locations: ['Neno Boma', 'Lisungwe', 'Dambe'] },
      { name: 'Nsanje', locations: ['Nsanje Boma', 'Bangula', 'Port Herald', 'Tengani'] },
      { name: 'Thyolo', locations: ['Thyolo Boma', 'Cholo', 'Makwasa', 'Luchenza'] },
      { name: 'Zomba', locations: ['Zomba City', 'Zomba CBD', 'Nalisi', 'Mposa', 'Matawale'] },
      { name: 'Phalombe', locations: ['Phalombe Boma', 'Chitakale', 'Naminjiwa'] },
    ],
  },

  Zambia: {
    'Lusaka Province': [
      { name: 'Lusaka', locations: ['Lusaka CBD', 'Chilenje', 'Kabulonga', 'Chelston', 'Emmasdale', 'Kalingalinga', 'Garden'] },
      { name: 'Chongwe', locations: ['Chongwe Boma', 'Rufunsa', 'Chalimbana'] },
      { name: 'Kafue', locations: ['Kafue Town', 'Ngombe', 'Makeni'] },
      { name: 'Luangwa', locations: ['Luangwa Boma', 'Mwanachingwala'] },
    ],
    'Copperbelt Province': [
      { name: 'Kitwe', locations: ['Kitwe CBD', 'Nkana East', 'Riverside', 'Parklands', 'Mindolo'] },
      { name: 'Ndola', locations: ['Ndola CBD', 'Kansenshi', 'Itawa', 'Chifubu', 'Chipulukusu'] },
      { name: 'Chingola', locations: ['Chingola Boma', 'Chingola Town', 'Nchanga'] },
      { name: 'Mufulira', locations: ['Mufulira Boma', 'Kantanshi', 'Kamuchanga'] },
      { name: 'Kalulushi', locations: ['Kalulushi Town', 'Chamboli'] },
      { name: 'Luanshya', locations: ['Luanshya Town', 'Roan', 'Mikomfwa'] },
    ],
    'Eastern Province': [
      { name: 'Chipata', locations: ['Chipata Boma', 'Chipata Town', 'Katete', 'Kasenengwa'] },
      { name: 'Petauke', locations: ['Petauke Boma', 'Sinda', 'Nyimba'] },
      { name: 'Lundazi', locations: ['Lundazi Boma', 'Chama', 'Muyombe'] },
    ],
    'Southern Province': [
      { name: 'Livingstone', locations: ['Livingstone CBD', 'Linda', 'Libuyu', 'Dambwa', 'Maramba'] },
      { name: 'Choma', locations: ['Choma Boma', 'Pemba', 'Batoka'] },
      { name: 'Mazabuka', locations: ['Mazabuka Boma', 'Kaleya', 'Magoye'] },
      { name: 'Monze', locations: ['Monze Boma', 'Niko', 'Chivuna'] },
    ],
    'Northern Province': [
      { name: 'Kasama', locations: ['Kasama Boma', 'Kasama Town', 'Chambeshi', 'Malole'] },
      { name: 'Mbala', locations: ['Mbala Boma', 'Mpulungu', 'Nakonde'] },
    ],
    'Western Province': [
      { name: 'Mongu', locations: ['Mongu Boma', 'Mongu Town', 'Limulunga', 'Kanyonyo'] },
      { name: 'Senanga', locations: ['Senanga Boma', 'Sioma'] },
    ],
    'North-Western Province': [
      { name: 'Solwezi', locations: ['Solwezi Boma', 'Solwezi Town', 'Mufumbwe'] },
      { name: 'Kabompo', locations: ['Kabompo Boma'] },
    ],
    'Luapula Province': [
      { name: 'Mansa', locations: ['Mansa Boma', 'Mansa Town', 'Samfya'] },
      { name: 'Kawambwa', locations: ['Kawambwa Boma', 'Nchelenge'] },
    ],
    'Muchinga Province': [
      { name: 'Mpika', locations: ['Mpika Boma', 'Shiwang\'andu'] },
      { name: 'Chinsali', locations: ['Chinsali Boma', 'Isoka'] },
    ],
    'Central Province': [
      { name: 'Kabwe', locations: ['Kabwe Boma', 'Kabwe CBD', 'Mahatma Gandhi', 'Katondo'] },
      { name: 'Mkushi', locations: ['Mkushi Boma', 'Serenje'] },
      { name: 'Kapiri Mposhi', locations: ['Kapiri Mposhi Boma', 'Kapiri Town'] },
    ],
  },

  Zimbabwe: {
    'Harare Province': [
      { name: 'Harare', locations: ['Harare CBD', 'Borrowdale', 'Avondale', 'Chitungwiza', 'Highfields', 'Mbare', 'Glen View'] },
      { name: 'Epworth', locations: ['Epworth'] },
      { name: 'Ruwa', locations: ['Ruwa Town'] },
    ],
    'Bulawayo Province': [
      { name: 'Bulawayo', locations: ['Bulawayo CBD', 'Nkulumane', 'Tshabalala', 'Lobengula', 'Mpopoma', 'Cowdray Park'] },
    ],
    'Manicaland Province': [
      { name: 'Mutare', locations: ['Mutare CBD', 'Sakubva', 'Dangamvura', 'Hobhouse'] },
      { name: 'Chipinge', locations: ['Chipinge Town', 'Chiredzi'] },
      { name: 'Makoni', locations: ['Rusape', 'Headlands'] },
    ],
    'Mashonaland East': [
      { name: 'Marondera', locations: ['Marondera Town', 'Vengere', 'Domboshava'] },
      { name: 'Mutoko', locations: ['Mutoko Town'] },
    ],
    'Mashonaland West': [
      { name: 'Chinhoyi', locations: ['Chinhoyi CBD', 'Chinhoyi Town', 'Karoi'] },
      { name: 'Kariba', locations: ['Kariba Town', 'Nyamhunga'] },
    ],
    'Midlands Province': [
      { name: 'Gweru', locations: ['Gweru CBD', 'Mkoba', 'Senga', 'Mambo'] },
      { name: 'Kwekwe', locations: ['Kwekwe CBD', 'Amaveni', 'Mbizo'] },
      { name: 'Shurugwi', locations: ['Shurugwi Town', 'Torwood'] },
    ],
    'Masvingo Province': [
      { name: 'Masvingo', locations: ['Masvingo CBD', 'Rujeko', 'Mucheke'] },
      { name: 'Chiredzi', locations: ['Chiredzi Town', 'Triangle'] },
    ],
    'Matabeleland North': [
      { name: 'Hwange', locations: ['Hwange Town', 'Colliery', 'Empumalanga'] },
      { name: 'Victoria Falls', locations: ['Victoria Falls Town', 'Chinotimba'] },
    ],
    'Matabeleland South': [
      { name: 'Gwanda', locations: ['Gwanda Town', 'West Nicholson'] },
      { name: 'Beitbridge', locations: ['Beitbridge Town'] },
    ],
  },

  Tanzania: {
    'Dar es Salaam': [
      { name: 'Kinondoni', locations: ['Kinondoni', 'Msasani', 'Kawe', 'Mbweni', 'Makongo'] },
      { name: 'Ilala', locations: ['Ilala CBD', 'Kariakoo', 'Gerezani', 'Kisutu', 'Kivukoni'] },
      { name: 'Temeke', locations: ['Temeke', 'Mbagala', 'Kigamboni', 'Chang\'ombe'] },
      { name: 'Ubungo', locations: ['Ubungo', 'Kimara', 'Kibamba', 'Mbezi'] },
      { name: 'Kigamboni', locations: ['Kigamboni', 'Kibada', 'Pemba Mnazi'] },
    ],
    'Arusha': [
      { name: 'Arusha City', locations: ['Arusha CBD', 'Sakina', 'Kaloleni', 'Themi'] },
      { name: 'Meru', locations: ['Tengeru', 'Usa River', 'Ngarenaro'] },
      { name: 'Arumeru', locations: ['Usa River', 'Maji ya Chai', 'Ngurdoto'] },
    ],
    'Mwanza': [
      { name: 'Nyamagana', locations: ['Nyamagana', 'Mwanza CBD', 'Bugando'] },
      { name: 'Ilemela', locations: ['Ilemela', 'Kirumba', 'Buswelu'] },
    ],
    'Dodoma': [
      { name: 'Dodoma Urban', locations: ['Dodoma CBD', 'Makole', 'Nzuguni', 'Ipagala'] },
      { name: 'Chamwino', locations: ['Chamwino', 'Idifu'] },
    ],
    'Mbeya': [
      { name: 'Mbeya City', locations: ['Mbeya CBD', 'Uyole', 'Iganzo', 'Mwanjelwa'] },
      { name: 'Rungwe', locations: ['Tukuyu', 'Ipinda'] },
    ],
    'Morogoro': [
      { name: 'Morogoro Urban', locations: ['Morogoro CBD', 'Kihonda', 'Mji Mpya', 'Mwembe'] },
      { name: 'Mvomero', locations: ['Hombolo', 'Turiani'] },
    ],
  },

  Kenya: {
    'Nairobi County': [
      { name: 'Westlands', locations: ['Westlands', 'Parklands', 'Highridge', 'Karura'] },
      { name: 'Dagoretti', locations: ['Dagoretti', 'Kawangware', 'Ngando', 'Riruta'] },
      { name: 'Lang\'ata', locations: ['Lang\'ata', 'Karen', 'South C', 'South B'] },
      { name: 'Embakasi', locations: ['Embakasi', 'Umoja', 'Donholm', 'Komarock'] },
      { name: 'Makadara', locations: ['Makadara', 'Maringo', 'Viwandani', 'Harambee'] },
      { name: 'Kasarani', locations: ['Kasarani', 'Roysambu', 'Clay City', 'Githurai'] },
      { name: 'Ruaraka', locations: ['Ruaraka', 'Baba Dogo', 'Utalii', 'Mathare North'] },
      { name: 'Starehe', locations: ['Starehe', 'Nairobi CBD', 'Ngara', 'Pangani'] },
      { name: 'Kamukunji', locations: ['Kamukunji', 'Eastleigh', 'Pumwani'] },
      { name: 'Kibra', locations: ['Kibra', 'Woodley', 'Sarangombe'] },
    ],
    'Mombasa County': [
      { name: 'Mvita', locations: ['Mombasa CBD', 'Old Town', 'Tudor', 'Majengo'] },
      { name: 'Likoni', locations: ['Likoni', 'Shelly Beach', 'Mtongwe'] },
      { name: 'Kisauni', locations: ['Kisauni', 'Bamburi', 'Shanzu'] },
      { name: 'Nyali', locations: ['Nyali', 'Mkomani', 'Ziwa la Ng\'ombe'] },
    ],
    'Kisumu County': [
      { name: 'Kisumu Central', locations: ['Kisumu CBD', 'Milimani', 'Railways', 'Market'] },
      { name: 'Kisumu East', locations: ['Kajulu', 'Kolwa East'] },
      { name: 'Muhoroni', locations: ['Muhoroni Town', 'Fort Ternan'] },
    ],
    'Nakuru County': [
      { name: 'Nakuru Town East', locations: ['Nakuru CBD', 'Free Area', 'Biashara'] },
      { name: 'Nakuru Town West', locations: ['Lanet', 'London', 'Barut'] },
      { name: 'Naivasha', locations: ['Naivasha Town', 'Kongoni', 'Maiella'] },
    ],
    'Kiambu County': [
      { name: 'Thika Town', locations: ['Thika Town', 'Landless', 'Ngenda'] },
      { name: 'Ruiru', locations: ['Ruiru Town', 'Gitothua', 'Kahawa Sukari'] },
      { name: 'Kiambu Town', locations: ['Kiambu Town', 'Karuri', 'Ndenderu'] },
    ],
  },

  Uganda: {
    'Central Region': [
      { name: 'Kampala', locations: ['Kampala CBD', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'] },
      { name: 'Wakiso', locations: ['Entebbe', 'Nansana', 'Kira', 'Mukono'] },
      { name: 'Mukono', locations: ['Mukono Town', 'Seeta', 'Goma'] },
    ],
    'Eastern Region': [
      { name: 'Jinja', locations: ['Jinja CBD', 'Walukuba', 'Mpumudde', 'Bugembe'] },
      { name: 'Mbale', locations: ['Mbale CBD', 'Industrial Division', 'Wanale'] },
      { name: 'Tororo', locations: ['Tororo CBD', 'Tororo Industrial'] },
    ],
    'Western Region': [
      { name: 'Mbarara', locations: ['Mbarara CBD', 'Kakoba', 'Kamukuzi', 'Nyamitanga'] },
      { name: 'Fort Portal', locations: ['Fort Portal City', 'Kabarole'] },
      { name: 'Kasese', locations: ['Kasese Town', 'Hima'] },
    ],
    'Northern Region': [
      { name: 'Gulu', locations: ['Gulu CBD', 'Bardege', 'Laroo', 'Pece'] },
      { name: 'Lira', locations: ['Lira CBD', 'Aromo', 'Adyel'] },
      { name: 'Arua', locations: ['Arua CBD', 'Ayivu', 'Vurra'] },
    ],
  },

  'South Africa': {
    'Gauteng': [
      { name: 'City of Johannesburg', locations: ['Johannesburg CBD', 'Sandton', 'Soweto', 'Alexandra', 'Randburg', 'Roodepoort'] },
      { name: 'City of Tshwane', locations: ['Pretoria CBD', 'Centurion', 'Soshanguve', 'Mamelodi', 'Atteridgeville'] },
      { name: 'Ekurhuleni', locations: ['Germiston', 'Benoni', 'Boksburg', 'Springs', 'Thokoza'] },
      { name: 'West Rand', locations: ['Krugersdorp', 'Randfontein', 'Westonaria'] },
    ],
    'Western Cape': [
      { name: 'City of Cape Town', locations: ['Cape Town CBD', 'Mitchells Plain', 'Khayelitsha', 'Bellville', 'Mitchells Plain'] },
      { name: 'George', locations: ['George Town', 'Pacaltsdorp', 'Thembalethu'] },
      { name: 'Stellenbosch', locations: ['Stellenbosch Town', 'Kayamandi', 'Cloetesville'] },
    ],
    'KwaZulu-Natal': [
      { name: 'eThekwini (Durban)', locations: ['Durban CBD', 'Umlazi', 'Inanda', 'KwaMashu', 'Pinetown'] },
      { name: 'uMsunduzi (Pietermaritzburg)', locations: ['Pietermaritzburg CBD', 'Edendale', 'Northdale'] },
      { name: 'Newcastle', locations: ['Newcastle Town', 'Madadeni', 'Osizweni'] },
    ],
    'Eastern Cape': [
      { name: 'Buffalo City (East London)', locations: ['East London CBD', 'Mdantsane', 'Scenery Park', 'Cambridge'] },
      { name: 'Nelson Mandela Bay (Port Elizabeth)', locations: ['Port Elizabeth CBD', 'KwaDwesi', 'Motherwell', 'New Brighton'] },
    ],
    'Limpopo': [
      { name: 'Polokwane', locations: ['Polokwane CBD', 'Seshego', 'Bendor', 'Flora Park'] },
      { name: 'Tzaneen', locations: ['Tzaneen Town', 'Nkowankowa'] },
    ],
    'Mpumalanga': [
      { name: 'Mbombela (Nelspruit)', locations: ['Nelspruit CBD', 'Matsulu', 'Tekwane'] },
      { name: 'Steve Tshwete (Middelburg)', locations: ['Middelburg Town', 'Middelburg Ext'] },
    ],
    'North West': [
      { name: 'Mahikeng', locations: ['Mahikeng CBD', 'Mmabatho', 'Montshiwa'] },
      { name: 'Rustenburg', locations: ['Rustenburg CBD', 'Boitekong', 'Tlhabane'] },
    ],
    'Free State': [
      { name: 'Mangaung (Bloemfontein)', locations: ['Bloemfontein CBD', 'Botshabelo', 'Thaba Nchu', 'Mangaung'] },
      { name: 'Matjhabeng (Welkom)', locations: ['Welkom Town', 'Thabong', 'Bronville'] },
    ],
    'Northern Cape': [
      { name: 'Sol Plaatje (Kimberley)', locations: ['Kimberley CBD', 'Galeshewe', 'Roodepan'] },
    ],
  },

  Ethiopia: {
    'Addis Ababa': [
      { name: 'Addis Ketema', locations: ['Addis Ketema', 'Mercato', 'Arada'] },
      { name: 'Bole', locations: ['Bole', 'Lemi Kura', 'CMC'] },
      { name: 'Kirkos', locations: ['Kirkos', 'Kazanchis', 'Piassa'] },
      { name: 'Yeka', locations: ['Yeka', 'Entoto', 'Shiro Meda'] },
      { name: 'Kolfe Keranio', locations: ['Kolfe', 'Keranio', 'Goro'] },
    ],
    'Oromia': [
      { name: 'Jimma', locations: ['Jimma Town', 'Agaro', 'Serbo'] },
      { name: 'Adama (Nazret)', locations: ['Adama CBD', 'Koka', 'Boku'] },
      { name: 'Dire Dawa', locations: ['Dire Dawa City', 'Sabiyan', 'Gendekore'] },
    ],
    'Amhara': [
      { name: 'Bahir Dar', locations: ['Bahir Dar City', 'Sefene Selam', 'Tis Abay'] },
      { name: 'Gondar', locations: ['Gondar City', 'Kinfaz', 'Azezo'] },
      { name: 'Dessie', locations: ['Dessie City', 'Kombolcha'] },
    ],
    'Tigray': [
      { name: 'Mekelle', locations: ['Mekelle City', 'Ayder', 'Adi Haki'] },
    ],
    'SNNP': [
      { name: 'Hawassa', locations: ['Hawassa City', 'Tabor', 'Mehal Ketema'] },
      { name: 'Arba Minch', locations: ['Arba Minch', 'Sikela', 'Shecha'] },
    ],
  },

  Ghana: {
    'Greater Accra': [
      { name: 'Accra Metropolitan', locations: ['Accra CBD', 'Adabraka', 'Osu', 'Asylum Down', 'Nima', 'Labadi'] },
      { name: 'Tema Metropolitan', locations: ['Tema Community 1', 'Community 5', 'Community 18', 'Manhean'] },
      { name: 'Ga South Municipal', locations: ['Weija', 'Kasoa', 'Obom'] },
      { name: 'Ga East Municipal', locations: ['Madina', 'Agbogba', 'Adenta'] },
    ],
    'Ashanti': [
      { name: 'Kumasi Metropolitan', locations: ['Kumasi CBD', 'Bantama', 'Asokwa', 'Suame', 'Nhyiaeso'] },
      { name: 'Obuasi Municipal', locations: ['Obuasi Town', 'Tutuka', 'Sanso'] },
    ],
    'Western': [
      { name: 'Sekondi-Takoradi Metropolitan', locations: ['Takoradi CBD', 'Sekondi', 'Effia', 'Kojokrom'] },
      { name: 'Ahanta West', locations: ['Agona Nkwanta', 'Dixcove'] },
    ],
    'Central': [
      { name: 'Cape Coast Metropolitan', locations: ['Cape Coast CBD', 'Abura', 'Siwdo'] },
      { name: 'Asikuma-Odoben-Brakwa', locations: ['Breman Asikuma'] },
    ],
    'Northern': [
      { name: 'Tamale Metropolitan', locations: ['Tamale CBD', 'Sakasaka', 'Kalpohin', 'Nyohini'] },
      { name: 'Sagnarigu Municipal', locations: ['Sagnarigu', 'Kadia', 'Zagyuri'] },
    ],
    'Volta': [
      { name: 'Ho Municipal', locations: ['Ho CBD', 'Bankoe', 'Heve'] },
      { name: 'Keta Municipal', locations: ['Keta Town', 'Anyako'] },
    ],
    'Eastern': [
      { name: 'Koforidua (New Juaben)', locations: ['Koforidua CBD', 'Effiduase', 'Jumapo'] },
      { name: 'Suhum Municipal', locations: ['Suhum Town'] },
    ],
  },

  Nigeria: {
    'Lagos State': [
      { name: 'Lagos Island', locations: ['Lagos Island CBD', 'Victoria Island', 'Ikoyi', 'Apapa'] },
      { name: 'Lagos Mainland', locations: ['Yaba', 'Surulere', 'Mushin', 'Oshodi', 'Agege'] },
      { name: 'Ikeja', locations: ['Ikeja GRA', 'Maryland', 'Allen Avenue', 'Alausa'] },
      { name: 'Lekki', locations: ['Lekki Phase 1', 'Lekki Phase 2', 'Ajah', 'Chevron', 'VGC'] },
      { name: 'Alimosho', locations: ['Ipaja', 'Egbeda', 'Idimu', 'Shasha', 'Akowonjo'] },
    ],
    'Abuja FCT': [
      { name: 'Abuja Municipal', locations: ['Abuja Central', 'Maitama', 'Asokoro', 'Garki', 'Wuse', 'Gwarinpa'] },
      { name: 'Bwari', locations: ['Bwari', 'Dutse', 'Ushafa'] },
      { name: 'Kuje', locations: ['Kuje', 'Gwagwalada'] },
    ],
    'Kano State': [
      { name: 'Kano Municipal', locations: ['Kano CBD', 'Fagge', 'Dala', 'Gwale', 'Nassarawa'] },
      { name: 'Tarauni', locations: ['Tarauni', 'Ungogo'] },
    ],
    'Rivers State': [
      { name: 'Port Harcourt City', locations: ['Port Harcourt CBD', 'Trans-Amadi', 'Diobu', 'Rumuola', 'Rumuokoro'] },
      { name: 'Obio-Akpor', locations: ['Rumuola', 'Rumuigbo', 'Eligbam'] },
    ],
    'Oyo State': [
      { name: 'Ibadan North', locations: ['Ibadan CBD', 'Bodija', 'Ring Road', 'Sango'] },
      { name: 'Ibadan South-West', locations: ['Adamasingba', 'Agodi', 'Oke-Ado'] },
    ],
  },
};

/**
 * Get all countries available in geo data
 */
export function getCountries(): string[] {
  return Object.keys(GEO_DATA);
}

/**
 * Get regions/provinces for a given country
 */
export function getRegions(country: string): string[] {
  return Object.keys(GEO_DATA[country] || {});
}

/**
 * Get districts for a given country + region
 */
export function getDistricts(country: string, region: string): GeoDistrict[] {
  return GEO_DATA[country]?.[region] || [];
}

/**
 * Get district names only for a given country + region
 */
export function getDistrictNames(country: string, region: string): string[] {
  return getDistricts(country, region).map(d => d.name);
}

/**
 * Get locations for a given country + region + district
 */
export function getLocations(country: string, region: string, districtName: string): string[] {
  const districts = getDistricts(country, region);
  const district = districts.find(d => d.name === districtName);
  return district?.locations || [];
}

/**
 * Get all districts across all regions for a country (used at National level)
 */
export function getAllDistrictsForCountry(country: string): string[] {
  const regions = getRegions(country);
  const all: string[] = [];
  for (const region of regions) {
    for (const d of getDistricts(country, region)) {
      all.push(d.name);
    }
  }
  return all;
}

/**
 * Get all locations across a region (used at Region level)
 */
export function getAllLocationsForRegion(country: string, region: string): string[] {
  const districts = getDistricts(country, region);
  const all: string[] = [];
  for (const d of districts) {
    all.push(...d.locations);
  }
  return all;
}
