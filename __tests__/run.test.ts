import { run } from '../src/run'
import * as Inputs from '../src/utils/inputs';
import * as fileHelper from '../src/utils/fileHelper';
import * as execHelper from '../src/utils/execHelper';
import * as containerScanHelper from '../src/scanHelpers/containerScanHelper';
import * as azureAppInsights from '../src/azure/azureAppInsights';
import * as ApplicationInsights from 'applicationinsights';
import * as core from '@actions/core';
import * as fs from 'fs';

var mockStatusCode, stdOutMessage, stdErrMessage;
const mockExecFn = jest.fn().mockImplementation((toolPath, args, options) => {
    options.listeners.stdout(!stdOutMessage ? '' : stdOutMessage); 
    options.listeners.stderr(!stdErrMessage ? '' : stdErrMessage); 
    return mockStatusCode;
})

jest.mock('applicationinsights', () => {
    return {
        setup: () => {},
        defaultClient: {
            trackEvent: () => {},
            flush: () => {}
        }
    }
});

jest.mock('@actions/exec', () => {
    return {
        exec: (toolPath, args, options) => mockExecFn(toolPath, args, options)  
    }
});

describe('Testing all functions in execHelper file.', () => {
    test('exec() - execute the given command and return the outputs', async () => {
        mockStatusCode = 0
        stdOutMessage = 'vSomething'
        stdErrMessage = 'no errors'

        expect(await execHelper.exec('docker', ['version'])).toMatchObject({ exitcode: 0, stdout: 'vSomething', stderr: 'no errors' });
        expect(mockExecFn).toBeCalledTimes(1);
    });
});

describe('Testing all functions in azureAppInsights file.', () => {
    test('postEvent() - post event data on appInsights', async () => {
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(core, 'debug').mockImplementation();

        expect(azureAppInsights.postEvent({
            properties: { context: { requestId: 1 } }
        } as unknown as ApplicationInsights.Contracts.EventTelemetry)).toBeUndefined();
    });
});

describe('Testing all functions ins inputs file.', () => {
    test('readInputs() - get and process all inputs', () => {
        jest.spyOn(core, 'getInput').mockImplementation((input) => {
            if (input == 'artifact-type') return 'containerImage';
            if (input == 'subscription-token') return 'subscriptionId.token';
            if (input == 'connection-string') return 'InstrumentationKey=inst-key-for-app-in';
            if (input == 'instrumentation-key') return 'inst-key-for-app-in';
            if (input == 'scan-results-path') return 'pathToScanResultsFile';
            if (input == 'artifact-id') return 'imageDigest';
            if (input == 'scan-provider') return 'trivy';
        });
        jest.spyOn(console, 'log').mockImplementation();

        expect(Inputs.readInputs()).toBeUndefined();
    });

    test('readInputs() - throw error if either instrumentation-key or connection-string arent provided', () => {
        jest.spyOn(core, 'getInput').mockImplementation((input) => {
            if (input == 'artifact-type') return 'containerImage';
            if (input == 'scan-provider') return 'trivy';
        });
        jest.spyOn(console, 'log').mockImplementation();

        expect(() => Inputs.readInputs()).toThrow('Neither connection string nor instrumentation key is provided. Please provide one of these to authenticate to application insights.');
    });

    test('readInputs() - throw error if invalid subscription token is provided', () => {
        jest.spyOn(core, 'getInput').mockImplementation((input) => {
            if (input == 'artifact-type') return 'containerImage';
            if (input == 'instrumentation-key') return 'inst-key-for-app-in';
            if (input == 'subscription-token') return 'subscriptionId';
            if (input == 'scan-provider') return 'trivy';
        });

        expect(() => Inputs.readInputs()).toThrow('Invalid subscription-token.');
    });

    test('readInputs() - throw error if subscription token is not provided', () => {
        jest.spyOn(core, 'getInput').mockImplementation((input) => {
            if (input == 'artifact-type') return 'containerImage';
            if (input == 'instrumentation-key') return 'inst-key-for-app-in';
            if (input == 'scan-provider') return 'trivy';
        });

        expect(() => Inputs.readInputs()).toThrow('subscription-token cannot be empty.');
    });
});

describe('Testing all functions ins fileHelper file.', () => {
    test('fileHelper() - parse json from a file and return it', () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');

        expect(fileHelper.getFileJson('pathToJsonFile')).toMatchObject({});
        expect(fs.readFileSync).toBeCalledWith('pathToJsonFile', 'utf-8');
    });

    test('fileHelper() - throw error if file contains invalid json', () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue('');

        expect(() => fileHelper.getFileJson('pathToJsonFile')).toThrow('An error occured while parsing the contents of the file: pathToJsonFile. Error: SyntaxError: Unexpected end of JSON input');
        expect(fs.readFileSync).toBeCalledWith('pathToJsonFile', 'utf-8');
    });
});

describe('Testing all functions in containerScanHelper file.', () => {
    test('getEventData() - throw error if scan result does not contained required fields', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');

        await expect(containerScanHelper.getEventData()).rejects.toThrowError("Could not find image name and/or scan timestamp. Image name: '', Scan timestamp:");
        expect(fs.readFileSync).toBeCalledTimes(1);
    });

    test('getEventData() - throw error if incorrect digest is returned', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({imageName: 'sampleImage', vulnerabilityScanTimestamp: '1010'}));
        mockStatusCode = 0
        stdOutMessage = 'incorrectDigest'
        stdErrMessage = 'no errors'

        await expect(containerScanHelper.getEventData()).rejects.toThrowError('Unable to obtain Docker image digest. Error parsing Docker inspect result.');
        expect(fs.readFileSync).toBeCalledTimes(1);
    });

    test('getEventData() - throw error if command execution fails', async () => {
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({imageName: 'sampleImage', vulnerabilityScanTimestamp: '1010'}));
        mockStatusCode = 1
        stdOutMessage = ''
        stdErrMessage = 'error'

        await expect(containerScanHelper.getEventData()).rejects.toThrowError('Something went wrong while obtaining Docker image digest. Please ensure that Docker is installed on the runner and the image is present locally.');
        expect(fs.readFileSync).toBeCalledTimes(1);
    });

    test('getEventData() - create event data from input file and return it', async () => {
        const resultsFile = JSON.stringify({
            imageName: 'sampleImage', 
            vulnerabilityScanTimestamp: '1010', 
            vulnerabilities: [ 
                { vulnerabilityId: 1, severity: 'LOW' }, 
                { vulnerabilityId: 2, severity: 'LOW' } 
        ]})
        jest.spyOn(fs, 'readFileSync').mockReturnValue(resultsFile);
        mockStatusCode = 0
        stdOutMessage = 'imageDigest@something'
        stdErrMessage = ''
        const currentProcessEnv = process.env
        process.env.GITHUB_SHA = 'GithubSHA' 
        process.env.GITHUB_REF = 'master'

        const recievedEventData = await containerScanHelper.getEventData();
        delete recievedEventData.properties.requestId;
        const expectedEventData = {
            "name": "MS.CloudSecurity.CI.ScanResult",
            "properties": {
              "__version": "0.1",
              "context": {
                "artifactId": "something",
                "artifactType": "containerImage",
                "token": undefined
              },
              "vulnscan": {
                "allowList": [],
                "identifiers": [
                  {
                    "severity": "LOW",
                    "type": "cve",
                    "values": [
                      1,
                      2
                    ]
                  }
                ],
                "provider": "trivy",
                "scanTime": "1010"
              },
              "workflow": {
                "additionalData": {
                  "GITHUB_REF": "master",
                  "GITHUB_SHA": "GithubSHA"
                },
                "provider": "githubAction",
                "repositoryUrl": "https://github.com/undefined",
                "runUrl": "https://github.com/undefined/actions/runs/undefined"
              }
            }
        }
        expect(recievedEventData).toMatchObject(expectedEventData);
        expect(fs.readFileSync).toBeCalledTimes(1);
        process.env = currentProcessEnv;
    });
});