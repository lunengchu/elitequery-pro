
export enum FilterType {
  STRING = 'STRING',
  DATE = 'DATE',
  ENTITY = 'ENTITY',
  NUMBER = 'NUMBER'
}

export enum StringOperator {
  EQUALS = 'EQUALS',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH'
}

export enum DateOperator {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  CUSTOM_RANGE = 'CUSTOM_RANGE'
}

export interface FieldDefinition {
  id: string;
  label: string;
  type: FilterType;
  group: string;
  options?: string[]; // For ENTITY types
}

export interface ActiveFilter {
  id: string; // Unique instance ID
  fieldId: string;
  operator: string;
  value: any;
}

export interface QueryGroup {
  name: string;
  fields: FieldDefinition[];
}

export interface Shipment {
  id: string;
  vessel: string;
  voyage: string;
  origin: string;
  destination: string;
  etd: string; // ISO date
  eta: string; // ISO date
  shipper: string;
  consignee: string;
  status: 'In Transit' | 'Arrived' | 'Scheduled' | 'Delayed';
  weight: number;
}
