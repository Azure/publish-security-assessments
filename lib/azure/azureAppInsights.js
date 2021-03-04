"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
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
exports.postEvent = void 0;
const core = __importStar(require("@actions/core"));
const Inputs = __importStar(require("../utils/inputs"));
let appInsights = require('applicationinsights');
function postEvent(eventData) {
    appInsights.setup(Inputs.authKey);
    const appInsightsClient = appInsights.defaultClient;
    const requestId = eventData.properties.context.requestId;
    console.log(`Posting scan results to Azure AppInsights. Request Id: ${requestId}`);
    core.debug(`Event data: ${JSON.stringify(eventData)}`);
    appInsightsClient.trackEvent(eventData);
    appInsightsClient.flush();
    console.log('Event posted!');
}
exports.postEvent = postEvent;
