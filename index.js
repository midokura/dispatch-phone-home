import https from 'https';

/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    return val.trim();
}

var reportStatus = (token, repository, sha, context, state, description, url) => new Promise((resolve, reject) => {
    const status_req = https.request({
        hostname: 'api.github.com',
        port: 443,
        path: `/repos/${repository}/statuses/${sha}`,
        method: 'POST',
        headers: {
            'User-Agent': 'casaroli',
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28'
        },
    }, (res) => {
        let data = Buffer.alloc(0);
        res.on('data', (d) => {
            data = Buffer.concat([data, d]);
        });
        res.on('close', () => {
            console.log('received statusCode:', res.statusCode);
            if (!res.statusCode || Math.floor(res.statusCode / 100) != 2) {
                console.error('error, bad statusCode', res.statusCode, 'expected: 2xx');
                reject();
            }
        });
        res.on('end', () => {
            if (data.length) {
                const str = new TextDecoder().decode(data);
                console.log("received data:", JSON.parse(str));
            }
            resolve(data);
        });
    });
    status_req.on('error', (e) => {
        console.error(e);
        reject();
    });
    status_req.end(JSON.stringify({
        state: state,
        description: description,
        context: context,
        target_url: null
    }));
});

var dispatchWorkflow = (token, repository, ref, workflow, inputs) => new Promise((resolve, reject) => {
    const status_req = https.request({
        hostname: 'api.github.com',
        port: 443,
        path: `/repos/${repository}/actions/workflows/${workflow}/dispatches`,
        method: 'POST',
        headers: {
            'User-Agent': 'casaroli',
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28'
        },
    }, (res) => {
        let data = Buffer.alloc(0);
        res.on('data', (d) => {
            data = Buffer.concat([data, d]);
        });
        res.on('close', () => {
            console.log('received statusCode:', res.statusCode);
            if (!res.statusCode || Math.floor(res.statusCode / 100) != 2) {
                console.error('error, bad statusCode', res.statusCode, 'expected 2xx');
                reject();
            }
        });
        res.on('end', () => {
            if (data.length) {
                const str = new TextDecoder().decode(data);
                console.log("received data:", JSON.parse(str));
            }
            resolve(data);
        });
    });
    status_req.on('error', (e) => {
        console.error(e);
        reject();
    });
    status_req.end(JSON.stringify({
        ref: ref,
        inputs: inputs
    }));
});

const dispatch_token = getInput('dispatch-token');
const dispatch_repository = getInput('dispatch-repository');
const dispatch_ref = getInput('dispatch-ref');
const dispatch_workflow = getInput('dispatch-workflow');
const status_context = getInput('status-context');
const status_token = getInput('status-token');
const status_repository = getInput('status-repository');
const status_sha = getInput('status-sha');
const inputs = getInput('inputs');
const phone_home_input_name = getInput('phone-home-input-name');
const dispatchInputs = {};
const inputs_obj = JSON.parse(inputs);
console.log('::group::Parse Inputs');
if (inputs_obj[phone_home_input_name]) {
    console.error(`error: cannot have ${phone_home_input_name} in inputs: ${inputs}`);
    throw 'error, bad input';
}
for (const [key, value] of Object.entries(inputs_obj)) {
    if (typeof (value) == 'number' ||
        typeof (value) == 'boolean') {
        dispatchInputs[key] = value.toString();
    }
    else if (typeof (value) == 'string') {
        dispatchInputs[key] = value;
    }
}
dispatchInputs[phone_home_input_name] = `${status_token};${status_repository};${status_sha};${status_context}`;
console.log('inputs:', dispatchInputs);
console.log("::endgroup::");
console.log(`::group::Dispatch ${dispatch_workflow} on ${dispatch_repository}`);
console.log('ref:', dispatch_ref);
console.log('inputs:', dispatchInputs);
await dispatchWorkflow(dispatch_token, dispatch_repository, dispatch_ref, dispatch_workflow, dispatchInputs);
console.log("::endgroup::");
console.log('::group::Report dispatched status to self');
console.log('context:', status_context);
await reportStatus(status_token, status_repository, status_sha, status_context, 'pending', 'Dispatched');
console.log("::endgroup::");
//# sourceMappingURL=index.js.map
