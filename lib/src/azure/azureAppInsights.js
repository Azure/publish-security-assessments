"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
exports.postEvent = void 0;
const core = require("@actions/core");
const Inputs = require("../utils/inputs");
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
