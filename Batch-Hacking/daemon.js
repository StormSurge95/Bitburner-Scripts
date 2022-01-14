/** @param {NS} ns **/
export async function main(ns) {
	let hostName = ns.getHostname();
	ns.disableLog("ALL");
	let percentageToSteal = 50;
	//------------------------------HERE BE ARGS.. ARRRGS. And other constants----------
	// first thing's first, args
	let target = ns.args[0];

	//these are the most important things here.
	let maxMoney = ns.args[1];
	let minSecurity = ns.args[2];
	//these are the variables we're using to record how long it takes to execute at minimum security
	let timeForGrow;
	let timeForWeaken;
	let timeForHack;

	//constant, potency of weaken threads
	let threadPotencyForWeaken = 0.05;
	// two weaken threads per 10 hack threads
	//let threadHardeningForHack = 0.002;
	let threadHardeningForHack = ns.hackAnalyzeSecurity(1);
	// four weaken threads per 5 grow threads
	//let threadHardeningForGrow = 0.004;
	let threadHardeningForGrow = ns.growthAnalyzeSecurity(1);

	// RAM required to run hack-target.js for 1 thread(s)
	let costForHack = ns.getScriptRam("hack-target.js", hostName);

	// RAM required to run weaken-target.js for 1 thread(s)
	let costForWeaken = ns.getScriptRam("weaken-target.js", hostName);

	// RAM required to run grow-target.js for 1 thread(s)
	let costForGrow = ns.getScriptRam("grow-target.js", hostName);

	// RAM required to run schedulers for 1 thread each
	let costForHackScheduler = ns.getScriptRam("hack-scheduler.js", hostName);
	let costForGrowScheduler = ns.getScriptRam("grow-scheduler.js", hostName);
	let costForSchedulers = costForHackScheduler + costForGrowScheduler;

	// activationDelay is what I'm using to say "scripts take a little time to spool up so don't start counting yet"
	let activationDelay = 1000;

	// killDelay is what I'm using to say "scripts take a little time to die down", similarly
	let delayForKill = 1000;

	// step delay is meant only for the delay between steps of scheduling scripts
	let stepDelay = 500;

	let schedulerDelay = stepDelay * 3;
	// window delay is meant to be the delay between the two scheduler.js scripts
	let windowDelay = stepDelay * 4;

	//--------------- PREEMPTIVE CULL ---------------------------------------------------
	//if previous daemons were running, this kills all their child scripts
	let scriptsToCull = ['weaken-target.js', 'grow-target.js', 'hack-target.js', 'hack-scheduler.js', 'grow-scheduler.js'];
	for (let i = 0; i < scriptsToCull.length; i++) {
		ns.scriptKill(scriptsToCull[i], hostName);
	}

	//according to chapt3r, it shouldn't take terribly long for all kills to finish terminating existing scripts - we sleep here just in case
	ns.print("Sleeping for " + ns.tFormat(delayForKill, true));
	await ns.sleep(delayForKill);

	//--------------- AND HERE'S THE SCRIPT ITSELF ---------------------------------------
	//this is just a constant loop, I use a var just in case I change my mind.
	let doLoop = true;

	while (doLoop) {
		let changedPercentage = ns.readPort(1);
		if (changedPercentage !== 'NULL PORT DATA') {
			percentageToSteal = changedPercentage;
		}
		let currentSecurity = ns.getServerSecurityLevel(target);
		let currentMoney = ns.getServerMoneyAvailable(target);

		// We should be a minsec, but if we aren't, fix that
		if (currentSecurity > minSecurity) {
			// execution times based on current security, how long to sleep, since we're using all available RAM to weaken target
			timeForWeaken = ns.getWeakenTime(target);
			let deltaSec = currentSecurity - minSecurity;
			let threadsNeeded = Math.ceil((deltaSec / threadPotencyForWeaken));
			let ramAvailable = (ns.getServerMaxRam(hostName) - ns.getServerUsedRam(hostName));
			let threadsAvailable = Math.floor(ramAvailable / costForWeaken);
			let threadsUsed = Math.min(threadsAvailable, threadsNeeded);
			//this causes the script to pass through this cycle if it can't weaken, causing it to idle until some RAM is free.
			if (threadsUsed > 0) {
				ns.print("Attempting to weaken target " + target + " using " + threadsUsed + " threads...");
				ns.run('weaken-target.js', threadsUsed, target);
				let delay = (timeForWeaken + activationDelay + delayForKill);
				ns.print("Sleeping for " + ns.tFormat(delay, true));
				await ns.sleep(delay);
			}
		}
		// if we aren't at max money, fix that
		else if (currentMoney < maxMoney) {
			currentMoney = ns.getServerMoneyAvailable(target);
			timeForGrow = ns.getGrowTime(target);
			timeForWeaken = ns.getWeakenTime(target);
			let numCores = ns.getServer(hostName).cpuCores;
			let singleCycleCost = (costForWeaken * 4) + (costForGrow * 5);
			let coForGrowth = maxMoney / currentMoney;
			let threadsNeededToGrow = Math.ceil(ns.growthAnalyze(target, coForGrowth, numCores));
			let threadsNeededToWeaken = Math.ceil((threadsNeededToGrow / 5) * 4);
			let freeRam = ns.getServerMaxRam(hostName) - ns.getServerUsedRam(hostName) - costForGrowScheduler;
			let cyclesAvailable = Math.floor(freeRam / singleCycleCost);
			let threadsAvailableForGrow = Math.floor(cyclesAvailable * 5);
			let threadsAvailableForWeaken = Math.floor(cyclesAvailable * 4);
			let threadsForGrow = Math.min(threadsAvailableForGrow, threadsNeededToGrow);
			let threadsForWeaken = Math.min(threadsAvailableForWeaken, threadsNeededToWeaken);

			ns.print("Attempting to grow " + target + " to max money...");
			ns.run("grow-scheduler.js", 1, target, threadsForWeaken, threadsForGrow, timeForWeaken, timeForGrow, stepDelay, 0);
			let delay = timeForWeaken + stepDelay;
			ns.print("Sleeping for " + ns.tFormat(delay, true));
			await ns.sleep(delay);
		}
		// if we're at min sec and we've done initial growth, calculate and perform HWGW cycles.
		else {
			// get times for grow/hack/weaken
			timeForHack = ns.getHackTime(target);
			timeForWeaken = ns.getWeakenTime(target);
			timeForGrow = ns.getGrowTime(target);
			// calculate amount to steal and number of hack threads necessary
			let amountToSteal = maxMoney * (percentageToSteal / 100);
			let threadsForHack = Math.ceil(ns.hackAnalyzeThreads(target, amountToSteal));
			let totalHackCost = threadsForHack * costForHack;

			// calculate amount needed to grow to replace what was stolen and how many grow threads necessary
			let percForCo = percentageToSteal / 100;
			let coForGrowth = (1 / (1 - percForCo));
			let threadsForGrow = Math.ceil((ns.growthAnalyze(target, coForGrowth, ns.getServer(hostName).cpuCores) * 1.05));
			let totalGrowCost = threadsForGrow * costForGrow;

			// calculate each amount of weakening needed to get back to minsec after our hack/grow threads
			let secIncreaseFromGrow = threadHardeningForGrow * threadsForGrow;
			let secIncreaseFromHack = threadHardeningForHack * threadsForHack;
			let threadsToWeakenFromHack = Math.ceil(secIncreaseFromHack / threadPotencyForWeaken);
			let threadsToWeakenFromGrow = Math.ceil(secIncreaseFromGrow / threadPotencyForWeaken);
			let totalWeakenCost = (threadsToWeakenFromGrow + threadsToWeakenFromHack) * costForWeaken;

			// calculate how many threads we can run at once
			let ramAvailable = (ns.getServerMaxRam(hostName) - ns.getServerUsedRam(hostName));
			let totalCycleCost = totalHackCost + totalGrowCost + totalWeakenCost + costForSchedulers;
			let cyclesSupportedByRam = Math.floor(ramAvailable / totalCycleCost);

			// calculate whole number total possible of concurrent cycles
			let numConcurrentCycles = Math.floor(timeForWeaken / windowDelay);



			// current implementation forces only one cycle to run because that seemed most efficient to me
			// also allows for anywhere from 1% to 99%, which seems to allow for some floating point error at random percentages in between
			let skipHackDueToCycleImperfection = false;
			if ((numConcurrentCycles < cyclesSupportedByRam) && (percentageToSteal < 99)) { //max of 99%
				ns.print('Based on ' + totalCycleCost + " cycle cost, percentage to steal of " + percentageToSteal + '% is too low. Adjusting for next run-loop.');
				percentageToSteal += 1;
				skipHackDueToCycleImperfection = true;
			} else if ((cyclesSupportedByRam === 0) && (percentageToSteal > 1)) { //minimum of 1%
				ns.print('Current percentage to steal of ' + percentageToSteal + '% is too high for even 1 thread. Adjusting for next run-loop.');
				percentageToSteal -= 1;
				skipHackDueToCycleImperfection = true;
			}
			// basically, as long as we're using all of our available ram for just one cycle...
			if (!skipHackDueToCycleImperfection) {
				// hack away!
				ns.print("Attempting to hack target " + target + " for " + percentageToSteal + "% " + cyclesSupportedByRam + " times...");
				// array of grow args
				let argsForGrow = [target, threadsToWeakenFromGrow, threadsForGrow, timeForWeaken, timeForGrow];
				// array of hack args
				let argsForHack = [target, threadsToWeakenFromHack, threadsForHack, timeForWeaken, timeForHack]
				// run hack-/grow-scheduler(s) using a loop to ensure that all cycles are accounted for
				for (let i = 0; i < cyclesSupportedByRam; i++) {
					ns.print("Starting loop cycle " + i + "...");
					ns.run("hack-scheduler.js", 1, argsForHack[0], argsForHack[1], argsForHack[2], argsForHack[3], argsForHack[4], stepDelay, i);
					await ns.sleep(schedulerDelay);
					ns.run("grow-scheduler.js", 1, argsForGrow[0], argsForGrow[1], argsForGrow[2], argsForGrow[3], argsForGrow[4], stepDelay, i);
					await ns.sleep(windowDelay);
				}
				// sleep until both schedulers and all their children are gone
				let delay = (timeForWeaken + activationDelay + delayForKill + windowDelay);
				ns.print("Sleeping for " + ns.tFormat(delay, true));
				await ns.sleep(delay);
			}
		}
		// sleep jsut to prevent freezing
		await ns.sleep(100);
	}
}
