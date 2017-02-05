#!/usr/bin/env node

const verum = require("verum").Client; // we only need the Client class
const readlineSync = require("readline-sync");
const fs = require("fs");

var username = null;
var password = null;

if (process.argv.length > 2) {
  username = process.argv[2];
  try {
    password = process.argv[3];
  } catch (e) {
    // don't do anything.
  }
}

if (!username)
  username = readlineSync.question("Node ID (user@node): ");
if (!password)
  password = readlineSync.question("Password: ");

var node = username.split("@")[1].split(":");
username = username.split("@")[0];
var client = new verum (node[0], (node[1] !== undefined) ? node[1] : null);

client.Events.on ('welcome', (sourceUrl) => {
  console.log("Connected to Node. Node's source is available at: ", sourceUrl);
  client.getPubKey(username);
});
client.Events.on ('error', (err, ext) => {
  switch (err) {
    case "User Doesn't Exist":
      if (client.lastPubKeyRequestee === username) {
        // user doesn't exist on the node. Do they want to register?
        if (readlineSync.question("You don't seem to exist on the Node. Would you like to register? [y/N] ").toLowerCase() === "y") {
          var pubkeyLoc = readlineSync.question("Please enter the location of your exported ascii armored public key file (should be done with full path): ");
          fs.readFile(pubkeyLoc, (err, data) => {
            if (err)
              console.log("Couldn't read the file: ", err);
            else {
              var pubKey = data;
              client.register (username, password, pubKey);
            }
          });
        }
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
  }
});
client.Events.on('public_key', (user, key) => {
  if (user == username) {
    console.log("Your public key is currently ", key);
    if (readlineSync.question("Would you like to change this key? [y/N] ").toLowerCase() === "y") {
      var pubkeyLoc = readlineSync.question("Please enter the location of your exported ascii armored public key file (should be done with full path): ");
      fs.readFile(pubkeyLoc, 'utf-8', (err, data) => {
        if (err)
          console.log("Couldn't read the file: ", err);
        else {
          var pubKey = data;
          client.updatePubKey (username, password, pubKey);
        }
      });
    }
  }
});
