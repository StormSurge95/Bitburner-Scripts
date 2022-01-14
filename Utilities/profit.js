/** @param {NS} ns **/
export async function main(ns) {
    // we use a function to sort the servers based on their profit per second
    let sortedServers = sortServers(ns);
    // print the sorted list 
    for (let i = 0; i < sortedServers.length; i++) {
        ns.tprintf("Server: %-20s | Profit:%15s", sortedServers[i].name, ns.nFormat(sortedServers[i].profit, "$0,0.00"));
    }
    ;
}
function sortServers(ns) {
    // initialize an array to hold the sorted servers.
    let serversProfit = [];
    // determine how many port busters are owned
    let tools = 0;
    ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'].forEach(t => {
        if (ns.fileExists(t)) tools++;
    })
    // we use a separate function here to actually find the entire list of servers because *cleanliness*
    let servers = findServers(ns);
    for (let server of servers) {
        // if we don't have the required number of port busters,
        // or if the max amount of money is not greater than 0,
        // or if our hacking level is too low,
        // or if this is a purchased server, we skip this server
        if (ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel()
            || ns.getServerNumPortsRequired(server) > tools
            || !(ns.getServerMaxMoney(server) > 0)
            || ns.getServer(server).purchasedByPlayer) {
            continue;
        }

        if (ns.fileExists("Formulas.exe", "home")) {
            let obj = ns.getServer(server);
            obj.hackDifficulty = obj.minDifficulty;
            let player = ns.getPlayer();

            let money = ns.formulas.hacking.hackChance(obj, player) * ns.formulas.hacking.hackPercent(obj, player) * obj.moneyMax;

            let time = ns.formulas.hacking.hackTime(obj, player);

            let profit = money / (time / 1000);

            serversProfit.push({
                name: obj.hostname,
                profit: profit,
            });
        } else {
            // money is the average amount we get from each 1-thread hack attempt
            let money = ns.hackAnalyzeChance(server) * ns.hackAnalyze(server) * ns.getServerMaxMoney(server);
            // time is the theoretical amount of time it takes to run a WGWH routine (we assume all servers being sorted are at min sec for this to work properly)
            let time = ns.getHackTime(server);// + ns.getGrowTime(server) + (ns.getWeakenTime(server) * 2);
            // profit is amount of money earned per second based on current factors
            let profit = money / (time / 1000);
            //let profit = ns.getServerMaxMoney(server);
            // add server to array
            serversProfit.push({
                name: server,
                profit: profit,
            });
        }
    }
    // sort servers based on profit
    serversProfit.sort((a, b) => b.profit - a.profit);
    // return sorted servers
    return serversProfit;
}
function findServers(ns) {
    // various params for finding servers
    let serversFound = new Set();
    let stack = [];
    let origin = ns.getHostname();
    stack.push(origin);
    // find servers
    while (stack.length > 0) {
        let server = stack.pop();
        if (!serversFound.has(server)) {
            serversFound.add(server);
            let neighbors = ns.scan(server);
            for (let serv of neighbors) {
                if (!serversFound.has(serv))
                    stack.push(serv);
            }
        }
    }
    let servers = Array.from(serversFound);

    return servers;
}
