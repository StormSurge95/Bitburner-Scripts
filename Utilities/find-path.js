// recursively finds a path to target starting at serverName
const findPath = (ns, target, serverName, serverList, ignore, isFound) => {
	ignore.push(serverName);
	let scanResults = ns.scan(serverName);
	for (let server of scanResults) {
		if (ignore.includes(server)) {
			continue;
		}
		if (server === target) {
			serverList.push(server);
			return [serverList, true];
		}
		serverList.push(server);
		[serverList, isFound] = findPath(ns, target, server, serverList, ignore, isFound);
		if (isFound) {
			return [serverList, isFound];
		}
		serverList.pop();
	}
	return [serverList, false];
}


/** @param {NS} ns **/
export async function main(ns) {
	let startServer = ns.getHostname();
	let target = ns.args[0];
	// target must be provided as an argument
	if (target === undefined) {
		ns.alert('Please provide target server');
		return;
	}
	// search for the path to the target
	let [results, isFound] = findPath(ns, target, startServer, [], [], false);
	// if a path was not found...
	if (!isFound) {
		// alert
		ns.alert('Server not found!');
	} else { // otherwise...
		// print path to target
		ns.tprint(results.join(' --> '));
	}
}
