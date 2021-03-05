// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as core from '@actions/core';
import * as Inputs from '../utils/inputs';
import * as ApplicationInsights from 'applicationinsights';
import { ScanProperties } from './scanResultContracts';
let appInsights = require('applicationinsights');

export function postEvent(eventData: ApplicationInsights.Contracts.EventTelemetry): void {
  appInsights.setup(Inputs.authKey);
  const appInsightsClient = appInsights.defaultClient;
  const requestId = (eventData.properties as ScanProperties).context.requestId;

  console.log(`Posting scan results to Azure AppInsights. Request Id: ${requestId}`);
  core.debug(`Event data: ${JSON.stringify(eventData)}`);

  appInsightsClient.trackEvent(eventData);
  appInsightsClient.flush();

  console.log('Event posted!');
}