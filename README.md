# verum-cli
the official command-line client for the Verum encrypted chat system

## What can verum-cli do?
`verum-cli` is a fairly flexible application, especially as it's open source. It's capable of registering you on a Node, updating your public key on your Node, sending a messages, and retrieving and decrypting your messages.

## How does it work?
`verum-cli` commands, mostly, follow the following syntax:
```
verum-cli <verum id> <password> [action] [options]
```
where `verum id` is your Verum ID (of the form _user_@_node_, eg. Scratso@node.verum.damianheaton.com), `password` is your password for that Node, and `action` is one of the following:

### Actions

**register**

This will register you on the Node `node` (as determined by your `verum id`) with the username `user` (similarly determined), giving you a Verum ID exactly as the one specified as `verum id`. This may not be successful if a user already exists on the Node with your username, but we'll alert you if that happens. No `options` are required.

**updatepubkey**

This will guide you through the process of updating your public key on the Node. No `options` are required, but **beware!** that, when asked for your new public key, you **must** specify the path of an exported ascii armored key file, **relative to the path displayed ion the "NOTICE" at the beginning of each client call**. `..` paths, etc, may be used.

**getmsgs**

This will retrieve, and attempt to decrypt, all of your received messages from the Node, and display them to you. The same file path warning applies as in `updatepubkey`. No `options` are needed.

**sendmsg**

This command has two required `options`:

- `recipient's verum id`
  - the Verum ID of the recipient, as _user_@_node_
- `message to send`
  - the message to be sent. As this is **1** value, your message **must** be surrounded by quotes (`"`s), with internal quotes escaped with a backslash (`\`)

The same file path warning applies as in `updatepubkey`.

## Installation

`verum-cli` is provided as a Snap Package, so you should [install that](https://snapcraft.io/docs/core/install) first.

Then, simply run `[sudo] snap install verum-cli` to install it. Run `snap refresh` to update your Snap apps.

## Conveniences

`verum-cli` includes a convenience to make your life easier: saved verum ID and password. This is done thusly:

1. Navigate to the path shown in the "NOTICE".
2. Create a file called `user.json`.
3. Add the content: ```{
    "username": "user@examplenode.net",
    "password": "randomPass123"
  }```
  - you should replace `user@examplenode.net` with your `verum id` and `randomPass123` with your verum password.
4. You no longer need to include your username and password in `verum-cli` calls. Nice!

(Note that if you do specify a `verum id` and password via the CLI, that will *always* take priority over `user.json`.)
