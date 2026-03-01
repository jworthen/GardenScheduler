import { FrostDateInfo } from '../types';

// USDA Hardiness Zone approximate last spring frost and first fall frost dates
// These are averages and may vary by microclimate
export const zoneData: Record<number, { lastSpringFrost: string; firstFallFrost: string; description: string }> = {
  3: { lastSpringFrost: '05-15', firstFallFrost: '09-15', description: 'Zone 3: -40°F to -30°F' },
  4: { lastSpringFrost: '05-01', firstFallFrost: '09-30', description: 'Zone 4: -30°F to -20°F' },
  5: { lastSpringFrost: '04-15', firstFallFrost: '10-15', description: 'Zone 5: -20°F to -10°F' },
  6: { lastSpringFrost: '04-01', firstFallFrost: '10-31', description: 'Zone 6: -10°F to 0°F' },
  7: { lastSpringFrost: '03-15', firstFallFrost: '11-15', description: 'Zone 7: 0°F to 10°F' },
  8: { lastSpringFrost: '03-01', firstFallFrost: '11-30', description: 'Zone 8: 10°F to 20°F' },
  9: { lastSpringFrost: '02-01', firstFallFrost: '12-15', description: 'Zone 9: 20°F to 30°F' },
  10: { lastSpringFrost: '01-15', firstFallFrost: '12-31', description: 'Zone 10: 30°F to 40°F' },
  11: { lastSpringFrost: '01-01', firstFallFrost: '12-31', description: 'Zone 11: above 40°F (frost-free)' },
};

// State-based zone lookups (using median zone for each state)
// Based on USDA plant hardiness zone map data
export const stateZoneData: Record<string, { zone: number; name: string }> = {
  'AL': { zone: 7, name: 'Alabama' },
  'AK': { zone: 3, name: 'Alaska' },
  'AZ': { zone: 8, name: 'Arizona' },
  'AR': { zone: 7, name: 'Arkansas' },
  'CA': { zone: 9, name: 'California' },
  'CO': { zone: 5, name: 'Colorado' },
  'CT': { zone: 6, name: 'Connecticut' },
  'DE': { zone: 7, name: 'Delaware' },
  'FL': { zone: 10, name: 'Florida' },
  'GA': { zone: 8, name: 'Georgia' },
  'HI': { zone: 11, name: 'Hawaii' },
  'ID': { zone: 5, name: 'Idaho' },
  'IL': { zone: 5, name: 'Illinois' },
  'IN': { zone: 5, name: 'Indiana' },
  'IA': { zone: 5, name: 'Iowa' },
  'KS': { zone: 6, name: 'Kansas' },
  'KY': { zone: 6, name: 'Kentucky' },
  'LA': { zone: 9, name: 'Louisiana' },
  'ME': { zone: 4, name: 'Maine' },
  'MD': { zone: 7, name: 'Maryland' },
  'MA': { zone: 6, name: 'Massachusetts' },
  'MI': { zone: 5, name: 'Michigan' },
  'MN': { zone: 4, name: 'Minnesota' },
  'MS': { zone: 8, name: 'Mississippi' },
  'MO': { zone: 6, name: 'Missouri' },
  'MT': { zone: 4, name: 'Montana' },
  'NE': { zone: 5, name: 'Nebraska' },
  'NV': { zone: 7, name: 'Nevada' },
  'NH': { zone: 5, name: 'New Hampshire' },
  'NJ': { zone: 7, name: 'New Jersey' },
  'NM': { zone: 7, name: 'New Mexico' },
  'NY': { zone: 5, name: 'New York' },
  'NC': { zone: 7, name: 'North Carolina' },
  'ND': { zone: 3, name: 'North Dakota' },
  'OH': { zone: 5, name: 'Ohio' },
  'OK': { zone: 7, name: 'Oklahoma' },
  'OR': { zone: 7, name: 'Oregon' },
  'PA': { zone: 6, name: 'Pennsylvania' },
  'RI': { zone: 6, name: 'Rhode Island' },
  'SC': { zone: 8, name: 'South Carolina' },
  'SD': { zone: 4, name: 'South Dakota' },
  'TN': { zone: 7, name: 'Tennessee' },
  'TX': { zone: 8, name: 'Texas' },
  'UT': { zone: 6, name: 'Utah' },
  'VT': { zone: 4, name: 'Vermont' },
  'VA': { zone: 7, name: 'Virginia' },
  'WA': { zone: 7, name: 'Washington' },
  'WV': { zone: 6, name: 'West Virginia' },
  'WI': { zone: 4, name: 'Wisconsin' },
  'WY': { zone: 4, name: 'Wyoming' },
  'DC': { zone: 7, name: 'Washington DC' },
};

// Common cities with frost date data for more granular lookups
export const cityFrostData: Array<{
  city: string;
  state: string;
  zipPrefixes: string[];
  zone: number;
  lastSpringFrost: string;
  firstFallFrost: string;
}> = [
  { city: 'Atlanta', state: 'GA', zipPrefixes: ['303', '310'], zone: 8, lastSpringFrost: '03-15', firstFallFrost: '11-15' },
  { city: 'Boston', state: 'MA', zipPrefixes: ['021', '022', '023', '024'], zone: 6, lastSpringFrost: '04-15', firstFallFrost: '10-15' },
  { city: 'Charlotte', state: 'NC', zipPrefixes: ['282'], zone: 7, lastSpringFrost: '03-21', firstFallFrost: '11-15' },
  { city: 'Chicago', state: 'IL', zipPrefixes: ['606', '607', '608'], zone: 5, lastSpringFrost: '04-22', firstFallFrost: '10-15' },
  { city: 'Cincinnati', state: 'OH', zipPrefixes: ['452', '453'], zone: 6, lastSpringFrost: '04-15', firstFallFrost: '10-25' },
  { city: 'Dallas', state: 'TX', zipPrefixes: ['750', '751', '752', '753'], zone: 8, lastSpringFrost: '03-01', firstFallFrost: '11-25' },
  { city: 'Denver', state: 'CO', zipPrefixes: ['800', '801', '802', '803'], zone: 5, lastSpringFrost: '05-07', firstFallFrost: '10-07' },
  { city: 'Detroit', state: 'MI', zipPrefixes: ['481', '482', '483'], zone: 5, lastSpringFrost: '04-24', firstFallFrost: '10-22' },
  { city: 'Houston', state: 'TX', zipPrefixes: ['770', '771', '772', '773'], zone: 9, lastSpringFrost: '02-10', firstFallFrost: '12-01' },
  { city: 'Indianapolis', state: 'IN', zipPrefixes: ['461', '462'], zone: 5, lastSpringFrost: '04-20', firstFallFrost: '10-20' },
  { city: 'Kansas City', state: 'MO', zipPrefixes: ['640', '641', '644'], zone: 6, lastSpringFrost: '04-09', firstFallFrost: '10-25' },
  { city: 'Las Vegas', state: 'NV', zipPrefixes: ['891'], zone: 9, lastSpringFrost: '02-20', firstFallFrost: '12-01' },
  { city: 'Los Angeles', state: 'CA', zipPrefixes: ['900', '901', '902', '903', '904', '905', '906', '907', '908'], zone: 10, lastSpringFrost: '01-15', firstFallFrost: '12-31' },
  { city: 'Louisville', state: 'KY', zipPrefixes: ['402'], zone: 6, lastSpringFrost: '04-01', firstFallFrost: '10-31' },
  { city: 'Memphis', state: 'TN', zipPrefixes: ['380', '381'], zone: 7, lastSpringFrost: '03-23', firstFallFrost: '11-07' },
  { city: 'Miami', state: 'FL', zipPrefixes: ['330', '331', '332', '333'], zone: 11, lastSpringFrost: '01-01', firstFallFrost: '12-31' },
  { city: 'Minneapolis', state: 'MN', zipPrefixes: ['554', '555', '556', '558'], zone: 4, lastSpringFrost: '05-01', firstFallFrost: '10-01' },
  { city: 'Nashville', state: 'TN', zipPrefixes: ['370', '371', '372'], zone: 7, lastSpringFrost: '03-28', firstFallFrost: '11-07' },
  { city: 'New Orleans', state: 'LA', zipPrefixes: ['701', '702', '703'], zone: 9, lastSpringFrost: '02-20', firstFallFrost: '12-05' },
  { city: 'New York City', state: 'NY', zipPrefixes: ['100', '101', '102', '103', '104', '111', '112', '113', '114'], zone: 7, lastSpringFrost: '04-01', firstFallFrost: '11-07' },
  { city: 'Oklahoma City', state: 'OK', zipPrefixes: ['730', '731', '733'], zone: 7, lastSpringFrost: '03-28', firstFallFrost: '11-07' },
  { city: 'Orlando', state: 'FL', zipPrefixes: ['328', '329'], zone: 9, lastSpringFrost: '02-01', firstFallFrost: '12-15' },
  { city: 'Philadelphia', state: 'PA', zipPrefixes: ['190', '191', '192', '193', '194'], zone: 7, lastSpringFrost: '03-30', firstFallFrost: '11-10' },
  { city: 'Phoenix', state: 'AZ', zipPrefixes: ['850', '851', '852', '853'], zone: 10, lastSpringFrost: '02-01', firstFallFrost: '12-15' },
  { city: 'Pittsburgh', state: 'PA', zipPrefixes: ['150', '151', '152', '153', '154', '155', '156'], zone: 6, lastSpringFrost: '04-20', firstFallFrost: '10-20' },
  { city: 'Portland', state: 'OR', zipPrefixes: ['970', '971', '972', '974'], zone: 8, lastSpringFrost: '03-15', firstFallFrost: '11-15' },
  { city: 'Raleigh', state: 'NC', zipPrefixes: ['276', '278'], zone: 7, lastSpringFrost: '03-24', firstFallFrost: '11-15' },
  { city: 'Sacramento', state: 'CA', zipPrefixes: ['958'], zone: 9, lastSpringFrost: '02-25', firstFallFrost: '12-01' },
  { city: 'Salt Lake City', state: 'UT', zipPrefixes: ['840', '841', '842', '843', '844'], zone: 7, lastSpringFrost: '04-15', firstFallFrost: '10-31' },
  { city: 'San Antonio', state: 'TX', zipPrefixes: ['780', '781', '782'], zone: 9, lastSpringFrost: '03-01', firstFallFrost: '11-25' },
  { city: 'San Francisco', state: 'CA', zipPrefixes: ['940', '941', '942', '943', '944', '945', '946', '947', '948', '949'], zone: 10, lastSpringFrost: '01-31', firstFallFrost: '12-31' },
  { city: 'Seattle', state: 'WA', zipPrefixes: ['980', '981', '982', '983'], zone: 8, lastSpringFrost: '03-01', firstFallFrost: '11-30' },
  { city: 'St. Louis', state: 'MO', zipPrefixes: ['630', '631', '632', '633'], zone: 6, lastSpringFrost: '04-05', firstFallFrost: '10-25' },
  { city: 'Tampa', state: 'FL', zipPrefixes: ['335', '336', '337'], zone: 9, lastSpringFrost: '02-10', firstFallFrost: '12-10' },
  { city: 'Washington DC', state: 'DC', zipPrefixes: ['200', '201', '202', '203', '204', '205'], zone: 7, lastSpringFrost: '03-25', firstFallFrost: '11-15' },
];

export function lookupFrostDatesByZip(zip: string): FrostDateInfo | null {
  const prefix3 = zip.substring(0, 3);

  // Check city data first (more specific)
  for (const cityData of cityFrostData) {
    if (cityData.zipPrefixes.includes(prefix3)) {
      return {
        zone: cityData.zone,
        lastSpringFrost: cityData.lastSpringFrost,
        firstFallFrost: cityData.firstFallFrost,
        city: cityData.city,
        state: cityData.state,
      };
    }
  }

  // Fall back to zip code prefix patterns
  const zipNum = parseInt(prefix3, 10);
  let zone = 6; // default zone

  if (zipNum >= 0 && zipNum <= 99) zone = 8;        // FL/GA
  else if (zipNum >= 100 && zipNum <= 199) zone = 6; // NY/NJ
  else if (zipNum >= 200 && zipNum <= 299) zone = 7; // DC/VA/MD
  else if (zipNum >= 300 && zipNum <= 399) zone = 7; // GA/SC/TN
  else if (zipNum >= 400 && zipNum <= 499) zone = 5; // KY/OH/IN
  else if (zipNum >= 500 && zipNum <= 599) zone = 5; // IA/MN/SD
  else if (zipNum >= 600 && zipNum <= 699) zone = 5; // IL/WI
  else if (zipNum >= 700 && zipNum <= 799) zone = 8; // TX/LA
  else if (zipNum >= 800 && zipNum <= 849) zone = 5; // CO/UT
  else if (zipNum >= 850 && zipNum <= 869) zone = 9; // AZ
  else if (zipNum >= 870 && zipNum <= 899) zone = 7; // NM/NV
  else if (zipNum >= 900 && zipNum <= 969) zone = 9; // CA
  else if (zipNum >= 970 && zipNum <= 999) zone = 8; // OR/WA/AK

  const zoneInfo = zoneData[zone];
  return {
    zone,
    lastSpringFrost: zoneInfo.lastSpringFrost,
    firstFallFrost: zoneInfo.firstFallFrost,
  };
}

export function lookupFrostDatesByState(stateCode: string): FrostDateInfo | null {
  const stateInfo = stateZoneData[stateCode.toUpperCase()];
  if (!stateInfo) return null;

  const zoneInfo = zoneData[stateInfo.zone];
  return {
    zone: stateInfo.zone,
    lastSpringFrost: zoneInfo.lastSpringFrost,
    firstFallFrost: zoneInfo.firstFallFrost,
    state: stateInfo.name,
  };
}

export function formatFrostDate(mmdd: string, year: number = new Date().getFullYear()): Date {
  const [month, day] = mmdd.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getZoneDescription(zone: number): string {
  return zoneData[zone]?.description || `Zone ${zone}`;
}

export const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington DC' },
];
