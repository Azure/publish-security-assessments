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
Object.defineProperty(exports, "__esModule", { value: true });
exports.readInputs = exports.subscriptionId = exports.authKey = exports.scanResultsPath = exports.scanProvider = exports.connectionString = exports.instrumentationKey = exports.subscriptionToken = exports.artifactId = exports.artifactType = void 0;
const core = __importStar(require("@actions/core"));
const SUBSCRIPTION_TOKEN_SEPARATOR = '.';
function readInputs() {
    exports.artifactType = core.getInput('artifact-type', { required: true });
    exports.subscriptionToken = core.getInput('subscription-token', { required: true });
    exports.connectionString = core.getInput('connection-string');
    exports.scanResultsPath = core.getInput('scan-results-path');
    exports.instrumentationKey = core.getInput('instrumentation-key');
    exports.artifactId = core.getInput('artifact-id');
    exports.scanProvider = core.getInput('scan-provider');
    processAuthInputs();
    processSubscriptionToken();
}
exports.readInputs = readInputs;
function processAuthInputs() {
    if (!exports.connectionString && !exports.instrumentationKey) {
        throw new Error('Neither connection string nor instrumentation key is provided. Please provide one of these to authenticate to application insights.');
    }
    if (exports.connectionString && exports.instrumentationKey) {
        console.log('Both connection string and instrumentation key are provided. Connection string will be used to connect to application insights.');
    }
    exports.authKey = exports.connectionString || exports.instrumentationKey;
}
function processSubscriptionToken() {
    if (!exports.subscriptionToken) {
        throw new Error('subscription-token cannot be empty.');
    }
    const subscriptionTokenParts = exports.subscriptionToken.split(SUBSCRIPTION_TOKEN_SEPARATOR);
    if (subscriptionTokenParts.length !== 2 || !subscriptionTokenParts[0] || !subscriptionTokenParts[1]) {
        throw new Error('Invalid subscription-token.');
    }
    exports.subscriptionId = subscriptionTokenParts[0];
}
