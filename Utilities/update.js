/** @param {NS} ns **/
export async function main(ns) {
	// get array of purchased servers
	let pServers = ns.getPurchasedServers(true);
	// for each element of pServers...
	for (let i = 0; i < pServers.length; i++) {
		// get hostname of element
		let hostname = "pServer" + i;
		// kill all scripts running on server
		ns.killall(hostname);
		// copy/overwrite all of our batch-hacking scripts to the server
		await ns.scp("hack-target.js", "home", hostname);
		await ns.scp("grow-target.js", "home", hostname);
		await ns.scp("weaken-target.js", "home", hostname);
		await ns.scp("start.js", "home", hostname);
		await ns.scp("grow-scheduler.js", "home", hostname);
		await ns.scp("hack-scheduler.js", "home", hostname);
		await ns.scp("daemon.js", "home", hostname);
		// run start.js with element index as argument
		ns.exec("start.js", hostname, 1, i);
	}
	// notification of completion
	ns.tprint("Update complete.");
}
