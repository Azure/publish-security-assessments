import * as core from '@actions/core';
import * as Inputs from './utils/inputs';
import { postScanResults } from './utils/utilities';

async function run() {
  try {
    Inputs.readInputs();
    await postScanResults();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();