#!/usr/bin/env node

const verum = require("verum").Client; // we only need the Client class
const readlineSync = require("readline-sync");
const readline = require("readline");
const fs = require("fs");

var data = null;

const PATH = process.env.HOME + '/';

try {
  data = JSON.parse(fs.readFileSync(`${PATH}data.json`, 'utf-8'));
  console.log(`Your public fingerprint is ${data.keys.public.fingerprint}`);
} catch (e) { }

if (process.argv.length < 3) {
  console.log(`Syntax: verum-cli <action> [options]
For help, you may consider entering a random action (such as 'help'), which will provide suggestions.

If this is your first use of Verum-CLI, you should use:
verum-cli setup`);
  process.exit();
}

action = process.argv[2];

/* if (!username)
  username = readlineSync.question("Node ID (user@node): ");
if (!password)
  password = readlineSync.question("Password: ", {hideEchoBack: true}); */

if (data !== null) {
  var node = data.id.split("@")[1].split(":");
  username = data.id.split("@")[0];
  var client = new verum (node[0], (node[1] !== undefined) ? node[1] : null);

  client.Events.on ('error', (err, ext) => {
    switch (err) {
      case "User Doesn't Exist":
        if (client.lastPubKeyRequestee === username) {
          // user doesn't exist on the node. Do they want to register?
          console.log("You don't seem to exist on the Node. Perhaps try the 'register' action?")
        } else {
          console.log(`[PROBABLY ${client.lastPubKeyRequestee}] ${ext}`);
        }
        break;
      case "Private Node":
        console.log(ext);
        break;
      case "Bad Format":
        console.log("Uh... Something went wrong with a request, and the server couldn't parse it. If you've modified the client, it could be that.");
        break;
      case "Incorrect Password":
        console.log("That password was incorrect. Perhaps you should try redo verum-cli setup?");
        break;
      case "User Missing Public Key":
        console.log("The user specified is missing a public key. You should tell them about this (but not by Verum).")
        break;
    }
  });
  client.Events.on('public_key', (user, key) => {
    if (user == username) {
      console.log("Your public fingerprint is ", new verum.Key(key).fingerprint);
      console.log("Your local fingerprint is ", data.keys.public.fingerprint);
      if (readlineSync.question("Would you like to synchronise your local key? (To change your local key, you should use 'verum-cli setup' first.) [y/N] ").toLowerCase() === "y") {
        client.updatePubKey (username, data.pass, data.keys.public.key);
      } else {
        process.exit();
      }
    }
  });
  client.Events.on('public_key_updated', (etc) => {
    console.log (etc);
    process.exit();
  });
  client.Events.on('message_decrypted', (message, sender, timestamp, sig) => {
    var msg = "";
    if (!sig)
      msg += "[SPAM] ";
    msg += `[${sender} ${new Date(timestamp).toUTCString()}] ${message}`;
    console.log(msg);
  });
  client.Events.on('message_buffer_emptied', () => {
    setTimeout(process.exit, 5000);
  });
  client.Events.on('registered', (ext) => {
    console.log("Registered: ", ext);
    process.exit();
  });

  client.Events.on ('welcome', (sourceUrl) => {
    console.log("Connected to Node. Node's source is available at: ", sourceUrl);
    handleCmd (action);
  });
} else if (action === "setup")
  handleCmd(action);
else
  console.log("You need to do 'verum-cli setup' first!");

function handleCmd (input) {
  switch (input) {
    case "setup":
      data = {};
      data.id = readlineSync.question("Please enter your (desired or existing) Verum ID. This should be of the format <username>@<node address>, where <> delimit parameters: ");
      data.pass = readlineSync.question("Please enter your Verum password: ", {hideEchoBack: true});
      var privKeyLoc = readlineSync.question(`Please enter the name of your exported ascii armored private key file. This should be inside ${PATH}, as other directories (like your home directory) are (for your safety) inaccessible to Verum-CLI: `);
      data.keys = {}
      fs.readFile(`${PATH}${privKeyLoc}`, 'utf-8', (err, dat) => {
        if (err)
          console.log("Couldn't read private key: ", err);
        else {
          data.keys.secret = new verum.Key(dat);
          call();
        }
      });
      var pubKeyLoc = readlineSync.question(`Please enter the name of your exported ascii armored public key file. The same restrictions apply as above: `);
      fs.readFile(`${PATH}${pubKeyLoc}`, 'utf-8', (err, dat) => {
        if (err)
          console.log("Couldn't read public key: ", err);
        else {
          data.keys.public = new verum.Key(dat);
          call();
        }
      });
      var i = 0;
      function call () {
        i++;
        if (i === 2) {
          fs.writeFile(`${PATH}data.json`, JSON.stringify(data, null, 4), 'utf-8', (err) => {
            if (err) throw err;
            console.log(`Successfully set up Verum-CLI!

If this is your first time using Verum, you should now do:
verum-cli register`);
          });
        }
      }
      break;
    case "getmsgs":
      console.log("The 'getmsgs' command has been renamed to 'get'. Please use 'verum-cli get' from now on.");
      break;
    case "sendmsg":
      console.log("The 'sendmsg' command has been renamed to 'send'. Please use 'verum-cli send' from now on.");
      break;
    case "get":
      client.getEncMsgs (username, data.pass, data.keys.secret.key);
      break;
    case "updatepubkey":
      client.getPubKey(username);
      break;
    case "send":
      if (process.argv.length >= 5){
        var recipient = process.argv[3];
        var message = process.argv[4];

        var recpNodeAddr = recipient.split("@")[1].split(":");
        recipient = recipient.split("@")[0];
        var recpNode = new verum(recpNodeAddr[0], (recpNodeAddr[1] !== undefined) ? recpNodeAddr[1] : null); // create a client connection to the sender's Node.

        recpNode.Events.on('welcome', (src) => {
          console.log("Recipient's Node's source is available at: ", src);
          recpNode.Events.on('message_sent', (etc) => {
            console.log("Message sent: ", etc);
            process.exit();
          });
          recpNode.sendEncMsg(recipient, message, data.id, data.keys.secret.key);
        });
      } else {
        console.log("Syntax: verum-cli send <Recipient's Verum ID> \"<message>\" (quotes must be included, <> delimit parameters that you should replace).");
        process.exit();
      }
      break;
    case "register":
      client.register (username, data.pass, data.keys.public.key);
      break;
    default:
      console.log(`Unknown action. Accepted actions:
        - 'setup' :: Sets your verum ID and password for Verum-CLI (this should also be used if your secret key changes!)
        - 'register' :: registers your user account on the Node (must be done after 'setup', and will not ask for user data)
        - 'send <recipient's Verum ID> <message>' :: sends a message to a recipient
        - 'get' :: retrieves your messages from the Node
        - 'updatepubkey' :: updates your pub key on the Node (this should be done after 'setup', as it will not ask for your key)`);
      process.exit();
  }
}
