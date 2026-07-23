/**
 * mockData.ts — CSV-backed in-memory data layer
 * Loads all 27 tables from data/csv/ at startup.
 * Works in both Node (server.ts) and browser (Vite replaces fs with empty shim).
 */

import {
  CaseMaster,
  ComplainantDetails,
  ActSectionAssociation,
  Victim,
  Accused,
  ArrestSurrender,
  Act,
  Section,
  CrimeHead,
  CrimeSubHead,
  District,
  Unit,
  Employee,
  FinancialTransaction,
} from "./types";

// ---------------------------------------------------------------------------
// Minimal CSV parser — handles quoted fields with commas inside
// ---------------------------------------------------------------------------
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ---------------------------------------------------------------------------
// CSV loader — Node only (server-side). In browser, returns empty array.
// ---------------------------------------------------------------------------
function loadCSV(filename: string): Record<string, string>[] {
  try {
    // Dynamic require so Vite doesn't try to bundle it
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require("path") as typeof import("path");
    const csvPath = path.resolve(process.cwd(), "data", "csv", filename);
    const raw = fs.readFileSync(csvPath, "utf-8");
    return parseCSV(raw);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Lookup / Master tables
// ---------------------------------------------------------------------------
export interface StateRow      { StateID: number; StateName: string; NationalityID: number; Active: boolean }
export interface UnitTypeRow   { UnitTypeID: number; UnitTypeName: string; CityDistState: string; Hierarchy: number; Active: boolean }
export interface RankRow       { RankID: number; RankName: string; Hierarchy: number; Active: boolean }
export interface DesignationRow{ DesignationID: number; DesignationName: string; Active: boolean; SortOrder: number }
export interface CaseCategoryRow  { CaseCategoryID: number; LookupValue: string }
export interface GravityOffenceRow{ GravityOffenceID: number; LookupValue: string }
export interface CaseStatusRow    { CaseStatusID: number; CaseStatusName: string }
export interface ReligionRow      { ReligionID: number; ReligionName: string }
export interface CasteRow         { caste_master_id: number; caste_master_name: string }
export interface OccupationRow    { OccupationID: number; OccupationName: string }

export const csvStates: StateRow[] = loadCSV("State.csv").map(r => ({
  StateID: +r.StateID, StateName: r.StateName, NationalityID: +r.NationalityID, Active: r.Active === "1",
}));

export const csvUnitTypes: UnitTypeRow[] = loadCSV("UnitType.csv").map(r => ({
  UnitTypeID: +r.UnitTypeID, UnitTypeName: r.UnitTypeName, CityDistState: r.CityDistState,
  Hierarchy: +r.Hierarchy, Active: r.Active === "1",
}));

export const csvRanks: RankRow[] = loadCSV("Rank.csv").map(r => ({
  RankID: +r.RankID, RankName: r.RankName, Hierarchy: +r.Hierarchy, Active: r.Active === "1",
}));

export const csvDesignations: DesignationRow[] = loadCSV("Designation.csv").map(r => ({
  DesignationID: +r.DesignationID, DesignationName: r.DesignationName,
  Active: r.Active === "1", SortOrder: +r.SortOrder,
}));

export const csvCaseCategories: CaseCategoryRow[] = loadCSV("CaseCategory.csv").map(r => ({
  CaseCategoryID: +r.CaseCategoryID, LookupValue: r.LookupValue,
}));

export const csvGravityOffences: GravityOffenceRow[] = loadCSV("GravityOffence.csv").map(r => ({
  GravityOffenceID: +r.GravityOffenceID, LookupValue: r.LookupValue,
}));

export const csvCaseStatuses: CaseStatusRow[] = loadCSV("CaseStatusMaster.csv").map(r => ({
  CaseStatusID: +r.CaseStatusID, CaseStatusName: r.CaseStatusName,
}));

export const csvReligions: ReligionRow[] = loadCSV("ReligionMaster.csv").map(r => ({
  ReligionID: +r.ReligionID, ReligionName: r.ReligionName,
}));

export const csvCastes: CasteRow[] = loadCSV("CasteMaster.csv").map(r => ({
  caste_master_id: +r.caste_master_id, caste_master_name: r.caste_master_name,
}));

export const csvOccupations: OccupationRow[] = loadCSV("OccupationMaster.csv").map(r => ({
  OccupationID: +r.OccupationID, OccupationName: r.OccupationName,
}));

// ---------------------------------------------------------------------------
// Reference tables
// ---------------------------------------------------------------------------
export interface CourtRow { CourtID: number; CourtName: string; DistrictID: number; StateID: number; Active: boolean }
export interface CrimeHeadActSectionRow { CrimeHeadID: number; ActCode: string; SectionCode: string }

export const mockDistricts: District[] = loadCSV("District.csv").map(r => ({
  DistrictID: +r.DistrictID,
  DistrictName: r.DistrictName,
  StateID: +r.StateID,
  Active: r.Active === "1",
  SocioEconomic: {
    urbanizationIndex: +r.UrbanizationIndex,
    migrationRate: +r.MigrationRate,
    economicStressIndex: +r.EconomicStressIndex,
    educationLevelIndex: +r.EducationLevelIndex,
    populationDensity: +r.PopulationDensity,
  },
}));

export const mockUnits: Unit[] = loadCSV("Unit.csv").map(r => ({
  UnitID: +r.UnitID,
  UnitName: r.UnitName,
  TypeID: +r.TypeID,
  ParentUnit: +r.ParentUnit,
  DistrictID: +r.DistrictID,
  Active: r.Active === "1",
}));

export const mockEmployees: Employee[] = loadCSV("Employee.csv").map(r => ({
  EmployeeID: +r.EmployeeID,
  DistrictID: +r.DistrictID,
  UnitID: +r.UnitID,
  RankID: +r.RankID,
  DesignationID: +r.DesignationID,
  KGID: r.KGID,
  FirstName: r.FirstName,
  EmployeeDOB: r.EmployeeDOB,
  GenderID: +r.GenderID,
}));

export const csvCourts: CourtRow[] = loadCSV("Court.csv").map(r => ({
  CourtID: +r.CourtID, CourtName: r.CourtName,
  DistrictID: +r.DistrictID, StateID: +r.StateID, Active: r.Active === "1",
}));

export const mockActs: Act[] = loadCSV("Act.csv").map(r => ({
  ActCode: r.ActCode, ActDescription: r.ActDescription,
  ShortName: r.ShortName, Active: r.Active === "1",
}));

export const mockSections: Section[] = loadCSV("Section.csv").map(r => ({
  ActCode: r.ActCode, SectionCode: r.SectionCode,
  SectionDescription: r.SectionDescription, Active: r.Active === "1",
}));

export const mockCrimeHeads: CrimeHead[] = loadCSV("CrimeHead.csv").map(r => ({
  CrimeHeadID: +r.CrimeHeadID, CrimeGroupName: r.CrimeGroupName, Active: r.Active === "1",
}));

export const mockCrimeSubHeads: CrimeSubHead[] = loadCSV("CrimeSubHead.csv").map(r => ({
  CrimeSubHeadID: +r.CrimeSubHeadID,
  CrimeHeadID: +r.CrimeHeadID,
  CrimeSubHeadName: r.CrimeHeadName,
  SeqID: +r.SeqID,
}));

export const csvCrimeHeadActSections: CrimeHeadActSectionRow[] = loadCSV("CrimeHeadActSection.csv").map(r => ({
  CrimeHeadID: +r.CrimeHeadID, ActCode: r.ActCode, SectionCode: r.SectionCode,
}));

// ---------------------------------------------------------------------------
// Transactional tables
// ---------------------------------------------------------------------------
export const mockCases: CaseMaster[] = loadCSV("CaseMaster.csv").map(r => ({
  CaseMasterID: +r.CaseMasterID,
  CrimeNo: r.CrimeNo,
  CaseNo: r.CaseNo,
  CrimeRegisteredDate: r.CrimeRegisteredDate,
  PolicePersonID: +r.PolicePersonID,
  PoliceStationID: +r.PoliceStationID,
  CaseCategoryID: +r.CaseCategoryID,
  GravityOffenceID: +r.GravityOffenceID,
  CrimeMajorHeadID: +r.CrimeMajorHeadID,
  CrimeMinorHeadID: +r.CrimeMinorHeadID,
  CaseStatusID: +r.CaseStatusID,
  CourtID: +r.CourtID,
  IncidentFromDate: r.IncidentFromDate,
  IncidentToDate: r.IncidentToDate,
  InfoReceivedPSDate: r.InfoReceivedPSDate,
  latitude: +r.latitude,
  longitude: +r.longitude,
  BriefFacts: r.BriefFacts,
}));

export const mockComplainants: ComplainantDetails[] = loadCSV("ComplainantDetails.csv").map(r => ({
  ComplainantID: +r.ComplainantID,
  CaseMasterID: +r.CaseMasterID,
  ComplainantName: r.ComplainantName,
  AgeYear: +r.AgeYear,
  OccupationID: +r.OccupationID,
  ReligionID: +r.ReligionID,
  CasteID: +r.CasteID,
  GenderID: +r.GenderID,
}));

export const mockVictims: Victim[] = loadCSV("Victim.csv").map(r => ({
  VictimMasterID: +r.VictimMasterID,
  CaseMasterID: +r.CaseMasterID,
  VictimName: r.VictimName,
  AgeYear: +r.AgeYear,
  GenderID: +r.GenderID,
  VictimPolice: r.VictimPolice,
}));

export const mockAccused: Accused[] = loadCSV("Accused.csv").map(r => ({
  AccusedMasterID: +r.AccusedMasterID,
  CaseMasterID: +r.CaseMasterID,
  AccusedName: r.AccusedName,
  AgeYear: +r.AgeYear,
  GenderID: +r.GenderID,
  PersonID: r.PersonID,
  AssociateIDs: [], // Derived below
}));

// Build associate links: two accused share an AssociateID if they appear in the same case
(function buildAssociates() {
  const caseMap = new Map<number, Accused[]>();
  mockAccused.forEach(a => {
    const list = caseMap.get(a.CaseMasterID) ?? [];
    list.push(a);
    caseMap.set(a.CaseMasterID, list);
  });
  caseMap.forEach(group => {
    group.forEach(a => {
      const others = group.filter(o => o.PersonID !== a.PersonID).map(o => o.PersonID);
      // Merge without duplicates
      const existing = new Set(a.AssociateIDs);
      others.forEach(id => existing.add(id));
      a.AssociateIDs = Array.from(existing);
    });
  });
})();

export const mockActSections: ActSectionAssociation[] = loadCSV("ActSectionAssociation.csv").map(r => ({
  CaseMasterID: +r.CaseMasterID,
  ActID: r.ActID,
  SectionID: r.SectionID,
  ActOrderID: +r.ActOrderID,
  SectionOrderID: +r.SectionOrderID,
}));

export const mockArrestSurrenders: ArrestSurrender[] = loadCSV("ArrestSurrender.csv").map(r => ({
  ArrestSurrenderID: +r.ArrestSurrenderID,
  CaseMasterID: +r.CaseMasterID,
  ArrestSurrenderTypeID: +r.ArrestSurrenderTypeID,
  ArrestSurrenderDate: r.ArrestSurrenderDate,
  ArrestSurrenderStateId: +r.ArrestSurrenderStateId,
  ArrestSurrenderDistrictId: +r.ArrestSurrenderDistrictId,
  PoliceStationID: +r.PoliceStationID,
  IOID: +r.IOID,
  CourtID: +r.CourtID,
  AccusedMasterID: +r.AccusedMasterID,
  IsAccused: r.IsAccused === "1",
  IsComplainantAccused: r.IsComplainantAccused === "1",
}));

export interface ChargesheetRow {
  CSID: number; CaseMasterID: number; csdate: string;
  cstype: string; PolicePersonID: number;
}
export const csvChargesheets: ChargesheetRow[] = loadCSV("ChargesheetDetails.csv").map(r => ({
  CSID: +r.CSID, CaseMasterID: +r.CaseMasterID,
  csdate: r.csdate, cstype: r.cstype, PolicePersonID: +r.PolicePersonID,
}));

export const mockFinancialTransactions: FinancialTransaction[] = loadCSV("FinancialTransaction.csv").map(r => ({
  TransactionID: +r.TransactionID,
  CaseMasterID: +r.CaseMasterID,
  FromAccount: r.FromAccount,
  ToAccount: r.ToAccount,
  Amount: +r.Amount,
  TransactionDate: r.TransactionDate,
  SenderName: r.SenderName,
  RecipientName: r.RecipientName,
  IsSuspicious: r.IsSuspicious === "1",
  RiskReason: r.RiskReason || undefined,
}));
