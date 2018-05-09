# BLOCKS CLI

<!-- MarkdownTOC -->

- Install
- Help
- Usage
- Login
- Init
- Pull
- Push
- Start
- Stop
- TODO

<!-- /MarkdownTOC -->


<a name="install"></a>
## Install

```zsh
npm install -g pubnub-cli
```

<a name="help"></a>
## Help

```
node pubnub-cli -h
```

<a name="usage"></a>
## Usage

```zsh
Usage:
  pubnub-cli [OPTIONS] <command> [ARGS]

Options:
  -b, --block NUMBER     Specify a Block ID
  -k, --key NUMBER       Specify a Subscribe Key ID
  -f, --file PATH        Specify a block file
      --debug            Show debug information
  -h, --help             Display help and usage details

Commands:
  init, login, logout, pull, push, start, stop
```

<a name="login"></a>
## Login

Authorizes this computer with PubNub API.

Input:

```zsh
pubnub-cli login
```

Output:

```zsh
pubnub-cli login
INFO: Reading session from /Users/ian/.pubnub-cli
? PubNub Email: ian@pubnub.com
? PubNub Password: *************
Logging In... Done!
INFO: Writing session to /Users/ian/.pubnub-cli
OK: ---------------------------------------
OK: Logged In!
OK: Deluxe!
OK: ---------------------------------------
```

Creates a file ```~/.pubnub-cli``` with PubNub session properties:

```json
{
    "created": 1463775328,
    "expires": 1467587119,
    "modified": 1464995119,
    "role": "user",
    "status": 1,
    "storage": "{}",
    "token": "38583023-a36a-4a03-97f6-c838bd9f7aab",
    "user": {
    },
    "user_id": 198072,
    "user_roles": {
    }
}
```

This file is used for every request thereafter.

<a name="init"></a>
## Init

Writes a ```block.json``` file. Use selects key and block (or creates a new block). Block information is pulled from server and persisted into file.

Note the ```-f``` specifies the directory of the future ```block.json``` file. See "Pull" below for more info on ```block.json```.

Input:

```zsh
pubnub-cli init
```

Output:

```zsh
INFO: Reading session from /Users/ian/.pubnub-cli
OK: Working as ian@meetjennings.com
INFO: Checking for block.json in /Users/ian/Development/new-project/block.json
INFO: Writing block.json to /Users/ian/Development/new-project/block.json
INFO: Reading block.json from /Users/ian/Development/new-project/block.json
OK: Which app are you working on?
? Select a key eon-demos
OK: Which block are you working on?
? Select a block Email Sendgrid Block
INFO: Writing block.json to /Users/ian/Development/new-project/block.json
INFO: Writing event handler to /Users/ian/Development/new-project/js-after-publish/send-email.js
OK: ---------------------------------------
OK: New block.json written to disk.
OK: Deluxe!
OK: ---------------------------------------
OK: Use this handy command next time:
OK: node pubnub-cli init -b 853 -k 145183
```

<a name="pull"></a>
## Pull

Pulls block information from server and writes to ```block.json```.

Input

```zsh
pubnub-cli pull
```

Output

```zsh
INFO: Reading session from /Users/ian/.pubnub-cli
OK: Working as ian@meetjennings.com
INFO: Reading block.json from /Users/ian/Development/new-project/block.json
OK: Working on block Email Sendgrid Block
INFO: Writing block.json to /Users/ian/Development/new-project/block.json
INFO: Writing event handler to /Users/ian/Development/new-project/js-after-publish/send-email.js
OK: ---------------------------------------
OK: Local block.json updated with remote data.
OK: Deluxe!
OK: ---------------------------------------
OK: Use this handy command next time:
OK: node pubnub-cli pull -b 853 -k 145183
```

Block.json looks like:

```json
{
    "_key_id": 145183,
    "_id": 40,
    "name": "name this block",
    "description": "describe this block",
    "event_handlers": [
        {
            "_id": 69,
            "name": "Wohoo!",
            "event": "js-before-publish",
            "channels": "input"
        },
        {
            "_id": 107,
            "name": "kjklhlkjh",
            "event": "js-before-publish",
            "channels": "input"
        }
    ]
}
```

The properties ```_key_id``` and ```_id``` represent the key id and block id respectively. These should not be modified.

<a name="push"></a>
## Push

Updates server with information provided in block.json. Upload code by specifying a ```file``` within the event handler object. See below for example.

Input

```zsh
pubnub-cli push
```

Output

```zsh
INFO: Reading session from /Users/ian/.pubnub-cli
OK: Working as ian@meetjennings.com
INFO: Reading block.json from /Users/ian/Development/new-project/block.json
OK: Working on block Email Sendgrid Block
INFO: Uploading event handler from /Users/ian/Development/new-project/js-after-publish/send-email.js
OK: ---------------------------------------
OK: Block pushed
OK: Deluxe!
OK: ---------------------------------------
OK: Use this handy command next time:
OK: node pubnub-cli push -b 853 -k 145183
```

Sample block.json for uploading event handlers directly:

```json
{
    "_key_id": 145183,
    "_id": 40,
    "name": "name this block",
    "description": "describe this block",
    "event_handlers": [
        {
            "_id": 69,
            "name": "a handler",
            "event": "js-before-publish",
            "channels": "input",
            "file": "/after-presence/sample_handler.js"
        },
        {
            "_id": 107,
            "name": "a handler",
            "event": "js-before-publish",
            "channels": "input",
            "file": "/before-publish/sample_handler.js"
        },
        {
            "_id": 118,
            "name": "a handler",
            "event": "js-after-publish",
            "channels": "input",
            "file": "/after-publish/sample_handler.js"
        }
    ]
}
```

<a name="start"></a>
## Start

Starts running a block.

Input

```zsh
pubnub-cli start
```

Output

```zsh
INFO: Reading session from /Users/ian/.pubnub-cli
OK: Working as ian@meetjennings.com
INFO: Reading block.json from /Users/ian/Development/new-project/block.json
OK: Working on block Email Sendgrid Block
OK: Sending start command
INFO: Subscribing to blocks status channel...
Starting Block...
OK: ---------------------------------------
OK: Block started
OK: Deluxe!
OK: ---------------------------------------
```

## Stop

Stops a running block.

Input

```zsh
pubnub-cli stop
```

Output

```zsh
NFO: Reading session from /Users/ian/.pubnub-cli
OK: Working as ian@meetjennings.com
INFO: Reading block.json from /Users/ian/Development/new-project/block.json
OK: Working on block Email Sendgrid Block
OK: ---------------------------------------
OK: Block stopped
OK: Deluxe!
OK: ---------------------------------------
```

<a name="todo"></a>
## TODO

- Create event handler through CLI
- Update event handler and block through CLI

