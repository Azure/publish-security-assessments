// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as core from '@actions/core';
import * as AzureAppInsights from '../azure/azureAppInsights';
import * as ContainerScanHelper from '../scanHelpers/containerScanHelper';
import * as Inputs from './inputs';

const CONTAINER_IMAGE = 'containerImage';

export async function postScanResults(): Promise<void> {
  core.debug(`The subscription-token corresponds to subscription id: '${Inputs.subscriptionId}'`);

  if (Inputs.artifactType === CONTAINER_IMAGE) {
    if (!Inputs.scanProvider || Inputs.scanProvider === ContainerScanHelper.TRIVY) {
      const eventData = await ContainerScanHelper.getEventData();
      AzureAppInsights.postEvent(eventData);
    } else {
      throw new Error(`Scan provider '${Inputs.scanProvider}' is not supported for artifact type '${Inputs.artifactType}'.`);
    }
  } else {
    throw new Error(`Artifact type '${Inputs.artifactType}' is not supported.`);
  }
}