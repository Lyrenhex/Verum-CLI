#!/usr/bin/env node

const verum = require("verum").Client; // we only need the Client class
const readlineSync = require("readline-sync");
const readline = require("readline");
const fs = require("fs");

var username = null;
var password = null;
var action = null;

const PATH = process.env.HOME
console.log(`NOTICE: All file paths should be provided relative to ${process.env.HOME} -- you should export your PGP keys here if you haven't already. (You may also place the files in common, if you want them to persist across versions -- including betas!)`);

if ((process.argv.length >= 5 && process.argv.indexOf("sendmsg") === -1) || (process.argv.length === 7)) {
  username = process.argv[2];
  password = process.argv[3];
} else if (process.env.VERUM_ID !== undefined && process.env.VERUM_PASS !== undefined) {
  username = process.env.VERUM_ID;
  password = process.env.VERUM_PASS;
  process.argv.splice(2, 0, username);
  process.argv.splice(3, 0, password);
} else {
  fs.readFile(`${PATH}user.json`, 'utf-8', (err, data) => {
    if (err) {
      console.log(`Syntax: verum-cli <username> <password> <action> [options]

Alternatively, you may create a 'user.json' file in ${PATH} containing a 'username' and 'password' value, respectively, and these may then be omitted from the command syntax.
Eg: {'username': 'bob@verumnode.com', 'password': 'randomPass123'}`);
      process.exit();
    } else {
      var json = JSON.parse(data);
      username = json.username;
      password = json.password;
    }
  });
}

action = process.argv[4];

/* if (!username)
  username = readlineSync.question("Node ID (user@node): ");
if (!password)
  password = readlineSync.question("Password: ", {hideEchoBack: true}); */

var node = username.split("@")[1].split(":");
username = username.split("@")[0];
var client = new verum (node[0], (node[1] !== undefined) ? node[1] : null);

client.Events.on ('welcome', (sourceUrl) => {
  console.log("Connected to Node. Node's source is available at: ", sourceUrl);
  handleCmd (action);
});
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
      password = readlineSync.question("The password is incorrect. Password: ");
      break;
    case "User Missing Public Key":
      var pubkeyLoc = readlineSync.question("Please enter the location of your exported ascii armored public key file: ");
      fs.readFile(pubkeyLoc, 'utf-8', (err, data) => {
        if (err)
          console.log("Couldn't read the file: ", err);
        else {
          var pubKey = data;
          client.updatePubKey (username, password, pubKey);
        }
      });
      break;
  }
});
client.Events.on('public_key', (user, key) => {
  if (user == username) {
    console.log("Your public key is currently ", key);
    if (readlineSync.question("Would you like to change this key? [y/N] ").toLowerCase() === "y") {
      var pubkeyLoc = readlineSync.question("Please enter the location of your exported ascii armored public key file (should be done with full path): ");
      fs.readFile(`${PATH}${pubkeyLoc}`, 'utf-8', (err, data) => {
        if (err)
          console.log("Couldn't read the file: ", err);
        else {
          var pubKey = data;
          client.updatePubKey (username, password, pubKey);
        }
      });
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

function handleCmd (input) {
  switch (input) {
    case "getmsgs":
      var privkeyLoc = readlineSync.question("Please enter the location of your exported ascii armored private key file (should be done with full path): ");
      fs.readFile(`${PATH}${privkeyLoc}`, 'utf-8', (err, data) => {
        if (err)
          console.log("Couldn't read the file: ", err);
        else {
          var privKey = data;
          client.getEncMsgs (username, password, privKey);
        }
      });
      break;
    case "updatepubkey":
      client.getPubKey(username);
      break;
    case "sendmsg":
      if (process.argv.length >= 7){
        var recipient = process.argv[5];
        var message = process.argv[6];

        var recpNodeAddr = recipient.split("@")[1].split(":");
        recipient = recipient.split("@")[0];
        var recpNode = new verum(recpNodeAddr[0], (recpNodeAddr[1] !== undefined) ? recpNodeAddr[1] : null); // create a client connection to the sender's Node.

        recpNode.Events.on('welcome', (src) => {
          console.log("Recipient's Node's source is available at: ", src);
          var privkeyLoc = readlineSync.question("Please enter the location of your exported ascii armored private key file (should be done with full path) to sign the encrypted message: ");
          fs.readFile(privkeyLoc, 'utf-8', (err, data) => {
            if (err)
              console.log("Couldn't read the file: ", err);
            else {
              var privKey = data;
              recpNode.Events.on('message_sent', (etc) => {
                console.log("Message sent: ", etc);
                process.exit();
              });
              recpNode.sendEncMsg(recipient, message, process.argv[2], privKey);
            }
          });
        });
      } else {
        console.log("Syntax: verum-cli <username> <password> sendmsg <Recipient's Verum ID> \"<message>\" (quotes must be included, <> delimit parameters that you should replace).");
        process.exit();
      }
      break;
    case "register":
      var pubkeyLoc = readlineSync.question("Please enter the location of your exported ascii armored public key file (should be done with full path): ");
      fs.readFile(pubkeyLoc, (err, data) => {
        if (err)
          console.log("Couldn't read the file: ", err);
        else {
          var pubKey = data;
          client.register (username, password, pubKey);
        }
      });
      break;
    default:
      console.log(`Unknown action. Accepted actions:
        - 'sendmsg <recipient's Verum ID> <message>' :: sends a message to a recipient
        - 'getmsgs' :: retrieves your messages from the Node
        - 'updatepubkey' :: updates your pub key on the Node
        - 'register' :: registers your user account on the Node`);
      process.exit();
  }
}
