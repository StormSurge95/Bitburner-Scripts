/** @param {NS} ns **/
export async function main(ns) {
	// initialize foundnodes and stack to empty arrays
	let foundnodes = [];
	let stack = [];
	// get current server's hostname as "origin" of scans
	let origin = ns.getHostname();
	// push origin onto stack
	stack.push(origin);

	// as long as stack has elements...
	while (stack.length > 0) {
		// remove and set node to an element from stack 
		let node = stack.pop();
		// if foundnodes does not include node...
		if (!foundnodes.includes(node)) {
			// push node into foundnodes
			foundnodes.push(node);
			// create array of nextNodes containing all connected servers
			let nextNodes = ns.scan(node);
			// for each server in nextNodes...
			for (let i = 0; i < nextNodes.length; i++) {
				// push element onto stack
				stack.push(nextNodes[i]);
			}
		}
	} // after while loop, stack should be empty and foundnodes should have exactly one entry for each server

	// for each element within foundnodes...
	for (let i = 0; i < foundnodes.length; i++) {
		// print element to terminal
		ns.tprint(foundnodes[i]);
	}
}
