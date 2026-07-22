export interface CaseMaster {
  CaseMasterID: number;
  CrimeNo: string;
  CaseNo: string;
  CrimeRegisteredDate: string;
  PolicePersonID: number;
  PoliceStationID: number;
  CaseCategoryID: number;
  GravityOffenceID: number;
  CrimeMajorHeadID: number;
  CrimeMinorHeadID: number;
  CaseStatusID: number;
  CourtID: number;
  IncidentFromDate: string;
  IncidentToDate: string;
  InfoReceivedPSDate: string;
  latitude: number;
  longitude: number;
  BriefFacts: string;
}

export interface ComplainantDetails {
  ComplainantID: number;
  CaseMasterID: number;
  ComplainantName: string;
  AgeYear: number;
  OccupationID: number;
  ReligionID: number;
  CasteID: number;
  GenderID: number; // 1: Male, 2: Female, 3: Transgender
}

export interface ActSectionAssociation {
  CaseMasterID: number;
  ActID: string;
  SectionID: string;
  ActOrderID: number;
  SectionOrderID: number;
}

export interface Victim {
  VictimMasterID: number;
  CaseMasterID: number;
  VictimName: string;
  AgeYear: number;
  GenderID: number;
  VictimPolice: string; // "1" for police, "0" for civilian
}

export interface Accused {
  AccusedMasterID: number;
  CaseMasterID: number;
  AccusedName: string;
  AgeYear: number;
  GenderID: number; // 1: M, 2: F, 3: T
  PersonID: string; // Unique person tracking ID (e.g., A1, A2) to link across multiple cases
  AssociateIDs: string[]; // List of other PersonIDs they associate with
}

export interface ArrestSurrender {
  ArrestSurrenderID: number;
  CaseMasterID: number;
  ArrestSurrenderTypeID: number; // 1: Arrest, 2: Surrender
  ArrestSurrenderDate: string;
  ArrestSurrenderStateId: number;
  ArrestSurrenderDistrictId: number;
  PoliceStationID: number;
  IOID: number; // Investigating Officer ID
  CourtID: number;
  AccusedMasterID: number;
  IsAccused: boolean;
  IsComplainantAccused: boolean;
}

export interface Act {
  ActCode: string;
  ActDescription: string;
  ShortName: string;
  Active: boolean;
}

export interface Section {
  ActCode: string;
  SectionCode: string;
  SectionDescription: string;
  Active: boolean;
}

export interface CrimeHead {
  CrimeHeadID: number;
  CrimeGroupName: string;
  Active: boolean;
}

export interface CrimeSubHead {
  CrimeSubHeadID: number;
  CrimeHeadID: number;
  CrimeSubHeadName: string;
  SeqID: number;
}

export interface District {
  DistrictID: number;
  DistrictName: string;
  StateID: number;
  Active: boolean;
  SocioEconomic: SocioEconomicIndicator;
}

export interface SocioEconomicIndicator {
  urbanizationIndex: number; // 0 to 100
  migrationRate: number; // %
  economicStressIndex: number; // 0 to 100 (unemployment, poverty)
  educationLevelIndex: number; // 0 to 100 (literacy rate)
  populationDensity: number; // per sq km
}

export interface Unit {
  UnitID: number;
  UnitName: string; // Police Station name
  TypeID: number;
  ParentUnit: number;
  DistrictID: number;
  Active: boolean;
}

export interface Employee {
  EmployeeID: number;
  DistrictID: number;
  UnitID: number;
  RankID: number;
  DesignationID: number;
  KGID: string;
  FirstName: string;
  EmployeeDOB: string;
  GenderID: number;
}

export interface FinancialTransaction {
  TransactionID: number;
  CaseMasterID: number;
  FromAccount: string;
  ToAccount: string;
  Amount: number;
  TransactionDate: string;
  SenderName: string;
  RecipientName: string;
  IsSuspicious: boolean;
  RiskReason?: string;
}

// Unified platform state and models
export type UserRole = "Investigator" | "Analyst" | "Supervisor" | "Policymaker";

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole: UserRole;
  actionType: string;
  details: string;
  query?: string;
}

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  language: "en" | "kn";
  citations?: {
    firNo: string;
    caseId: number;
    title: string;
    reason: string;
  }[];
}
