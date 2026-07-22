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
  FinancialTransaction
} from "./types";

export const mockDistricts: District[] = [
  {
    DistrictID: 101,
    DistrictName: "Bengaluru City",
    StateID: 10,
    Active: true,
    SocioEconomic: {
      urbanizationIndex: 92,
      migrationRate: 18.4,
      economicStressIndex: 25,
      educationLevelIndex: 88,
      populationDensity: 4380
    }
  },
  {
    DistrictID: 102,
    DistrictName: "Mysuru",
    StateID: 10,
    Active: true,
    SocioEconomic: {
      urbanizationIndex: 64,
      migrationRate: 7.2,
      economicStressIndex: 38,
      educationLevelIndex: 82,
      populationDensity: 450
    }
  },
  {
    DistrictID: 103,
    DistrictName: "Mangaluru (Dakshina Kannada)",
    StateID: 10,
    Active: true,
    SocioEconomic: {
      urbanizationIndex: 72,
      migrationRate: 11.5,
      economicStressIndex: 30,
      educationLevelIndex: 91,
      populationDensity: 360
    }
  },
  {
    DistrictID: 104,
    DistrictName: "Hubballi-Dharwad",
    StateID: 10,
    Active: true,
    SocioEconomic: {
      urbanizationIndex: 58,
      migrationRate: 6.8,
      economicStressIndex: 45,
      educationLevelIndex: 78,
      populationDensity: 520
    }
  },
  {
    DistrictID: 105,
    DistrictName: "Belagavi",
    StateID: 10,
    Active: true,
    SocioEconomic: {
      urbanizationIndex: 42,
      migrationRate: 5.1,
      economicStressIndex: 52,
      educationLevelIndex: 73,
      populationDensity: 310
    }
  },
  {
    DistrictID: 106,
    DistrictName: "Kalaburagi",
    StateID: 10,
    Active: true,
    SocioEconomic: {
      urbanizationIndex: 35,
      migrationRate: 14.2,
      economicStressIndex: 68,
      educationLevelIndex: 65,
      populationDensity: 240
    }
  }
];

export const mockUnits: Unit[] = [
  { UnitID: 201, UnitName: "Cubbon Park Police Station", TypeID: 1, ParentUnit: 11, DistrictID: 101, Active: true },
  { UnitID: 202, UnitName: "Koramangala Police Station", TypeID: 1, ParentUnit: 11, DistrictID: 101, Active: true },
  { UnitID: 203, UnitName: "Lakshmipuram Police Station", TypeID: 1, ParentUnit: 12, DistrictID: 102, Active: true },
  { UnitID: 204, UnitName: "Kadri Police Station", TypeID: 1, ParentUnit: 13, DistrictID: 103, Active: true },
  { UnitID: 205, UnitName: "Hubballi Suburban Police Station", TypeID: 1, ParentUnit: 14, DistrictID: 104, Active: true },
  { UnitID: 206, UnitName: "Belagavi Market Police Station", TypeID: 1, ParentUnit: 15, DistrictID: 105, Active: true },
  { UnitID: 207, UnitName: "Kalaburagi Town Police Station", TypeID: 1, ParentUnit: 16, DistrictID: 106, Active: true }
];

export const mockCrimeHeads: CrimeHead[] = [
  { CrimeHeadID: 1, CrimeGroupName: "Crimes Against Body", Active: true },
  { CrimeHeadID: 2, CrimeGroupName: "Crimes Against Property", Active: true },
  { CrimeHeadID: 3, CrimeGroupName: "Financial & Cyber Crimes", Active: true },
  { CrimeHeadID: 4, CrimeGroupName: "Organized Crime & Narcotics", Active: true }
];

export const mockCrimeSubHeads: CrimeSubHead[] = [
  { CrimeSubHeadID: 11, CrimeHeadID: 1, CrimeSubHeadName: "Murder", SeqID: 1 },
  { CrimeSubHeadID: 12, CrimeHeadID: 1, CrimeSubHeadName: "Assault", SeqID: 2 },
  { CrimeSubHeadID: 21, CrimeHeadID: 2, CrimeSubHeadName: "Robbery / Theft", SeqID: 3 },
  { CrimeSubHeadID: 22, CrimeHeadID: 2, CrimeSubHeadName: "Burglary", SeqID: 4 },
  { CrimeSubHeadID: 31, CrimeHeadID: 3, CrimeSubHeadName: "Cyber Fraud", SeqID: 5 },
  { CrimeSubHeadID: 41, CrimeHeadID: 4, CrimeSubHeadName: "Narcotics Trafficking", SeqID: 6 }
];

export const mockActs: Act[] = [
  { ActCode: "IPC", ActDescription: "Indian Penal Code, 1860", ShortName: "IPC", Active: true },
  { ActCode: "BNS", ActDescription: "Bharatiya Nyaya Sanhita, 2023", ShortName: "BNS", Active: true },
  { ActCode: "NDPS", ActDescription: "Narcotic Drugs and Psychotropic Substances Act, 1985", ShortName: "NDPS", Active: true },
  { ActCode: "IT", ActDescription: "Information Technology Act, 2000", ShortName: "IT Act", Active: true }
];

export const mockSections: Section[] = [
  { ActCode: "IPC", SectionCode: "302", SectionDescription: "Punishment for Murder", Active: true },
  { ActCode: "IPC", SectionCode: "307", SectionDescription: "Attempt to Murder", Active: true },
  { ActCode: "IPC", SectionCode: "379", SectionDescription: "Punishment for Theft", Active: true },
  { ActCode: "IPC", SectionCode: "380", SectionDescription: "Theft in dwelling house, etc.", Active: true },
  { ActCode: "IPC", SectionCode: "420", SectionDescription: "Cheating and dishonestly inducing delivery of property", Active: true },
  { ActCode: "NDPS", SectionCode: "20", SectionDescription: "Punishment for contravention in relation to cannabis plant and cannabis", Active: true },
  { ActCode: "IT", SectionCode: "66D", SectionDescription: "Punishment for cheating by personation by using computer resource", Active: true },
  { ActCode: "BNS", SectionCode: "103", SectionDescription: "Murder (Bharatiya Nyaya Sanhita)", Active: true },
  { ActCode: "BNS", SectionCode: "303", SectionDescription: "Theft (Bharatiya Nyaya Sanhita)", Active: true }
];

export const mockEmployees: Employee[] = [
  { EmployeeID: 501, DistrictID: 101, UnitID: 201, RankID: 3, DesignationID: 1, KGID: "KSP26012", FirstName: "Sandeep Patil", EmployeeDOB: "1984-05-12", GenderID: 1 },
  { EmployeeID: 502, DistrictID: 101, UnitID: 202, RankID: 3, DesignationID: 1, KGID: "KSP26045", FirstName: "Meera Bai", EmployeeDOB: "1988-09-24", GenderID: 2 },
  { EmployeeID: 503, DistrictID: 102, UnitID: 203, RankID: 2, DesignationID: 1, KGID: "KSP26099", FirstName: "Yogesh Gowda", EmployeeDOB: "1990-11-02", GenderID: 1 },
  { EmployeeID: 504, DistrictID: 103, UnitID: 204, RankID: 3, DesignationID: 1, KGID: "KSP26112", FirstName: "Shekar Anchan", EmployeeDOB: "1982-02-15", GenderID: 1 },
  { EmployeeID: 505, DistrictID: 104, UnitID: 205, RankID: 2, DesignationID: 1, KGID: "KSP26189", FirstName: "Manjunath Hosur", EmployeeDOB: "1986-07-30", GenderID: 1 }
];

export const mockCases: CaseMaster[] = [
  {
    CaseMasterID: 1001,
    CrimeNo: "101010202202600001",
    CaseNo: "202600001",
    CrimeRegisteredDate: "2026-01-10",
    PolicePersonID: 502,
    PoliceStationID: 202, // Koramangala
    CaseCategoryID: 1, // FIR
    GravityOffenceID: 1, // Heinous
    CrimeMajorHeadID: 2, // Crimes Against Property
    CrimeMinorHeadID: 21, // Robbery / Theft
    CaseStatusID: 2, // Under Investigation
    CourtID: 301,
    IncidentFromDate: "2026-01-09T22:30:00",
    IncidentToDate: "2026-01-10T01:15:00",
    InfoReceivedPSDate: "2026-01-10T02:00:00",
    latitude: 12.9352,
    longitude: 77.6244,
    BriefFacts: "Complainant reported that while returning home from Koramangala 4th block, three unidentified mask-wearing individuals on a black motorcycle intercepted his vehicle, brandished a knife, and forcefully snatched a gold chain weighing 50 grams and a wallet containing ₹15,000 cash. The modus operandi matches a series of recent evening muggings in Bengaluru. Accused used a stolen registration plate. Trace analysis of nearby CCTV shows suspects fleeing towards Cubbon Park area."
  },
  {
    CaseMasterID: 1002,
    CrimeNo: "101010201202600002",
    CaseNo: "202600002",
    CrimeRegisteredDate: "2026-02-14",
    PolicePersonID: 501,
    PoliceStationID: 201, // Cubbon Park
    CaseCategoryID: 1, // FIR
    GravityOffenceID: 1, // Heinous
    CrimeMajorHeadID: 4, // Organized Crime & Narcotics
    CrimeMinorHeadID: 41, // Narcotics Trafficking
    CaseStatusID: 2, // Under Investigation
    CourtID: 301,
    IncidentFromDate: "2026-02-14T11:00:00",
    IncidentToDate: "2026-02-14T13:30:00",
    InfoReceivedPSDate: "2026-02-14T14:15:00",
    latitude: 12.9731,
    longitude: 77.5985,
    BriefFacts: "On a reliable tip-off, Cubbon Park police conducted a raid near UB City park area. Accused person, caught in possession of 1.2 kilograms of commercial-grade Hydroponic Weed (Cannabis) and ₹1.5 Lakhs in suspected drug sale proceeds. Accused was operating a distribution network targeting college students. Accused revealed links to a logistics supply chain based out of Mangaluru and financial transactions to a shared coordinator bank account."
  },
  {
    CaseMasterID: 1003,
    CrimeNo: "101020203202600003",
    CaseNo: "202600003",
    CrimeRegisteredDate: "2026-03-05",
    PolicePersonID: 503,
    PoliceStationID: 203, // Lakshmipuram Mysuru
    CaseCategoryID: 1,
    GravityOffenceID: 2, // Non-Heinous
    CrimeMajorHeadID: 2, // Property
    CrimeMinorHeadID: 22, // Burglary
    CaseStatusID: 3, // Charge Sheeted
    CourtID: 302,
    IncidentFromDate: "2026-03-04T09:00:00",
    IncidentToDate: "2026-03-04T21:00:00",
    InfoReceivedPSDate: "2026-03-05T07:30:00",
    latitude: 12.2995,
    longitude: 76.6432,
    BriefFacts: "Complainant returned home after a business trip and found the main door lock broken. The entire house was ransacked. Gold ornaments worth ₹3.5 Lakhs, silver articles, and a premium laptop were stolen. Modus operandi shows the use of heavy-duty iron pry bars and silent entry. Latent fingerprints were collected from the scene by the forensic squad, which match past offender profiles in Mysuru district database."
  },
  {
    CaseMasterID: 1004,
    CrimeNo: "101030204202600004",
    CaseNo: "202600004",
    CrimeRegisteredDate: "2026-03-28",
    PolicePersonID: 504,
    PoliceStationID: 204, // Kadri Mangaluru
    CaseCategoryID: 1,
    GravityOffenceID: 1, // Heinous
    CrimeMajorHeadID: 3, // Financial & Cyber
    CrimeMinorHeadID: 31, // Cyber Fraud
    CaseStatusID: 2, // Under Investigation
    CourtID: 303,
    IncidentFromDate: "2026-03-27T10:00:00",
    IncidentToDate: "2026-03-27T16:00:00",
    InfoReceivedPSDate: "2026-03-28T11:00:00",
    latitude: 12.9189,
    longitude: 74.8624,
    BriefFacts: "Cyber-crime wing at Mangaluru registered a case of online banking phishing. A senior citizen was scammed of ₹12.4 Lakhs. The caller impersonated a Bank official warning about a blocked credit card, extracted an OTP, and initiated several unauthorized RTGS transactions. Financial link analysis reveals funds were transferred to five mule bank accounts within 30 minutes, with subsequent withdrawals from ATMs in Bengaluru."
  },
  {
    CaseMasterID: 1005,
    CrimeNo: "101010202202600005",
    CaseNo: "202600005",
    CrimeRegisteredDate: "2026-04-12",
    PolicePersonID: 502,
    PoliceStationID: 202, // Koramangala
    CaseCategoryID: 1,
    GravityOffenceID: 1, // Heinous
    CrimeMajorHeadID: 1, // Body
    CrimeMinorHeadID: 11, // Murder
    CaseStatusID: 2, // Under Investigation
    CourtID: 301,
    IncidentFromDate: "2026-04-12T01:00:00",
    IncidentToDate: "2026-04-12T02:00:00",
    InfoReceivedPSDate: "2026-04-12T06:30:00",
    latitude: 12.9288,
    longitude: 77.6199,
    BriefFacts: "A 32-year-old local merchant was found dead inside his office cabin in Koramangala with multiple stab wounds to the torso. Investigation indicates a personal grudge or business rivalry. CCTV footage captures two suspects entering the premises at 01:15 AM wearing hoods and carrying weapons. Forensic analysis of footprints, finger-prints, and call records of the deceased show active communication with a known gang associate before the murder."
  },
  {
    CaseMasterID: 1006,
    CrimeNo: "101040205202600006",
    CaseNo: "202600006",
    CrimeRegisteredDate: "2026-05-02",
    PolicePersonID: 505,
    PoliceStationID: 205, // Hubballi Suburban
    CaseCategoryID: 1,
    GravityOffenceID: 2,
    CrimeMajorHeadID: 2, // Property
    CrimeMinorHeadID: 21, // Theft
    CaseStatusID: 2,
    CourtID: 304,
    IncidentFromDate: "2026-05-01T14:00:00",
    IncidentToDate: "2026-05-01T15:00:00",
    InfoReceivedPSDate: "2026-05-02T09:00:00",
    latitude: 15.3582,
    longitude: 75.1325,
    BriefFacts: "Snatched gold chain incident reported in Dharwad road. Complainant, an elderly lady walking home, was pushed and her 40-gram gold chain snatched by a pillion rider on an unmarked pulsar motorcycle. Modus operandi and speed of execution are identical to a series of snatches in the district, pointing to an inter-district gang active in North Karnataka."
  },
  {
    CaseMasterID: 1007,
    CrimeNo: "101010202202600007",
    CaseNo: "202600007",
    CrimeRegisteredDate: "2026-05-20",
    PolicePersonID: 502,
    PoliceStationID: 202, // Koramangala
    CaseCategoryID: 1,
    GravityOffenceID: 1,
    CrimeMajorHeadID: 2, // Property
    CrimeMinorHeadID: 21, // Theft/Robbery
    CaseStatusID: 2,
    CourtID: 301,
    IncidentFromDate: "2026-05-19T23:45:00",
    IncidentToDate: "2026-05-20T00:30:00",
    InfoReceivedPSDate: "2026-05-20T01:30:00",
    latitude: 12.9320,
    longitude: 77.6290,
    BriefFacts: "An armed robbery at a local electronic appliances godown in Koramangala. A gang of four armed robbers overpowered the night watchman, tied him up, and looted high-end smartphones and laptops worth ₹12 Lakhs. The stolen merchandise was loaded into a white commercial container vehicle. The watchman identified one of the suspects' voices and build, which matches Ramesh Kumar, a repeat offender wanted in property theft cases across South Bengaluru."
  },
  {
    CaseMasterID: 1008,
    CrimeNo: "101060207202600008",
    CaseNo: "202600008",
    CrimeRegisteredDate: "2026-06-12",
    PolicePersonID: 505, // Recycled officer or different
    PoliceStationID: 207, // Kalaburagi Town
    CaseCategoryID: 1,
    GravityOffenceID: 1,
    CrimeMajorHeadID: 1, // Body
    CrimeMinorHeadID: 12, // Assault
    CaseStatusID: 2,
    CourtID: 305,
    IncidentFromDate: "2026-06-11T19:30:00",
    IncidentToDate: "2026-06-11T20:30:00",
    InfoReceivedPSDate: "2026-06-12T08:00:00",
    latitude: 17.3325,
    longitude: 76.8421,
    BriefFacts: "A violent clash between two local student groups near Kalaburagi Town square. One faction attacked another with iron rods and sharp weapons due to previous college group rivalries. Three victims suffered severe head injuries and are in critical condition. Socio-economic stress and high local unemployment in the region are linked to increasing juvenile street gang violence in the town."
  }
];

export const mockComplainants: ComplainantDetails[] = [
  { ComplainantID: 3001, CaseMasterID: 1001, ComplainantName: "Venkatesh Prasad", AgeYear: 41, OccupationID: 10, ReligionID: 1, CasteID: 5, GenderID: 1 },
  { ComplainantID: 3002, CaseMasterID: 1002, ComplainantName: "State (represented by CP PS sandeep)", AgeYear: 42, OccupationID: 12, ReligionID: 1, CasteID: 1, GenderID: 1 },
  { ComplainantID: 3003, CaseMasterID: 1003, ComplainantName: "Nisha Srinivas", AgeYear: 35, OccupationID: 11, ReligionID: 1, CasteID: 4, GenderID: 2 },
  { ComplainantID: 3004, CaseMasterID: 1004, ComplainantName: "K. Raghunath", AgeYear: 67, OccupationID: 15, ReligionID: 1, CasteID: 3, GenderID: 1 },
  { ComplainantID: 3005, CaseMasterID: 1005, ComplainantName: "Sunitha Gowda", AgeYear: 30, OccupationID: 10, ReligionID: 1, CasteID: 5, GenderID: 2 },
  { ComplainantID: 3006, CaseMasterID: 1006, ComplainantName: "Rajamma Hegde", AgeYear: 62, OccupationID: 15, ReligionID: 1, CasteID: 2, GenderID: 2 },
  { ComplainantID: 3007, CaseMasterID: 1007, ComplainantName: "Siddharth Jha", AgeYear: 38, OccupationID: 11, ReligionID: 1, CasteID: 1, GenderID: 1 },
  { ComplainantID: 3008, CaseMasterID: 1008, ComplainantName: "Anand Biradar", AgeYear: 22, OccupationID: 16, ReligionID: 1, CasteID: 6, GenderID: 1 }
];

export const mockVictims: Victim[] = [
  { VictimMasterID: 4001, CaseMasterID: 1001, VictimName: "Venkatesh Prasad", AgeYear: 41, GenderID: 1, VictimPolice: "0" },
  { VictimMasterID: 4002, CaseMasterID: 1002, VictimName: "Society", AgeYear: 0, GenderID: 1, VictimPolice: "0" },
  { VictimMasterID: 4003, CaseMasterID: 1003, VictimName: "Nisha Srinivas", AgeYear: 35, GenderID: 2, VictimPolice: "0" },
  { VictimMasterID: 4004, CaseMasterID: 1004, VictimName: "K. Raghunath", AgeYear: 67, GenderID: 1, VictimPolice: "0" },
  { VictimMasterID: 4005, CaseMasterID: 1005, VictimName: "Devraj Gowda", AgeYear: 32, GenderID: 1, VictimPolice: "0" },
  { VictimMasterID: 4006, CaseMasterID: 1006, VictimName: "Rajamma Hegde", AgeYear: 62, GenderID: 2, VictimPolice: "0" },
  { VictimMasterID: 4007, CaseMasterID: 1007, VictimName: "Security Guard Mohan", AgeYear: 55, GenderID: 1, VictimPolice: "0" },
  { VictimMasterID: 4008, CaseMasterID: 1008, VictimName: "Praveen Kumar", AgeYear: 21, GenderID: 1, VictimPolice: "0" }
];

export const mockAccused: Accused[] = [
  {
    AccusedMasterID: 7001,
    CaseMasterID: 1001,
    AccusedName: "Ramesh Kumar (Ranga)",
    AgeYear: 28,
    GenderID: 1,
    PersonID: "P_RAMESH_01",
    AssociateIDs: ["P_SURESH_02", "P_VIKRAM_03"]
  },
  {
    AccusedMasterID: 7002,
    CaseMasterID: 1001,
    AccusedName: "Suresh Hegde",
    AgeYear: 30,
    GenderID: 1,
    PersonID: "P_SURESH_02",
    AssociateIDs: ["P_RAMESH_01", "P_KIRAN_04"]
  },
  {
    AccusedMasterID: 7003,
    CaseMasterID: 1002,
    AccusedName: "Kiran Gowda",
    AgeYear: 25,
    GenderID: 1,
    PersonID: "P_KIRAN_04",
    AssociateIDs: ["P_SURESH_02", "P_ANIL_MANGALORE"]
  },
  {
    AccusedMasterID: 7004,
    CaseMasterID: 1003,
    AccusedName: "Ramesh Kumar (Ranga)",
    AgeYear: 28,
    GenderID: 1,
    PersonID: "P_RAMESH_01", // Linked repeat offender
    AssociateIDs: ["P_SURESH_02"]
  },
  {
    AccusedMasterID: 7005,
    CaseMasterID: 1004,
    AccusedName: "Vikram Malhotra",
    AgeYear: 32,
    GenderID: 1,
    PersonID: "P_VIKRAM_03",
    AssociateIDs: ["P_RAMESH_01", "P_CYBER_GURU"]
  },
  {
    AccusedMasterID: 7006,
    CaseMasterID: 1005,
    AccusedName: "Suresh Hegde",
    AgeYear: 30,
    GenderID: 1,
    PersonID: "P_SURESH_02", // Linked suspect
    AssociateIDs: ["P_RAMESH_01", "P_LOCAL_GANG"]
  },
  {
    AccusedMasterID: 7007,
    CaseMasterID: 1007,
    AccusedName: "Ramesh Kumar (Ranga)",
    AgeYear: 28,
    GenderID: 1,
    PersonID: "P_RAMESH_01", // Third offence! Strong repeat pattern
    AssociateIDs: ["P_SURESH_02", "P_VIKRAM_03"]
  },
  {
    AccusedMasterID: 7008,
    CaseMasterID: 1008,
    AccusedName: "Juvenile Suspect A",
    AgeYear: 19,
    GenderID: 1,
    PersonID: "P_JUV_A",
    AssociateIDs: ["P_JUV_B"]
  }
];

export const mockActSections: ActSectionAssociation[] = [
  { CaseMasterID: 1001, ActID: "IPC", SectionID: "379", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 1001, ActID: "IPC", SectionID: "380", ActOrderID: 1, SectionOrderID: 2 },
  { CaseMasterID: 1002, ActID: "NDPS", SectionID: "20", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 1003, ActID: "IPC", SectionID: "380", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 1004, ActID: "IT", SectionID: "66D", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 1004, ActID: "IPC", SectionID: "420", ActOrderID: 2, SectionOrderID: 1 },
  { CaseMasterID: 1005, ActID: "IPC", SectionID: "302", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 1006, ActID: "IPC", SectionID: "379", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 1007, ActID: "IPC", SectionID: "379", ActOrderID: 1, SectionOrderID: 1 },
  { CaseMasterID: 1007, ActID: "IPC", SectionID: "380", ActOrderID: 1, SectionOrderID: 2 },
  { CaseMasterID: 1008, ActID: "IPC", SectionID: "307", ActOrderID: 1, SectionOrderID: 1 }
];

export const mockFinancialTransactions: FinancialTransaction[] = [
  {
    TransactionID: 9001,
    CaseMasterID: 1001,
    FromAccount: "SBI-4412-9908",
    ToAccount: "HDFC-5511-1245",
    Amount: 15000,
    TransactionDate: "2026-01-10T03:30:00",
    SenderName: "Victim Wallet Transfer",
    RecipientName: "Ramesh Kumar Cash-out Account",
    IsSuspicious: true,
    RiskReason: "Immediate transfer from victim's stolen wallet UPI credential to suspect's bank account."
  },
  {
    TransactionID: 9002,
    CaseMasterID: 1002,
    FromAccount: "CANARA-1102-3345",
    ToAccount: "SBI-8822-4412",
    Amount: 45000,
    TransactionDate: "2026-02-14T08:15:00",
    SenderName: "Kiran Gowda (Drug Buyer)",
    RecipientName: "Suresh Hegde Coordinator",
    IsSuspicious: true,
    RiskReason: "Frequent round-number deposits preceding local drug seizure, highly correlated with delivery timestamps."
  },
  {
    TransactionID: 9003,
    CaseMasterID: 1004,
    FromAccount: "AXIS-7709-1234", // Victim K Raghunath
    ToAccount: "MULE-SBI-8822",
    Amount: 400000,
    TransactionDate: "2026-03-27T10:45:00",
    SenderName: "K. Raghunath (Victim Phishing)",
    RecipientName: "Mule Account A (Vikram Associated)",
    IsSuspicious: true,
    RiskReason: "Large sudden RTGS transfer from elderly citizen to unverified newly opened bank account."
  },
  {
    TransactionID: 9004,
    CaseMasterID: 1004,
    FromAccount: "MULE-SBI-8822",
    ToAccount: "MULE-HDFC-1102",
    Amount: 395000,
    TransactionDate: "2026-03-27T11:15:00",
    SenderName: "Mule Account A",
    RecipientName: "Mule Account B",
    IsSuspicious: true,
    RiskReason: "Layering phase: Rapid transfer of 98.7% of scammed funds to another account within 30 minutes."
  },
  {
    TransactionID: 9005,
    CaseMasterID: 1004,
    FromAccount: "MULE-HDFC-1102",
    ToAccount: "CRYPTO-PEER-TO-PEER",
    Amount: 390000,
    TransactionDate: "2026-03-27T11:45:00",
    SenderName: "Mule Account B",
    RecipientName: "Overseas P2P Crypto Merchant",
    IsSuspicious: true,
    RiskReason: "Integration phase: Funds laundered through peer-to-peer crypto purchase to achieve complete anonymity."
  },
  {
    TransactionID: 9006,
    CaseMasterID: 1007,
    FromAccount: "BOB-9922-1104",
    ToAccount: "SBI-8822-4412",
    Amount: 85000,
    TransactionDate: "2026-05-21T10:00:00",
    SenderName: "Stolen Electronics Fence",
    RecipientName: "Suresh Hegde",
    IsSuspicious: true,
    RiskReason: "Suspected payoff from a fence purchasing stolen warehouse smartphone inventory from the robbery."
  }
];

export const mockArrestSurrenders: ArrestSurrender[] = [
  { ArrestSurrenderID: 801, CaseMasterID: 1001, ArrestSurrenderTypeID: 1, ArrestSurrenderDate: "2026-01-15", ArrestSurrenderStateId: 10, ArrestSurrenderDistrictId: 101, PoliceStationID: 202, IOID: 502, CourtID: 301, AccusedMasterID: 7001, IsAccused: true, IsComplainantAccused: false },
  { ArrestSurrenderID: 802, CaseMasterID: 1002, ArrestSurrenderTypeID: 1, ArrestSurrenderDate: "2026-02-14", ArrestSurrenderStateId: 10, ArrestSurrenderDistrictId: 101, PoliceStationID: 201, IOID: 501, CourtID: 301, AccusedMasterID: 7003, IsAccused: true, IsComplainantAccused: false },
  { ArrestSurrenderID: 803, CaseMasterID: 1003, ArrestSurrenderTypeID: 2, ArrestSurrenderDate: "2026-03-10", ArrestSurrenderStateId: 10, ArrestSurrenderDistrictId: 102, PoliceStationID: 203, IOID: 503, CourtID: 302, AccusedMasterID: 7004, IsAccused: true, IsComplainantAccused: false }
];
