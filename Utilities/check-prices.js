/** @param {NS} ns **/
export async function main(ns) {
	let limit = ns.getPurchasedServerLimit();
	ns.tprintf("    Ram Size%3s --     Price for One%3s --     Price for All (x%d)", " ", " ", limit);
	ns.tprintf("--------------------------------------------------------------------");
	for (let i = 1; i <= 20; i++) {
		let ram = Math.pow(2, i);
		let cost1 = ns.nFormat(ns.getPurchasedServerCost(ram), '0,0');
		let costTotal = ns.nFormat((ns.getPurchasedServerCost(ram) * limit), '0,0');
		ram = ns.nFormat(ram, '0,0') + "GB";
		ns.tprintf("%15s -- %20s -- %25s", ram, cost1, costTotal);
	}
}
