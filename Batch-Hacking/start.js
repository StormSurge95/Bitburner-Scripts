/** @param {NS} ns **/
export async function main(ns) {
	let index = 0;
	if (ns.args.length > 0) {
		index = ns.args[0];
	}
	ns.disableLog("ALL");
	let host = ns.getHostname();
	// total number of hackable servers
	let numServers = await findNumServers(ns);
	ns.print("Total number of hackable servers: " + numServers);
	// initialize array for our servers
	let servers = [];

	let doLoop = true;

	let portBusters = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'];

	let ownedBusters = 0;

	// don't init lastTarget so we can force a daemon to be run when script is first ran
	let lastTarget;

	while (doLoop) {
		servers = await sortServers(ns);
		ns.print("Currently hackable servers: " + servers.length);
		ownedBusters = 0;
		//get the port busters you've got so it's one less thing the nuke script has to figure out.
		//this is done inside the while loop for adaptability, but outside the server loop for speed.
		for (let i = 0; i < portBusters.length; i++) {
			//always checking the home machine, presumes your port busters always live at home.
			if (ns.fileExists(portBusters[i], 'home')) {
				ownedBusters++;
			}
		}
		ns.print('Portbusters the program thinks you own: ' + ownedBusters);
		//loop over all the servers and find potential victims.
		let server = servers[index];
		//we need to know hacking level and ports needed to nuke to determine viable targets.
		let numPorts = ns.getServerNumPortsRequired(server.name);
		//now grab the other data, we're passing this to the knock script so it can pass it further to the daemon.
		let newTarget = ns.getServer(server.name);
		//we won't nuke if we have access
		if (!newTarget.hasAdminRights) {
			// Only use necessary portbusters
			// this portion should only be reached with
			// servers that we have enough busters to open
			switch (numPorts) {
				case 5:
					ns.sqlinject(newTarget.hostname);
				case 4:
					ns.httpworm(newTarget.hostname);
				case 3:
					ns.relaysmtp(newTarget.hostname);
				case 2:
					ns.ftpcrack(newTarget.hostname);
				case 1:
					ns.brutessh(newTarget.hostname);
				default:
					ns.nuke(newTarget.hostname);
					break;
			}
		}
		// if there was no "lastTarget",  or if the current target is not the same as the previous one, or daemon.js
		// is simply not running for some reason...
		if (lastTarget == null || newTarget.hostname != lastTarget.hostname || !ns.scriptRunning("daemon.js", host)) {
			// set up the list of newArgs...
			let newArgs = [newTarget.hostname, newTarget.moneyMax, newTarget.minDifficulty];
			// if there WAS a "lastTarget", kill the daemon that was/is running for it.
			if (lastTarget != null) {
				let lastArgs = [lastTarget.hostname, lastTarget.moneyMax, lastTarget.minDifficulty];
				if (ns.isRunning('daemon.js', host, lastArgs[0], lastArgs[1], lastArgs[2])) {
					ns.kill('daemon.js', host, lastArgs[0], lastArgs[1], lastArgs[2]);
				}
			}
			// if there was no "lastTarget" or if the lastTarget is different from the newTarget,
			// print the discovery of the new target
			if (lastTarget == null || newTarget.hostname != lastTarget.hostname) {
				ns.tprint("New target " + newArgs[0] + " discovered; creating new daemon...");
			}
			// run a new daemon
			ns.run('daemon.js', 1, newArgs[0], newArgs[1], newArgs[2]);
			// "newTarget" is now our "lastTarget"
			lastTarget = newTarget;
		} else {
			// print to logs just for clarity
			ns.print("No new target found; proceeding to sleep.");
		}
		// if there are servers left in the list,
		// or if our level will stil have an effect on the sort,
		// keep looping (max level here can likely be modified, just be careful)
		doLoop = ((servers.length < numServers) || (ns.getHackingLevel() < 2500));
		// sleep for ten seconds; can be changed, just be careful
		let delay = 10000;
		ns.print("Sleeping for " + ns.tFormat(delay));
		await ns.sleep(delay);
	}
}
/** @param {NS} ns **/
/** finds the total number of servers that can be hacked for any
 ** amount of money; as longas the server is not owned by the player
 ** or by a faction, it should be valid and should be counted. **/
async function findNumServers(ns) {
	let validServers = [];
	let servers = findServers(ns);
	for (let server of servers) {
		// if the max amount of money is not greater than 0,
		// or if the server is a purchased server,
		// or if the server is 'home' (included just in case)
		// then we skip that server
		if (!(ns.getServerMaxMoney(server) > 0)
			|| ns.getServer(server).purchasedByPlayer
			|| ns.getServer(server).hostname == "home") {
			continue;
		}
		validServers.push(server);
	}
	return validServers.length;
}
/** @param {NS} ns **/
/** finds and sorts all hackable servers by their profit per second per thread **/
function sortServers(ns) {
    // initialize an array to hold the sorted servers.
    let serversProfit = [];
    // determine how many port busters are owned
    let tools = 0;
    ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'].forEach(t => {
        if (ns.fileExists(t, "home")) tools++;
    })
    // we use a separate function here to actually find the entire list of servers because *cleanliness*
    let servers = findServers(ns);
    for (let server of servers) {
        // if we don't have the required number of port busters,
        // or if the max amount of money is not greater than 0,
        // or if our hacking level is too low,
        // or if this is a purchased server, we skip this server
        if (ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel()
            || ns.getServerNumPortsRequired(server) > tools
            || !(ns.getServerMaxMoney(server) > 0)
            || ns.getServer(server).purchasedByPlayer) {
            continue;
        }
		// if we have access for Formulas.exe, it makes our calculations far more accurate.
        if (ns.fileExists("Formulas.exe", "home")) {
			// get Server object
            let obj = ns.getServer(server);
			// modify object to represent server at minsec
            obj.hackDifficulty = obj.minDifficulty;
			// get Player object
			let player = ns.getPlayer();
			// money is equal to the theoretical amount of money per successful hack thread
            let money = ns.formulas.hacking.hackChance(obj, player) * ns.formulas.hacking.hackPercent(obj, player) * obj.moneyMax;
			// time is the theoretical amound of time it takes to run a full GWHW routine; can likely be modified, just be careful
            let time = ns.formulas.hacking.weakenTime(obj, player) + 6000;
			// profit is amount of money earned per second per thread based on current factors
            let profit = money / (time / 1000);

			// add server to array
            serversProfit.push({
                name: obj.hostname,
                profit: profit,
            });
        } else {
            // money is the average amount we get from each 1-thread hack attempt
            let money = ns.hackAnalyzeChance(server) * ns.hackAnalyze(server) * ns.getServerMaxMoney(server);
            // time is the theoretical amount of time it takes to run a GWHW routine (we assume all servers being sorted are at min sec for this to work properly)
            let time = ns.getWeakenTime(server) + 6000;
            // profit is amount of money earned per second based on current factors
            let profit = money / (time / 1000);
			
            // add server to array
            serversProfit.push({
                name: server,
                profit: profit,
            });
        }
    }
    // sort servers based on profit
    serversProfit.sort((a, b) => b.profit - a.profit);
    // return sorted servers
    return serversProfit;
}
/** @param {NS} ns **/
/** literally just finds all of the servers in the game and returns them within an array **/
function findServers(ns) {
	// various params for finding servers
	let serversFound = new Set();
	let stack = [];
	let origin = ns.getHostname();
	stack.push(origin);
	// find servers
	while (stack.length > 0) {
		let server = stack.pop();
		if (!serversFound.has(server)) {
			serversFound.add(server);
			let neighbors = ns.scan(server);
			for (let serv of neighbors) {
				if (!serversFound.has(serv))
					stack.push(serv);
			}
		}
	}
	let servers = Array.from(serversFound);

	return servers;
}
