"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
exports.readInputs = exports.subscriptionId = exports.authKey = exports.scanResultsPath = exports.scanProvider = exports.connectionString = exports.instrumentationKey = exports.subscriptionToken = exports.artifactId = exports.artifactType = void 0;
const core = require("@actions/core");
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
