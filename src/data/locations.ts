export type ProvinceName =
  | 'All Provinces'
  | 'Khyber Pakhtunkhwa'
  | 'Punjab'
  | 'Sindh'
  | 'Islamabad Capital Territory'
  | 'Balochistan';

export interface ProvinceLocationData {
  province: Exclude<ProvinceName, 'All Provinces'>;
  cities: {
    city: string;
    areas: string[];
  }[];
}

export const PAKISTAN_LOCATIONS: ProvinceLocationData[] = [
  {
    province: 'Khyber Pakhtunkhwa',
    cities: [
      {
        city: 'Peshawar',
        areas: [
          'University Road',
          'Hayatabad Phase 3',
          'Hayatabad Phase 5',
          'Saddar Bazaar',
          'Warsak Road',
          'Gulbahar',
          'Board Bazaar',
          'Tehkal',
          'Cantt',
        ],
      },
      {
        city: 'Mardan',
        areas: ['Sheikh Maltoon Town', 'Bank Road', 'Baghdada', 'Par Hoti'],
      },
      {
        city: 'Abbottabad',
        areas: ['Mansehra Road', 'Jinnahabad', 'Supply Bazaar', 'Mandian'],
      },
    ],
  },
  {
    province: 'Punjab',
    cities: [
      {
        city: 'Lahore',
        areas: ['Gulberg III', 'DHA Phase 5', 'Johar Town', 'Model Town', 'Bahria Town'],
      },
      {
        city: 'Rawalpindi',
        areas: ['Saddar Cantt', 'Bahria Town Phase 7', 'Chaklala Scheme III', 'Satellite Town'],
      },
      {
        city: 'Multan',
        areas: ['Cantt', 'Model Town', 'Gulgasht Colony', 'Shah Rukn-e-Alam'],
      },
    ],
  },
  {
    province: 'Sindh',
    cities: [
      {
        city: 'Karachi',
        areas: ['Clifton Block 4', 'Gulshan-e-Iqbal', 'DHA Phase 6', 'Saddar', 'PECHS'],
      },
    ],
  },
  {
    province: 'Islamabad Capital Territory',
    cities: [
      {
        city: 'Islamabad',
        areas: ['F-7 Markaz', 'G-11 Markaz', 'Blue Area', 'E-11', 'I-8 Markaz'],
      },
    ],
  },
  {
    province: 'Balochistan',
    cities: [
      {
        city: 'Quetta',
        areas: ['Jinnah Road', 'Satellite Town', 'Model Town', 'Cantt'],
      },
    ],
  },
];

export function getProvinceForCity(city: string): ProvinceName {
  if (city === 'All Cities') return 'All Provinces';
  for (const entry of PAKISTAN_LOCATIONS) {
    if (entry.cities.some((c) => c.city === city)) {
      return entry.province;
    }
  }
  return 'Khyber Pakhtunkhwa';
}

export function getCitiesForProvince(province: ProvinceName): string[] {
  if (province === 'All Provinces') {
    return PAKISTAN_LOCATIONS.flatMap((p) => p.cities.map((c) => c.city));
  }
  const found = PAKISTAN_LOCATIONS.find((p) => p.province === province);
  return found ? found.cities.map((c) => c.city) : [];
}

export function getAreasForCity(city: string): string[] {
  if (!city || city === 'All Cities') return [];
  for (const entry of PAKISTAN_LOCATIONS) {
    const match = entry.cities.find((c) => c.city === city);
    if (match) return match.areas;
  }
  return [];
}
