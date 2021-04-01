"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventData = exports.TRIVY = void 0;
const uuid_1 = require("uuid");
const ExecHelper = require("../utils/execHelper");
const FileHelper = require("../utils/fileHelper");
const Inputs = require("../utils/inputs");
exports.TRIVY = 'trivy';
const EVENT_NAME = 'MS.CloudSecurity.CI.ScanResult';
const PROVIDER_NAME = 'githubAction';
const IMAGE_NAME_KEY = 'imageName';
const VULNERABILITIES_KEY = 'vulnerabilities';
const VULNERABILITY_ID_KEY = 'vulnerabilityId';
const TIMESTAMP_KEY = 'vulnerabilityScanTimestamp';
const SEVERITY_KEY = 'severity';
const CVE = 'cve';
const IMAGE_DIGEST_SEPARATOR = '@';
function getEventData() {
    return __awaiter(this, void 0, void 0, function* () {
        const eventProperties = yield getEventProperties();
        const eventData = {
            name: EVENT_NAME,
            properties: eventProperties
        };
        return eventData;
    });
}
exports.getEventData = getEventData;
function getEventProperties() {
    return __awaiter(this, void 0, void 0, function* () {
        const containerScanResult = getContainerScanResult();
        const imageName = containerScanResult[IMAGE_NAME_KEY] || '';
        const scanTime = containerScanResult[TIMESTAMP_KEY] || '';
        if (!imageName || !scanTime) {
            throw new Error(`Could not find image name and/or scan timestamp. Image name: '${imageName}', Scan timestamp: ${scanTime}`);
        }
        const imageDigest = yield getImageDigest(imageName);
        const identifiers = getIdentifiers(containerScanResult);
        const version = '0.1';
        const requestId = uuid_1.v4();
        const runUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
        const repositoryUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}`;
        const context = {
            "artifactType": Inputs.artifactType,
            "artifactId": imageDigest,
            "requestId": requestId,
            "token": Inputs.subscriptionToken
        };
        const workflow = {
            "provider": PROVIDER_NAME,
            "runUrl": runUrl,
            "repositoryUrl": repositoryUrl,
            "additionalData": {
                "GITHUB_REF": process.env.GITHUB_REF,
                "GITHUB_SHA": process.env.GITHUB_SHA
            }
        };
        const vulnscan = {
            "provider": exports.TRIVY,
            "scanTime": scanTime,
            "identifiers": identifiers,
            "allowList": []
        };
        const properties = {
            "__version": version,
            "context": context,
            "workflow": workflow,
            "vulnscan": vulnscan
        };
        return properties;
    });
}
function getImageDigest(imageName) {
    return __awaiter(this, void 0, void 0, function* () {
        let imageDigest;
        const command = 'docker';
        const args = ['inspect', '--format', '{{index .RepoDigests 0}}', imageName];
        const dockerInspectResult = yield ExecHelper.exec(command, args);
        if (dockerInspectResult.exitcode === 0) {
            const parts = dockerInspectResult.stdout.split(IMAGE_DIGEST_SEPARATOR);
            if (parts.length === 2) {
                imageDigest = parts[1];
                console.log(`Obtained image digest for the image: '${imageDigest}'`);
            }
            else {
                throw new Error('Unable to obtain Docker image digest. Error parsing Docker inspect result.');
            }
        }
        else {
            const errorMessage = 'Something went wrong while obtaining Docker image digest. Please ensure that Docker is installed on the runner and the image is present locally.';
            throw new Error(errorMessage);
        }
        return imageDigest;
    });
}
function getIdentifiers(containerScanResult) {
    let vulnerabilities = containerScanResult[VULNERABILITIES_KEY];
    let identifiers = [];
    vulnerabilities.forEach((vulnerability) => {
        let severityVulnIdentifiers = identifiers.find(ids => ids.severity === vulnerability[SEVERITY_KEY]);
        if (!severityVulnIdentifiers) {
            severityVulnIdentifiers = { severity: vulnerability[SEVERITY_KEY], type: CVE, values: [] };
            identifiers.push(severityVulnIdentifiers);
        }
        severityVulnIdentifiers.values.push(vulnerability[VULNERABILITY_ID_KEY]);
    });
    // Remove duplicate identifiers.
    // The list of IDs may contain duplicates because container scan reports vulnerabilities against packages
    // and multiple packages may contain the same vulnerabilities.
    return identifiers.map((identifier) => {
        identifier.values = [...new Set(identifier.values)];
        return identifier;
    });
}
function getContainerScanResult() {
    const scanReport = FileHelper.getFileJson(Inputs.scanResultsPath);
    return scanReport;
}
