export interface Student {
  ID: string;
  FamilyId: string;
  GramPanchayat: string;
  StudentName: string;
  FatherName: string;
  Aadhaar: string;
  DOB: string;
  Age: number;
  Mobile: string;
  Gender: 'M' | 'F' | string;
  AdmissionDetailed?: string;
  Remark?: string;
}

export interface AnalysisResult {
  summary: string;
  genderRatio: string;
  ageDistribution: string;
  anomalies: string[];
}
