import * as core from '@actions/core';

const SUBSCRIPTION_TOKEN_SEPARATOR = '.';

export let artifactType: string;
export let artifactId: string;
export let subscriptionToken: string;
export let instrumentationKey: string;
export let connectionString: string;
export let scanProvider: string;
export let scanResultsPath: string;

export let authKey: string;
export let subscriptionId: string;

export function readInputs(): void {
  artifactType = core.getInput('artifact-type', { required: true });
  subscriptionToken = core.getInput('subscription-token', { required: true });
  connectionString = core.getInput('connection-string');
  scanResultsPath = core.getInput('scan-results-path');
  instrumentationKey = core.getInput('instrumentation-key');
  artifactId = core.getInput('artifact-id');
  scanProvider = core.getInput('scan-provider');

  processAuthInputs();
  processSubscriptionToken();
}

function processAuthInputs(): void {
  if (!connectionString && !instrumentationKey) {
    throw new Error('Neither connection string nor instrumentation key is provided. Please provide one of these to authenticate to application insights.');
  }

  if (connectionString && instrumentationKey) {
    console.log('Both connection string and instrumentation key are provided. Connection string will be used to connect to application insights.');
  }

  authKey = connectionString || instrumentationKey;
}

function processSubscriptionToken(): void {
  if (!subscriptionToken) {
    throw new Error('subscription-token cannot be empty.');
  }

  const subscriptionTokenParts = subscriptionToken.split(SUBSCRIPTION_TOKEN_SEPARATOR);
  if (subscriptionTokenParts.length !== 2 || !subscriptionTokenParts[0] || !subscriptionTokenParts[1]) {
    throw new Error('Invalid subscription-token.');
  }

  subscriptionId = subscriptionTokenParts[0];
}