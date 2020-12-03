export interface ScanProperties {
  __version: string;
  context: ScanContext;
  workflow: ScanWorkflow;
  vulnscan: Vulnscan;
}

export interface ScanContext {
  artifactType: string;
  artifactId: string;
  requestId: string;
  token: string;
}

export interface ScanWorkflow {
  provider: string;
  runUrl: string;
  repositoryUrl: string;
  additionalData: {
    [key: string]: string;
  }
}

export interface Vulnscan {
  provider: string;
  scanTime: string;
  identifiers: SeverityVulnIdentifiers[];
  allowList: VulnIdentifiers[];
}

export interface SeverityVulnIdentifiers extends VulnIdentifiers {
  severity: string;
}

export interface VulnIdentifiers {
  type: string;
  values: string[];
}