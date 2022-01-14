/** @param {NS} ns **/
export async function main(ns) {
	//1% of current funds, per cycle.
	let allowancePercentage = 0.01;
	// infinite loop to always be attempting to buy/upgrade hacknet nodes
	while (true) {
		// get current amount of money
		let currentCash = ns.getServerMoneyAvailable('home');
		// set currentCash to the amount of money we have available to spend
		// i.e. 1% of our total available
		currentCash *= allowancePercentage;
		// if the cost of a new node is less or equal to currentCash...
		if (ns.hacknet.getPurchaseNodeCost() <= (currentCash)) {
			// buy a node
			ns.print("hacknet-node-" + ns.hacknet.purchaseNode() + " purchased");
		} else { // otherwise...
			// for each node we currently possess...
			for (let i = 0; i < ns.hacknet.numNodes(); i++) {
				// get the cost to upgrade the node level by 1
				let upgradeCost = ns.hacknet.getLevelUpgradeCost(i, 1);
				// if the cost is less or equal to currentCash...
				if (upgradeCost <= currentCash) {
					// upgrade the level and break from the for loop
					ns.hacknet.upgradeLevel(i, 1);
					ns.print("hacknet-node-" + i + " level upgraded to " + ns.hacknet.getNodeStats(i).level);
					break;
				} else { // otherwise...
					// get the cost to upgrade the ram level by 1
					let ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
					// if the cost is less or equal to currentCash...
					if (ramCost <= currentCash) {
						// upgrade the ram and break from the for loop
						ns.hacknet.upgradeRam(i, 1);
						ns.print("hacknet-node-" + i + " ram upgraded to " + ns.hacknet.getNodeStats(i).ram);
						break;
					} else { // otherwise...
						// get the cost to upgrade the core level by 1
						let coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
						// if the cost is less or equal to currentCash...
						if (coreCost <= currentCash) {
							// upgrade the core and break from the for loop
							ns.hacknet.upgradeCore(i, 1);
							ns.print("hacknet-node-" + i + " cores upgraded to " + ns.hacknet.getNodeStats(i).cores);
							break;
						}
					}
				}
			}
		}
		// sleep for async shenanigans
		await ns.sleep(100);
	}
}
