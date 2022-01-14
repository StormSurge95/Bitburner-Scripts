/** @param {NS} ns **/
export async function main(ns) {
	let target = ns.args[0];
	let threadsNeededToWeakenFromGrow = ns.args[1];
	let threadsNeededToGrow = ns.args[2];
	let timeForWeaken = ns.args[3];
	let timeForGrow = ns.args[4];
	let stepDelay = ns.args[5];
	let i = ns.args[6];

	// the amount of time to sleep before starting the grow threads
	// designed by default to have grow finish approximately 3s before weaken 
	let timeForGrowWeakenSleep = (timeForWeaken - timeForGrow) - stepDelay;

	// here we use "grow" as a discrimination variable so the hack-scheduler
	// can use its own weaken threads
	ns.run("weaken-target.js", threadsNeededToWeakenFromGrow, target, "grow", i);
	await ns.sleep(timeForGrowWeakenSleep);
	ns.run("grow-target.js", threadsNeededToGrow, target, i);
}
