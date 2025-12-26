
import { FieldDefinition, FilterType, QueryGroup, Shipment } from './types';

export const ALL_FIELDS: FieldDefinition[] = [
  // Logistics Group
  { id: 'origin_port', label: 'Origin Port', type: FilterType.ENTITY, group: 'Logistics', options: ['Shanghai', 'Singapore', 'Ningbo-Zhoushan', 'Shenzhen', 'Guangzhou', 'Busan', 'Qingdao', 'Hong Kong', 'Tianjin', 'Rotterdam'] },
  { id: 'dest_port', label: 'Destination Port', type: FilterType.ENTITY, group: 'Logistics', options: ['Los Angeles', 'Long Beach', 'New York', 'Hamburg', 'Antwerp', 'Dubai', 'Port Kelang', 'Ho Chi Minh'] },
  { id: 'vessel_name', label: 'Vessel Name', type: FilterType.STRING, group: 'Logistics' },
  { id: 'voyage_no', label: 'Voyage Number', type: FilterType.STRING, group: 'Logistics' },
  
  // Timeline Group
  { id: 'etd', label: 'Est. Departure (ETD)', type: FilterType.DATE, group: 'Timeline' },
  { id: 'eta', label: 'Est. Arrival (ETA)', type: FilterType.DATE, group: 'Timeline' },
  
  // Cargo Group
  { id: 'cargo_type', label: 'Cargo Type', type: FilterType.ENTITY, group: 'Cargo', options: ['General', 'Reefer', 'Hazardous', 'Oversized', 'Liquid Bulk'] },
  { id: 'weight', label: 'Weight (kg)', type: FilterType.NUMBER, group: 'Cargo' },
  
  // Parties Group
  { id: 'shipper', label: 'Shipper Name', type: FilterType.STRING, group: 'Parties' },
  { id: 'consignee', label: 'Consignee Name', type: FilterType.STRING, group: 'Parties' },
  { id: 'origin_country', label: 'Origin Country', type: FilterType.ENTITY, group: 'Parties', options: ['China', 'USA', 'Germany', 'Japan', 'South Korea', 'Vietnam', 'India', 'Brazil'] },
];

export const GROUPS: string[] = Array.from(new Set(ALL_FIELDS.map(f => f.group)));

export const FIELD_GROUPS: QueryGroup[] = GROUPS.map(group => ({
  name: group,
  fields: ALL_FIELDS.filter(f => f.group === group)
}));

// Helper to get dates relative to now
const getRelativeDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const MOCK_SHIPMENTS: Shipment[] = [
  { id: 'SH-1001', vessel: 'MAERSK SEOUL', voyage: 'V201', origin: 'Ningbo-Zhoushan', destination: 'Los Angeles', etd: getRelativeDate(-2), eta: getRelativeDate(14), shipper: 'Zhejiang Mfg', consignee: 'Global Logistics US', status: 'In Transit', weight: 12500 },
  { id: 'SH-1002', vessel: 'COSCO STAR', voyage: 'C88', origin: 'Ningbo-Zhoushan', destination: 'Hamburg', etd: getRelativeDate(-4), eta: getRelativeDate(25), shipper: 'Ningbo Export Ltd', consignee: 'EuroTrade GmbH', status: 'In Transit', weight: 8900 },
  { id: 'SH-1003', vessel: 'MSC LILY', voyage: 'M909', origin: 'Shanghai', destination: 'New York', etd: getRelativeDate(-1), eta: getRelativeDate(20), shipper: 'Shanghai Textiles', consignee: 'Fashion Corp', status: 'In Transit', weight: 4500 },
  { id: 'SH-1004', vessel: 'EVERGREEN GREEN', voyage: 'E12', origin: 'Ningbo-Zhoushan', destination: 'Singapore', etd: getRelativeDate(-6), eta: getRelativeDate(2), shipper: 'AutoParts Ningbo', consignee: 'ASEAN Parts', status: 'Arrived', weight: 15600 },
  { id: 'SH-1005', vessel: 'ONE HAMBURG', voyage: 'H101', origin: 'Qingdao', destination: 'Rotterdam', etd: getRelativeDate(3), eta: getRelativeDate(30), shipper: 'Qingdao Port Group', consignee: 'Dutch Import', status: 'Scheduled', weight: 22000 },
  { id: 'SH-1006', vessel: 'OOCL TOKYO', voyage: 'T55', origin: 'Ningbo-Zhoushan', destination: 'Dubai', etd: getRelativeDate(-1), eta: getRelativeDate(12), shipper: 'Electronic Supply', consignee: 'Middle East Hub', status: 'In Transit', weight: 3200 },
  { id: 'SH-1007', vessel: 'CMA CGM MARCO', voyage: 'X4', origin: 'Shenzhen', destination: 'Long Beach', etd: getRelativeDate(-10), eta: getRelativeDate(5), shipper: 'Tech Parts SZ', consignee: 'Cali Logistics', status: 'Delayed', weight: 11000 },
  { id: 'SH-1008', vessel: 'MAERSK DENMARK', voyage: 'V202', origin: 'Ningbo-Zhoushan', destination: 'Antwerp', etd: getRelativeDate(-3), eta: getRelativeDate(28), shipper: 'Furniture Master', consignee: 'Benelux Sales', status: 'In Transit', weight: 9500 },
];
