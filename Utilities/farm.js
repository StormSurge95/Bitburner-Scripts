/** @param {NS} ns **/
export async function main(ns) {
	// Amount of RAM on your purchased servers
	// can be modified as you see fit; must be a power of 2; max amount is 2^20 or 1048576
	let amtRam = Math.pow(2, 20);
	// get currently owned servers
	let pServers = ns.getPurchasedServers();
	// initialize i to the length of the current list of servers
	let i = pServers.length;
	// get limit of purchased servers; should be 25 but that could always change for one reason or another
	let limit = ns.getPurchasedServerLimit();
	// while we have less than the server limit...
	while (i < limit) {
		// if we have enough money to buy a server...
		if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(amtRam)) {
			// buy a server
			let hostname = ns.purchaseServer("pServer" + i, amtRam);
			ns.tprint("Private server " + hostname + " purchased.");
			// copy all our batch hacking scripts to the newly purchased server
			await ns.scp("cull.js", "home", hostname);
			await ns.scp("hack-target.js", "home", hostname);
			await ns.scp("grow-target.js", "home", hostname);
			await ns.scp("weaken-target.js", "home", hostname);
			await ns.scp("start.js", "home", hostname);
			await ns.scp("grow-scheduler.js", "home", hostname);
			await ns.scp("hack-scheduler.js", "home", hostname);
			await ns.scp("daemon.js", "home", hostname);
			// start the batch hacking using the index of the server as the argument for start.js
			ns.exec("start.js", hostname, 1, i);
			// increment our index
			i++;
		}
		// sleep to prevent game freeze due to async shenanigans
		await ns.sleep(100);
	}
}
