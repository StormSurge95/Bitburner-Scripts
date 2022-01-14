/** @param {NS} ns **/
export async function main(ns) {
	let seenList = [];
	ScanServer(ns, "home", seenList, 1);
}

function ScanServer(ns, serverName, seenList, indent){
	// if seenList array includes serverName, then ignore and exit function call
	if(seenList.includes(serverName)) return;
	// push serverName into seenList
	seenList.push(serverName);
	// create serverList of children of serverName
	var serverList = ns.scan(serverName);
	// for each server within serverList...
	for(var i = 0; i < serverList.length; i++){
		// create newServer variable equal to current element of serverList
		var newServer = serverList[i];
		// if seenList contains newServer, ignore and continue with next iteration of loop
		if(seenList.includes(newServer)) continue;
		// print the information related to newServer
		PrintServerInfo(ns, newServer, indent)
		// recursively scan newServer
		ScanServer(ns, newServer, seenList, indent + 1);
	}
}

function PrintServerInfo(ns, serverName, indent){
	// initialize indentString to be an empty string
	var indentString = "";
	// if we have root access of serverName...
	if(ns.hasRootAccess(serverName)){
		// make indentString a wide line
		indentString = "▄▄▄▄".repeat(indent);
	}else{ // otherwise...
		// make indentString a thin line
		indentString = "----".repeat(indent);
	}
	// get the required hacking level of the server
	var serverHackingLevel = ns.getServerRequiredHackingLevel(serverName);
	// initialize canHackIndicator to empty string
	var canHackIndicator = "";
	// get the number of portBuster programs on "home"
	var busters = getBusters(ns);
	// if our hacking level is higher than serverHackingLevel and if we have enough portBusters to hack the server...
	if(ns.getHackingLevel() >= serverHackingLevel && ns.getServerNumPortsRequired(serverName) <= busters) {
		// if we have root access...
		if (ns.hasRootAccess(serverName)) {
			// show that server can be hacked
			canHackIndicator = "CAN HACK";
		} else { // otherwise, if we DON'T have root access...
			// show that server must be nuked first
			canHackIndicator = "NUKE REQ";
		}
	}
	// print server information (i.e. name, required hacking level, number of busters owned/requrired, and indication of ability to hack) to terminal
	ns.tprint (indentString + serverName + " (" + serverHackingLevel + ")" + " [" + busters + "/" + ns.getServerNumPortsRequired(serverName) + "]" + canHackIndicator);
}

function getBusters(ns) {
	// array of possible portBuster applications
	var portBusters = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
	// initialize count to zero
	var count = 0;
	// for each element within portBusters...
	for (var i = 0; i < portBusters.length; i++) {
		// if the application exists on home...
		if (ns.fileExists(portBusters[i], "home")) {
			// increment count
			count++;
		}
	}
	// return value of count
	return count;
}
