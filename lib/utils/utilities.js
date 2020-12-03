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
const core = __importStar(require("@actions/core"));
const AzureAppInsights = __importStar(require("../azure/azureAppInsights"));
const ContainerScanHelper = __importStar(require("../scanHelpers/containerScanHelper"));
const Inputs = __importStar(require("./inputs"));
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
