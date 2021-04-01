"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postScanResults = void 0;
const core = require("@actions/core");
const AzureAppInsights = require("../azure/azureAppInsights");
const ContainerScanHelper = require("../scanHelpers/containerScanHelper");
const Inputs = require("./inputs");
const CONTAINER_IMAGE = 'containerImage';
function postScanResults() {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`The subscription-token corresponds to subscription id: '${Inputs.subscriptionId}'`);
        if (Inputs.artifactType === CONTAINER_IMAGE) {
            if (!Inputs.scanProvider || Inputs.scanProvider === ContainerScanHelper.TRIVY) {
                const eventData = yield ContainerScanHelper.getEventData();
                AzureAppInsights.postEvent(eventData);
            }
            else {
                throw new Error(`Scan provider '${Inputs.scanProvider}' is not supported for artifact type '${Inputs.artifactType}'.`);
            }
        }
        else {
            throw new Error(`Artifact type '${Inputs.artifactType}' is not supported.`);
        }
    });
}
exports.postScanResults = postScanResults;
