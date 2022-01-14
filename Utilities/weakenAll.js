/** @param {NS} ns **/
export async function main(ns) {
    // disable logs for a cleaner log window
    ns.disableLog("ALL");
    // get the list of nuked servers
    let servers = nukeServers(ns);
    // get hostname of current server
    let host = ns.getHostname();
    // for each element in servers...
    for (let i = 0; i < servers.length; i++) {
        // get name of server
        let server = servers[i].name;
        // get current security of server
        let currSec = ns.getServerSecurityLevel(server);
        // get minimum security of server
        let minSec = ns.getServerMinSecurityLevel(server);
        // while currSec is greater than minSec...
        while (currSec > minSec) {
            // calculate the number of threads needed to weaken
            let threadsToWeaken = Math.ceil((currSec - minSec) / 0.05);
            // get the cost to run a single weaken thread
            let costForWeaken = ns.getScriptRam("weaken-target.js", "home");
            // calculate amount of available ram
            let freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
            // get max number of weaken threads able to be ran
            let maxThreads = Math.floor(freeRam / costForWeaken);
            // use amount available or amount necessary; whichever is smaller
            let threadsUsedToWeaken = Math.min(threadsToWeaken, maxThreads);
            // get amount of time for a weaken() call
            let timeToWeaken = ns.getWeakenTime(server);
            // run weaken-target.js using calculated thread count
            ns.run("weaken-target.js", threadsUsedToWeaken, server);
            // sleep until weaken() is complete
            ns.print("Sleeping for " + ns.tFormat(timeToWeaken, true));
            await ns.sleep(timeToWeaken + 2000);
            // update currSec
            currSec = ns.getServerSecurityLevel(server);
        }
    }
}

function nukeServers(ns) {
    let nukedServers = [];
    // determine how many port busters are owned
    let tools = 0;
    ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'].forEach(t => {
        if (ns.fileExists(t, "home")) tools++;
    });

    // get list of servers
    let servers = findServers(ns);
    // for each server in servers...
    for (let server of servers) {
        // get number of open ports required to nuke
        let numPorts = ns.getServerNumPortsRequired(server);
        
        // if we don't already have root access but we do have enough portBusters...
        if (!ns.hasRootAccess(server) && numPorts < tools) {
            // open the necessary ports and then nuke
            switch (numPorts) {
                case 5:
                    ns.sqlinject(server);
                case 4:
                    ns.httpworm(server);
                case 3:
                    ns.relaysmtp(server);
                case 2:
                    ns.ftpcrack(server);
                case 1:
                    ns.brutessh(server);
                default:
                    ns.nuke(server);
                    break;
            }
            nukedServers.push(server);
        }
    }
    // return the nuked servers.
    return nukedServers;
}

function findServers(ns) {
    // initialize various necessary variables
    let serversFound = [];
    let stack = [];
    let origin = ns.getHostname();
    // push origin onto stack
    stack.push(origin);

    // while stack has elements...
    while (stack.length > 0) {
        // pop element off of stack
        let server = stack.pop();
        // if serversFound does not have server as an element...
        if (!serversFound.includes(server)) {
            // add server to serversFound
            serversFound.push(server);
            // get an array of servers connected to server
            let neighbors = ns.scan(server);
            // for each neighbor connected to server...
            for (let serv of neighbors) {
                // if serversFound does not already contain the element...
                if (!serversFound.has(serv)) {
                    // push it onto the stack
                    stack.push(serv);
                }
            }
        }
    }
    // return the list of servers
    return servers;
}
