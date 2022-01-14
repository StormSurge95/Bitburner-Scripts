/** @param {NS} ns **/
export async function main(ns) {
	let target = ns.args[0];
	await ns.weaken(target);
}
