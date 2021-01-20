// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { v4 as uuidv4 } from 'uuid';
import appInsights from 'applicationinsights';
import * as ExecHelper from '../utils/execHelper';
import * as FileHelper from '../utils/fileHelper';
import * as Inputs from '../utils/inputs';
import { ScanProperties, ScanContext, Vulnscan, ScanWorkflow, SeverityVulnIdentifiers } from '../azure/scanResultContracts';

export const TRIVY = 'trivy';
const EVENT_NAME = 'MS.CloudSecurity.CI.ScanResult';
const PROVIDER_NAME = 'githubAction';
const IMAGE_NAME_KEY = 'imageName';
const VULNERABILITIES_KEY = 'vulnerabilities';
const VULNERABILITY_ID_KEY = 'vulnerabilityId';
const TIMESTAMP_KEY = 'vulnerabilityScanTimestamp';
const SEVERITY_KEY = 'severity';
const CVE = 'cve';
const IMAGE_DIGEST_SEPARATOR = '@';
const MIN_CONTAINER_SCAN_VERSION = 'v0.1';

export async function getEventData(): Promise<appInsights.Contracts.EventTelemetry> {
  const eventProperties = await getEventProperties();
  const eventData: appInsights.Contracts.EventTelemetry = {
    name: EVENT_NAME,
    properties: eventProperties
  };

  return eventData;
}

async function getEventProperties(): Promise<ScanProperties> {
  const containerScanResult = getContainerScanResult();
  const imageName = containerScanResult[IMAGE_NAME_KEY];
  const scanTime = containerScanResult[TIMESTAMP_KEY];
  if (!imageName || !scanTime) {
    throw new Error(`Could not find image name and/or scan timestamp. Please ensure that you are using container-scan version >= '${MIN_CONTAINER_SCAN_VERSION}'`);
  }

  const imageDigest = await getImageDigest(imageName);
  const identifiers = getIdentifiers(containerScanResult);
  const version = '0.1';
  const requestId = uuidv4();
  const runUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const repositoryUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}`;

  const context: ScanContext = {
    "artifactType": Inputs.artifactType,
    "artifactId": imageDigest,
    "requestId": requestId,
    "token": Inputs.subscriptionToken
  };

  const workflow: ScanWorkflow = {
    "provider": PROVIDER_NAME,
    "runUrl": runUrl,
    "repositoryUrl": repositoryUrl,
    "additionalData": {
      "GITHUB_REF": process.env.GITHUB_REF,
      "GITHUB_SHA": process.env.GITHUB_SHA
    }
  };

  const vulnscan: Vulnscan = {
    "provider": TRIVY,
    "scanTime": scanTime,
    "identifiers": identifiers,
    "allowList": []
  };

  const properties: ScanProperties = {
    "__version": version,
    "context": context,
    "workflow": workflow,
    "vulnscan": vulnscan
  };

  return properties;
}

async function getImageDigest(imageName: string): Promise<string> {
  let imageDigest: string;
  const command = 'docker';
  const args = ['inspect', '--format', '{{index .RepoDigests 0}}', imageName];

  const dockerInspectResult = await ExecHelper.exec(command, args);
  if (dockerInspectResult.exitcode === 0) {
    const parts = dockerInspectResult.stdout.split(IMAGE_DIGEST_SEPARATOR);
    if (parts.length === 2) {
      imageDigest = parts[1];
      console.log(`Obtained image digest for the image: '${imageDigest}'`);
    } else {
      throw new Error('Unable to obtain Docker image digest. Error parsing Docker inspect result.');
    }
  }
  else {
    const errorMessage = 'Something went wrong while obtaining Docker image digest. Please ensure that Docker is installed on the runner and the image is present locally.';
    throw new Error(errorMessage);
  }

  return imageDigest;
}

function getIdentifiers(containerScanResult: any): SeverityVulnIdentifiers[] {
  let vulnerabilities: any[] = containerScanResult[VULNERABILITIES_KEY];
  let identifiers: SeverityVulnIdentifiers[] = [];

  vulnerabilities.forEach((vulnerability) => {
    let severityVulnIdentifiers: SeverityVulnIdentifiers = identifiers.find(ids => ids.severity === vulnerability[SEVERITY_KEY]);
    if (!severityVulnIdentifiers) {
      severityVulnIdentifiers = { severity: vulnerability[SEVERITY_KEY], type: CVE, values: [] };
      identifiers.push(severityVulnIdentifiers);
    }

    severityVulnIdentifiers.values.push(vulnerability[VULNERABILITY_ID_KEY]);
  });

  return identifiers;
}

function getContainerScanResult(): any {
  const scanReport = FileHelper.getFileJson(Inputs.scanResultsPath);
  return scanReport;
}