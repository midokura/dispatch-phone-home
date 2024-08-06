# `dispatch-phone-home` github action

This action will call a `workflow_dispatch` event on a specified
repository and will pass the parameters necessary for it to
"phone home" and sets the commit status on the caller repository.

This is useful when you want to dispatch a workflow in a
different organization, and want the status to be reported back
to be used by the status checks.

This action is to be used in conjunction with [casaroli/phone-home](https://github.com/casaroli/phone-home/)

The development and the source files are in [casaroli/repo-dispatch](https://github.com/casaroli/repo-dispatch/).
If you have any problems, please open an issue there.

## Inputs

### `dispatch-token`

The token that will be used to dispatch the call to the
referenced repository. Default: `${{ github.token }}`.

### `dispatch-repository`

The repository in which to dispatch the `workflow_dispatch` event. Required.

### `dispatch-ref`

The ref to dispatch to. This can be the branch name such as `main`. Required.

### `dispatch-workflow`

The workflow to dispatch. This must be a valid workflow
configured with `workflow_dispatch` event. Required.

### `status-context`

The context name to be used for the reporting of the status of
the dispatch. Can be any text. Required.

### `status-token`

The token passed to the called workflow for it to use when
reporting back the status. It must be a token that has
permissions to write the status. It is recommended to use a
secret. Default is `${{ github.token }}`.

### `status-repository`:

The repository to report status to. By default is the current
repository: `${{ github.repository }}`.

The commit sha to report the status to. By default is the current commit sha: `${{ github.sha }}`.

### `inputs`

a JSON string containing the inputs to pass to the dispatched
workflow. Empty by default.

### `phone-home-input-name`:

The name of the input to be used for sending the data for the
dispatched workflow to report back the status. By default it is
`phone-home`.

The dispatched workflow should declare this input and pass it to
the `phone-home` action.

## Example usage

Example of a caller workflow that dispatches an event to the
dispatched workflow:

```yaml
name: Caller example

on:
  push:

jobs:
  call:
    name: Dispatch another workflow
    runs-on: ubuntu-22.04
    steps:
      - uses: casaroli/dispatch-phone-home@v1
        with:
          dispatch-repository: casaroli/my-other-repository
          dispatch-ref: main
          dispatch-workflow: dispatched.yml
          status-context: My other checks
          status-token: ${{ secrets.WRITE_COMMIT_STATUS_TOKEN }}
          inputs: |
            {
              "my-input": "some extra data"
            }

```

See the example for [casaroli/phone-home](https://github.com/casaroli/phone-home/) for the corresponding dispatched workflow.

### Dispatched workflow

```yaml
name: Dispatched example

on:
  workflow_dispatch:
    inputs:
      my-input:
        description: user data to pass
        type: string
        required: false
      phone-home:
        type: string
        required: false
    
jobs:
  dispatched:
    name: Dispatched job
    runs-on: ubuntu-22.04
    steps:
      - uses: casaroli/phone-home@v1
        with:
          phone-home-input: ${{ inputs.phone-home }}

      - name: process something
        run: sleep 30
```
