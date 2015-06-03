var finder = require('finder');
var actions = require('actions');

var rules = require('rules');

function getSpawn(creep) {
    return finder.findSpawn(creep);
}



function handleUpgrader(creep) {
    var target = creep.room.controller;
    if (!(actions.handleEnergyState(creep, creep.energyCapacity, function() {
            creep.moveDetermine(target);
            creep.upgradeController(target);
    }))) {
       actions.rallyToFlag(creep, Game.flags.FlagH);
    }
}


function handleBuilder(creep) {
    var target = finder.findRepairOrConstructionTarget(creep);

    if (!(target && actions.handleEnergyState(creep, rules.buildEnergy, function() {
            creep.moveDetermine(target);
            if (creep.build(target) == ERR_INVALID_TARGET)
                creep.repair(target);
    }, true))) {
        actions.harvestClosest(creep);
    }
}



function handleHarvest(creep) {
    actions.harvestClosest(creep);
}

function handleMaintainer(creep) {
    var energy = finder.findEnergyNearby(creep);
    if (!energy || !actions.pickupClosest(creep, energy))  {
    var target = finder.findRepairOrConstructionTarget(creep);
    if (!(target && actions.handleEnergyState(creep, rules.buildEnergy, function() {
            creep.moveDetermine(target);
            if (creep.build(target) == ERR_INVALID_TARGET)
                creep.repair(target);
    }, true))) {
     if (!actions.harvestClosest(creep, true))
      creep.moveTo(Game.flags.FlagX);
    }
    }
}


function handleTank(creep) {
    var target = finder.pickTarget(creep);
        if(target) {
            actions.performMeleeAttack(creep,target);
		} else {
		    actions.rallyToMainTank(creep);
		}
}

function handleTankBase(creep) {
    var target = finder.pickBaseTarget(creep);
    if (target) {
        actions.performMeleeAttack(creep,target);
    } else {
        actions.rallyToSpawn(creep);
    }
}



function handleRange(creep) {
    var target = finder.pickTarget(creep);
		    if (target) {
		        actions.performRangeAttack(creep,target);
		    } else {
               actions.rallyToFlag(creep);
		    }
}


function handleRangeBase(creep) {
    var target = finder.pickBaseTarget(creep);
    if (target) {
        actions.performRangeAttack(creep,target);
    } else {
        actions.rallyToSpawn(creep);
    }
}

function handleRangeSource(creep) {
    var target = finder.pickTarget(creep);
    if (target) {
        actions.performRangeAttack(creep,target);
    } else {
        target = finder.pickSourceTarget(creep);
        if (target) {
            actions.performRangeAttack(creep,target);
        } else {
            actions.rallyToFlag(creep);
        }
    }
}


function handleHealer(creep) {
    var healDone = actions.healIfAvailable(creep, finder.findClosestToHeal(creep,function(object) {
            return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK);
    }));
    if (!healDone)
        healDone = actions.healIfAvailable(creep, finder.findClosestToHeal(creep));
    if (!healDone)
        actions.rallyToMainTank(creep);
}

function handleHealerMain(creep) {
    if (!actions.healIfAvailable(creep, finder.findClosestToHeal(creep,function(object) {
            return object.getActiveBodyparts(HEAL) > 0;
        })))
        handleHealer(creep);
}



function handleHealerBase(creep) {
    var healDone = actions.healIfAvailable(creep, finder.findClosestToHeal(creep,function(object) {
            return object.memory.role == 'rangerbase' || object.memory.role == 'tankbase';
        }));
    if (!healDone) {
        handleRangeBase(creep);
    }
}

function handleHealerSource(creep) {
    var healDone = actions.healIfAvailable(creep, finder.findClosestToHeal(creep,function(object) {
            return object.memory.role == 'rangersource';
        }));
    if (!healDone) {
        var target = finder.findRole(creep, 'rangersource');
        if (target)
            creep.moveTo(target);
    }
}

function handleExplorer(creep) {
 actions.followFlags(creep,[Game.flags.FlagE1,Game.flags.FlagE2]);
}

function handleAttackerDestination(creep) {
 if (Game.flags.FlagE && creep.room != Game.flags.FlagE.room) {
   actions.followFlags(creep, rules.flagRoute);
   return true;
 }
 return false;
}

function handleAttackerWithHeal(creep){
    if (!handleAttackerDestination(creep)) {
    var healDone = actions.healIfAvailable(creep, finder.findClosestToHeal(creep,function(object) {
            return object.memory.role == 'attacker';
        }));
    if (!healDone) {
        handleTank(creep);
    }
 }
}

function handleAttacker(creep){
if (!handleAttackerDestination(creep)) {
    handleTank(creep);
 }
}



function handleLooter(creep){

}


module.exports = {
 roles:[
 { role: 'harvester', handler: handleMaintainer, prebuild:10,  spawnAttrributes: [CARRY, WORK,  MOVE] },
 { role: 'builder', handler: handleBuilder,  spawnAttrributes: [CARRY, WORK,  WORK, WORK, MOVE, MOVE, MOVE] },
 { role: 'ranger', handler: handleRange,  spawnAttrributes: [TOUGH, RANGED_ATTACK, MOVE, MOVE] },
 { role: 'healer', handler: handleHealer, spawnAttrributes: [TOUGH, HEAL, MOVE, MOVE]  },
 { role: 'healermain', handler: handleHealerMain, spawnAttrributes: [TOUGH, HEAL, MOVE, MOVE]  },
 { role: 'tank', handler: handleTank,  spawnAttrributes: [TOUGH, ATTACK, MOVE, MOVE]  },
 { role: 'healersource', handler: handleHealerSource, spawnAttrributes: [HEAL, MOVE]  },
 { role: 'rangersource', handler: handleRangeSource,  spawnAttrributes: [TOUGH, TOUGH, TOUGH, RANGED_ATTACK, MOVE] },
 { role: 'rangerbase', handler: handleRangeBase,  spawnAttrributes: [TOUGH, TOUGH, TOUGH, RANGED_ATTACK, MOVE] },
 { role: 'tankbase', handler: handleTankBase,  spawnAttrributes: [TOUGH, TOUGH, ATTACK, ATTACK, MOVE] },
 { role: 'healerbase', handler: handleHealerBase, spawnAttrributes: [TOUGH, TOUGH, RANGED_ATTACK, HEAL, MOVE]  },
 { role: 'upgrader', handler: handleUpgrader,  spawnAttrributes: [CARRY, CARRY, WORK, MOVE, MOVE] },
 { role: 'upgraderbig', handler: handleUpgrader, prebuild:30,  spawnAttrributes: [CARRY, CARRY, CARRY, CARRY, WORK, WORK, MOVE, MOVE, MOVE, MOVE] },
 { role: 'harvesterbig', handler: handleHarvest, prebuild:20, spawnAttrributes: [CARRY, CARRY, WORK,  WORK, WORK, MOVE, MOVE] },
 { role: 'attacker', handler: handleAttacker,  prebuild:120, spawnAttrributes: [ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE] },
 { role: 'looter', handler: handleLooter,  spawnAttrributes: [TOUGH, CARRY,  HEAL, MOVE, MOVE] },
 { role: 'explorer', handler: handleExplorer,  spawnAttrributes: [MOVE] }

]
}