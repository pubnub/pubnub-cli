# BLOCKS CLI

<!-- MarkdownTOC -->

- [Install](#install)
- [Help](#help)
- [Usage](#usage)
- [Debug](#debug)
- [Login](#login)
- [Init](#init)
- [Pull](#pull)
- [Push](#push)
- [TODO](#todo)

<!-- /MarkdownTOC -->

<a name="install"></a>
## Install

```zsh
git clone git@github.com:pubnub/blocks-catalog.git
cd blocks-catalog/api
npm install
../cli
npm install
```

<a name="help"></a>
## Help

```
node index.js -h
```

<a name="usage"></a>
## Usage

```bash
Usage:
  index.js [OPTIONS] [ARGS]

Options:
      --login            Log Into PubNub
      --logout           Logout of PubNub
      --init             Create a Block in current directory
      --push             Push directory as Block.
  -b, --block NUMBER     Specify a Block ID
  -k, --key NUMBER       Specify a Subscribe Key ID
  -e, --handler NUMBER   Specify an Event Handler ID
  -f, --file PATH        Specify a block file
      --debug            Show debug information
  -h, --help             Display help and usage details
```

<a name="debug"></a>
## Debug

For now I recommend always running commands with ```--debug```.

<a name="login"></a>
## Login

Authorizes this computer with PubNub API.

Input:

```zsh
node index.js login --debug
```

Output:

```zsh
DEBUG: running these controllers
DEBUG: settings,session
DEBUG: settings
DEBUG: session
INFO: No session found, please log in.
? PubNub Email: ian@meetjennings.com
? PubNub Password: *************
Logging In... Done!
OK: Deluxe!
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
node index.js init -f /block-template --debug
```

Output:

```zsh
DEBUG: running these controllers
DEBUG: settings,session,block_file_create,block_read,key,block,block_write,event_handler_write
DEBUG: settings
DEBUG: block_file_create
DEBUG: session
INFO: Working as ian@meetjennings.com
DEBUG: block_read
DEBUG: key
? Select a key eon-demos
DEBUG: block
? Select a block name this block
DEBUG: block_write
DEBUG: event_handler_write
OK: Deluxe!
```

<a name="pull"></a>
## Pull

Pulls block information from server and writes to ```block.json```.

Input

```zsh
node index.js pull -f /block-template --debug
```

Output

```zsh
DEBUG: running these controllers
DEBUG: settings,session,block_read,key,block,block_write,block_read,event_handler_write
DEBUG: settings
DEBUG: session
INFO: Working as ian@meetjennings.com
DEBUG: block_read
DEBUG: key
DEBUG: block
DEBUG: block_write
DEBUG: event_handler_write
OK: Deluxe!
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
            "channels": "adfasdf"
        },
        {
            "_id": 107,
            "name": "kjklhlkjh",
            "event": "js-before-publish",
            "channels": "ljlkjl;j"
        },
        {
            "_id": 118,
            "name": "safasdf",
            "event": "js-after-publish",
            "channels": "asdfasdf"
        },
        {
            "_id": 307,
            "name": "new eh",
            "event": "js-before-publish",
            "channels": "asdf"
        }
    ]
}
```

The properties ```_key_id``` and ```_id``` represent the key id and block id respectively. These should not be modified and will eventually be hidden from the user.

<a name="push"></a>
## Push

Updates server with information provided in block.json. Upload code by specifying a ```file``` within the event handler object. See below for example.

Input

```zsh
node index.js --debug push -f /block-template
```

Output

```zsh
DEBUG: running these controllers
DEBUG: settings,session,block_read,key,block,block_write,block_read,block_push,event_handler_push
DEBUG: settings
DEBUG: session
INFO: Working as ian@meetjennings.com
DEBUG: block_read
DEBUG: key
DEBUG: block
DEBUG: block_write
DEBUG: block_push
DEBUG: event_handler_push
OK: Block Pushed
OK: Deluxe!
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
            "name": "Wohoo!",
            "event": "js-before-publish",
            "channels": "adfasdf",
            "file": "/after-presence/sample_handler.js"
        },
        {
            "_id": 107,
            "name": "kjklhlkjh",
            "event": "js-before-publish",
            "channels": "ljlkjl;j",
            "file": "/before-publish/sample_handler.js"
        },
        {
            "_id": 118,
            "name": "safasdf",
            "event": "js-after-publish",
            "channels": "asdfasdf",
            "file": "/after-publish/sample_handler.js"
        }
    ]
}
```

<a name="todo"></a>
## TODO

- Clone block into directories
- Create event handler through CLI
- Bring back start / stop block
- Bring back update event handler and block through CLI

