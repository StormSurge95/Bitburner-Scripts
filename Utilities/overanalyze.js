/** @param {NS} ns **/
export async function main(ns) {
	// initialize server to empty string
	let server = "";
	// if argument was passed...
	if (ns.args.length > 0) {
		// set server to passed argument
		server = ns.args[0];
	} else { // otherwise...
		// set server to host
		server = ns.getHostname();
	}
	// get maxRam of server
	let maxRam = ns.getServerMaxRam(server);
	// get freeRam of server
	let freeRam = maxRam - ns.getServerUsedRam(server);
	// get money on server
	let money = ns.getServerMoneyAvailable(server);
	// get MAX money on server
	let maxMoney = ns.getServerMaxMoney(server);
	// get minimum security of server
	let minSec = ns.getServerMinSecurityLevel(server);
	// get current security of server
	let sec = ns.getServerSecurityLevel(server);
	// get required level to hack server
	let reqLvl = ns.getServerRequiredHackingLevel(server);
	// calculate 10/25/50% of current server money
	let money10 = money / 10;
	let money25 = money / 4;
	let money50 = money / 2;
	// format numbers into strings for printing
	let ramPerc = ns.nFormat((freeRam / maxRam) * 100, '0.00%');
	let moneyStr = ns.nFormat(money, '0,0');
	let maxMoneyStr = ns.nFormat(maxMoney, '0,0');
	let moneyPerc = ns.nFormat((money / maxMoney) * 100, '0.00%');
	ns.tprintf("%s:", server); // print server name
	ns.tprintf("\tReq Hack Lvl: %d", reqLvl); // print required level to hack server
	ns.tprintf("\tRAM         : %s / %s (%s)", freeRam, maxRam, ramPerc); // print server ram info
	ns.tprintf("\tmoney       : %s / %s (%s)", moneyStr, maxMoneyStr, moneyPerc); // print server money info
	ns.tprintf("\tsecurity    : %.2f min / %.2f current", minSec, sec); // print server security info
	ns.tprintf("\tgrowth      : %d", ns.getServerGrowth(server)); // print server growth parameter
	ns.tprintf("\thack time   : %s", ns.tFormat(ns.getHackTime(server, true))); // print server hack time
	ns.tprintf("\tgrow time   : %s", ns.tFormat(ns.getGrowTime(server, true))); // print server grow time
	ns.tprintf("\tweaken time : %s", ns.tFormat(ns.getWeakenTime(server, true))); // print server weaken time
	ns.tprintf("\tgrow x2     : %.2f threads", ns.growthAnalyze(server, 2)); // print num threads to double money on server
	ns.tprintf("\tgrow x3     : %.2f threads", ns.growthAnalyze(server, 3)); // print num threads to triple money on server
	ns.tprintf("\tgrow x4     : %.2f threads", ns.growthAnalyze(server, 4)); // print num threads to quadruple money on server
	ns.tprintf("\thack 10%%    : %.2f threads", ns.hackAnalyzeThreads(server, money10)); // print num threads to hack 10%
	ns.tprintf("\thack 25%%    : %.2f threads", ns.hackAnalyzeThreads(server, money25)); // print num threads to hack 25%
	ns.tprintf("\thack 50%%    : %.2f threads", ns.hackAnalyzeThreads(server, money50)); // print num threads to hack 50%
	ns.tprintf("\thackChance  : %.2f%%", ns.hackAnalyzeChance(server) * 100); // print hack chance
}
