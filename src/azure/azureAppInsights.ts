// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as core from '@actions/core';
import * as Inputs from '../utils/inputs';
let appInsights = require('applicationinsights');

export function postEvent(eventData: any): void {
  appInsights.setup(Inputs.authKey);
  const appInsightsClient = appInsights.defaultClient;

  console.log('Posting scan results to Azure AppInsights...');
  core.debug(`Event data: ${JSON.stringify(eventData)}`);

  appInsightsClient.trackEvent(eventData);
  appInsightsClient.flush();

  console.log('Event posted!');
}