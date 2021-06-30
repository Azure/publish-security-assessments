# Publish Security Scans

This action can be used to publish security assessments done as part of CI workflows on GitHub to Azure Security Center. This will help to enhance the security posture of resources on Azure by shifting left and getting visibility of the security scans done earlier in the software supply chain.

## Prerequisites

To use this action, the following prerequisites must be met on Azure -

- **Enable the container registry bundle on ASC**: This is required to enable container image security insights. Refer to the [documentation](https://docs.microsoft.com/en-us/azure/security-center/defender-for-container-registries-introduction) for more information.
- **Configure an application insights workspace**: Scan assessments will be published to this workspace which will then be picked up by ASC. Going forward, ASC will introduce managed workspaces which can be used in lieu of creating your own one.

## Action Inputs

<table>
    <thead>
        <tr>
            <th width="25%">Input</th>
            <th width="65%">Description</th>
            <th width="10%">Default Value</th>
        </tr>
    </thead>
    <tr>
        <td><code>artifact-type</code></td>
        <td>(Required) The type of artifact scanned. Supported values - <code>containerImage</code></td>
        <td><code>containerImage</code></td>
    </tr>
    <tr>
        <td><code>artifact-id</code></td>
        <td>(Optional) Unique identifier for the artifact. For artifact-type <code>containerImage</code>, the action will take the image digest by default by using docker cli.</td>
        <td>Container image digest</td>
    </tr>
    <tr>
        <td><code>subscription-token</code></td>
        <td>(Required) ASC subscription token which can be found on the ASC portal.</td>
        <td>-</td>
    </tr>
    <tr>
        <td><code>instrumentation-key</code></td>
        <td>(Optional) Instrumentation key of the application insights instance. **Note** Either this or <code>connection-string</code> needs to be provided.</td>
        <td>-</td>
    </tr>
    <tr>
        <td><code>connection-string</code></td>
        <td>(Optional) Connection string of the application insights instance. **Note** Either this or <code>instrumentation-key</code> needs to be provided.</td>
        <td>-</td>
    </tr>
    <tr>
        <td><code>scan-provider</code></td>
        <td>(Required) The tool used to scan the artifact. Supported values - <code>trivy</code>. For artifact-type <code>containerImage</code>, the default value will be <code>trivy</code></td>
        <td><code>trivy</code></td>
    </tr>
    <tr>
        <td><code>scan-results-path</code></td>
        <td>(Required) Path to the file containing the scan results. Based on the scan-provider, supported file types and schema will change.</td>
        <td>-</td>
    </tr>
</table>

## Sample Yaml snippets

### Publish container scan results to ASC

```yaml
- name: Publish container scan results to ASC
  uses: azure/publish-security-assessments@v0
  with:
    artifact-type: containerImage
    subscription-token: ${{ secrets.asc_subscription_token }}
    instrumentation-key: ${{ secrets.ai_instrumentation_key }}
    scan-results-path: <path-to-scan-results-file>
```

### End to end workflow

The following is an example of not just this action, but how this action could be used along with other actions to setup a CI.

This workflow does the following -
- Build a docker image 
- Scan the docker image for any security vulnerabilities
- Publish scan results to ASC
- Publish it to your private container registry.

```yaml
on: [push]

jobs:
  build-secure-and-push:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master

    - run: docker build . -t contoso.azurecr.io/k8sdemo:${{ github.sha }}
      
    - name: Scan container image for vulnerabilities
      id: container_scan
      uses: Azure/container-scan@v0
      with:
        image-name: contoso.azurecr.io/k8sdemo:${{ github.sha }}

    - name: Publish container scan results to ASC
      uses: azure/publish-security-assessments@v0
      with:
        subscription-token: ${{ secrets.asc_subscription_token }}
        instrumentation-key: ${{ secrets.ai_instrumentation_key }}
        scan-results-path: ${{ steps.container_scan.outputs.scan-report-path }}
    
    - uses: Azure/docker-login@v1
      with:
        login-server: contoso.azurecr.io
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - run: docker push contoso.azurecr.io/k8sdemo:${{ github.sha }}
```

## Scan Results Schema

### Container Scan result

```json
{
  "imageName": "nginx:1.17",
  "vulnerabilityScanTimestamp": "2020-12-01T08:28:54.245Z",
  "vulnerabilities": [
    {
      "vulnerabilityId": "CVE-2020-10878",
      "packageName": "perl-base",
      "severity": "HIGH",
      "description": "..."
    },
    ...
  ],
  "bestPracticeViolations": [
    {
      "code": "CIS-DI-0001",
      "title": "Create a user for the container",
      "level": "WARN",
      "alerts": "Last user should not be root"
    },
    ...
  ]
}
```

### Sample ScanResult event

```json
{
    "name": "MS.CloudSecurity.CI.ScanResult",
    "properties": {
        "__version": "0.1",
        "context": {
            "artifactType": "containerImage",
            "artifactId": "sha256:d8a928b2043db77e340b523547bf16cb4aa483f0645fe0a290ed1f20aab76257",
            "requestId": "7a432b5e-dfbd-4a83-a72a-03c15a43606c",
            "token": "***"
        },
        "workflow": {
            "provider": "githubAction",
            "runUrl": "https://github.com/octocat/hello-world/actions/runs/12345",
            "repositoryUrl": "https://github.com/octocat/hello-world",
            "additionalData": {
                "GITHUB_REF": "refs/heads/check",
                "GITHUB_SHA": "eca0572326b3a8bb4423c8ab2482d1e9f59df6c3"
            }
        },
        "vulnscan": {
            "provider": "trivy",
            "scanTime": "2021-06-14T11:05:33.154Z",
            "identifiers": [
                {
                    "severity": "HIGH",
                    "type": "cve",
                    "values": [
                        "CVE-2018-12886",
                        "CVE-2019-15847"
                    ]
                },
                {
                    "severity": "CRITICAL",
                    "type": "cve",
                    "values": [
                        "CVE-2019-20367",
                        "CVE-2021-33574",
                        "CVE-2021-20231"
                    ]
                }
            ],
            "allowList": []
        }
    }
}
```

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.



This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
