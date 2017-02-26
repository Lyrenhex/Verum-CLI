# verum-cli
the official command-line client for the Verum encrypted chat system

## What can verum-cli do?
`verum-cli` is a fairly flexible application, especially as it's open source. It's capable of registering you on a Node, updating your public key on your Node, sending a messages, and retrieving and decrypting your messages.

## How does it work?
`verum-cli` commands, mostly, follow the following syntax:
```
verum-cli <action> [options]
```
where `action` is one of the following (though help can be obtained by providing a nonexistant action, or omitting the argument entirely):

### Actions

**setup**

This command sets up Verum-CLI with your Verum ID, password, public key, and private key. This command needs to **always** be used when you're:

- setting up Verum-CLI
- registering on a Verum Node
- updating your public key on a Verum Node
- switching Verum Nodes

This command takes no arguments, using a tutorial-based structure to get required details.

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

## What if I need to switch Nodes?

We get it. Sometimes Nodes are compromised, or you're changing your online identity. To change Nodes, just rerun `verum-cli setup` and `verum-cli register`. Then, update all your social media etc, and you're set!
