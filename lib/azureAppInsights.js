"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postLogs = void 0;
const uuid_1 = require("uuid");
const core = __importStar(require("@actions/core"));
const fileHelper = __importStar(require("./fileHelper"));
const applicationinsights_1 = __importDefault(require("applicationinsights"));
function postLogs() {
    return __awaiter(this, void 0, void 0, function* () {
        const instrumentationKey = core.getInput('instrumentation-key', { required: true });
        const ingestionEndpoint = core.getInput('ingestion-endpoint', { required: true });
        applicationinsights_1.default.setup(instrumentationKey);
        const appInsightsClient = applicationinsights_1.default.defaultClient;
        appInsightsClient.config.endpointUrl = ingestionEndpoint;
        console.log('Posting container scan result to Azure app insights...');
        const eventData = getEventData();
        console.log(`Event data: ${JSON.stringify(eventData)}`);
        appInsightsClient.trackEvent(eventData);
        appInsightsClient.flush();
        console.log('Event posted!');
    });
}
exports.postLogs = postLogs;
function getEventData() {
    let eventData = {
        name: 'Ms.CloudSecurity.CI.ScanResult',
        properties: getEventProperties()
    };
    return eventData;
}
function getEventProperties() {
    const timestamp = new Date().toISOString();
    const containerScanResult = getContainerScanResult();
    let properties = {
        "$type": "ciScanResultV1",
        "requestId": uuid_1.v4(),
        "publishTime": timestamp,
        "workflowMetadata": {
            "provider": "githubAction",
            "definitionUrl": "<placeholder>",
            "runUrl": `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
            "repositoryUrl": `https://github.com/${process.env.GITHUB_REPOSITORY}`,
            "branch": process.env.GITHUB_REF,
            "commit": getCommitSha(),
        },
        "result": {
            "$type": "vulnscanV1",
            "provider": "trivy",
            "target": {
                "$type": "containerImage",
                "image": containerScanResult['imageName']
            },
            "identifiers": [
                {
                    "$type": "cve",
                    "values": [
                        {
                            "$type": "identifierValue",
                            "severity": "high",
                            "values": [
                                "CVE-2017-0929",
                                "CVE-2017-0921"
                            ]
                        },
                        {
                            "$type": "identifierValue",
                            "severity": "medium",
                            "values": [
                                "CVE-2017-0930"
                            ]
                        }
                    ]
                }
            ]
        }
    };
    return properties;
}
function getCommitSha() {
    return process.env.GITHUB_SHA;
}
function getContainerScanResult() {
    const resultPath = core.getInput('logs-path', { required: true });
    const payload = fileHelper.getFileJson(resultPath);
    return payload;
}
