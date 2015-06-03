var rules = require('rules');


Creep.prototype.findClosest = function(t,opts) {
   return this.pos.findClosest(t,opts);
};

Room.prototype.toMem = function(object,target) {
    if (target == null || target == undefined)
        this.memory[object] = null;
    else if (Array.isArray(target))
        this.memory[object] = target.map(function(t) { return t.id; });
    else
        this.memory[object] = target.id;

}

Room.prototype.fromMem = function(object, setter) {
    var savedId = this.memory[object];
    var result = null;
    if (savedId != null && savedId != undefined) {
     if (Array.isArray(savedId))
        result = savedId.map(function(t) { return Game.getObjectById(t); });
    else
        result = Game.getObjectById(savedId);
    }
    if (result == null && setter != undefined) {
        result = setter();
        this.toMem(object,result);
    }
    return result;
}



function findSpawn(creep) {
    var result = null;
    if (creep)
        result = creep.room.fromMem('savedSpawn',function() { return creep.findClosest(FIND_MY_SPAWNS); });
    if (result)
        return result;
    return Game.spawns.Spawn1;
}

function getExtentions(creep) {
    return creep.room.fromMem('extensions', function() {
        return creep.room.find(FIND_MY_STRUCTURES, {
          filter: { structureType: STRUCTURE_EXTENSION }
        });
    });
}


function findExitPath(creep, target) {
  var exitDir = creep.room.findExitTo(target.room);
  return creep.pos.findClosest(exitDir);
}

function findNearestInvader(creep) {
		return creep.findClosest(FIND_HOSTILE_CREEPS, {
		    filter: function(enemy) {
             return enemy.owner.username != "Source Keeper";
            }
		});
}

function compareCandidate(creep, bestCandidate, candidate) {
 if (bestCandidate == null)
   return candidate;
 if (candidate.getActiveBodyparts(MOVE) > 0 && bestCandidate.getActiveBodyparts(MOVE) == 0 )
  return candidate;
 if (candidate.getActiveBodyparts(MOVE) > 0 && candidate.getActiveBodyparts(MOVE) < bestCandidate.getActiveBodyparts(MOVE))
  return candidate;
 if (candidate.getActiveBodyparts(HEAL) > bestCandidate.getActiveBodyparts(HEAL) )
  return candidate;
 if (creep.pos.getRangeTo(candidate) < creep.pos.getRangeTo(bestCandidate))
  return candidate;
 return bestCandidate;
}

function findEnergyNearby(creep) {
    var energy = creep.pos.findInRange(FIND_DROPPED_ENERGY, rules.maxEnergySearch);
    if (energy.length && energy[0].energy > rules.minEnergyToPickUp)
        return energy[0];
    return null;
}

function findEnergySourceNearby(creep) {
    return creep.findClosest(FIND_SOURCES);
}

function isRampart(room, p) {
    var rampartMap = room.fromMem('rampartMap', function() {
        return room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_RAMPART }
        });
    });
    for (var i=0;i<rampartMap;i++) {
        var rampart = rampartMap[i];
        if (p.isEqualTo(rampart))
            return true;
    }
    return false;
}

function findBestTarget(creep) {
    if (Game.flags.FlagA && creep.room == Game.flags.FlagA.room ) {
        var targets = _.filter( creep.room.lookAt(Game.flags.FlagA) ,
            function(f) {
                return f.type != 'terrain';
            }
        );
        if (targets.length)
            return targets[0][targets[0].type];
    }

    var enemies = creep.pos.findInRange(FIND_CREEPS, rules.maxEnemySearch,  {
		    filter: function(enemy) {
             return enemy.owner.username != "Source Keeper" && !isRampart(room,enemy.pos);
            }
		});
	var bestCandidate = null;
	for (var i = 0; i < enemies.length; i++ ) {
	  var candidate = enemies[i];
	  bestCandidate = compareCandidate(creep, bestCandidate, candidate );
	}
	return bestCandidate;
}


function findNearestSourceKeeper(creep) {
		return creep.findClosest(FIND_HOSTILE_CREEPS,  {
		    filter: function(enemy) {
             return enemy.owner.username == "Source Keeper";
            }
		});
}



function findClosestToHeal(creep,f) {
    return creep.pos.findClosest(FIND_MY_CREEPS, {
        filter: function(object) {
            return creep != object && object.hits < object.hitsMax && (!f || f(object));
        }});
}

function findRole(creep,role) {
    return creep.pos.findClosest(FIND_MY_CREEPS, {
        filter: function(object) {
            return object.memory.role == role;
        }});
}


function findNearestMainTank(creep) {
    return creep.pos.findClosest(FIND_MY_CREEPS, {
        filter: function(object) {
            return object.memory.role == 'tank' || object.memory.role == 'attacker';
        }});
}



function findEnergyDropoff(creep) {
    var spawn = findSpawn(creep);
        if (spawn.energy + creep.energy <= spawn.energyCapacity)
         return spawn;
    var extensions = getExtentions(creep);
	for (var i = 0; i < extensions.length; i++ ) {
	  var candidate = extensions[i];
	  if (candidate.energy < candidate.energyCapacity)
	    return candidate;
	}
    return spawn;
}

function findEnergyPickup(creep) {
    var extensions = getExtentions(creep);
	for (var i = 0; i < extensions.length; i++ ) {
	  var candidate = extensions[i];
	  if (candidate.energy == candidate.energyCapacity)
	    return candidate;
	}
    return null;
}

function getAllAvailableEnergy(creep) {
    var spawn = findSpawn(creep);
    var result = spawn.energy;
    var extensions = getExtentions(creep);
	for (var i = 0; i < extensions.length; i++ ) {
	  var candidate = extensions[i];
	  result += candidate.energy;
	}
    return result;
}

function findRepairOrConstructionTarget(creep) {
    var target = findConstructionTarget(creep);
    if (target == null) {
        target = findRepairTarget(creep);
    }
    return target;
}

function findConstructionTarget(creep) {
    var target = creep.findClosest(FIND_CONSTRUCTION_SITES);
    return target;
}


function findRepairTarget(creep) {
    var target = creep.findClosest( FIND_STRUCTURES, {
            filter: function(object) {
                return (object.hits * 2 < object.hitsMax) && object.structureType != 'rampart';
        }
        });
    return target;
}

function findNearestFlag(creep, flag, checkUnder) {
    if (flag == null)
        flag = creep.findClosest(FIND_FLAGS);
        if (!flag) return null;
        if (!checkUnder)
            return flag;
        var targets = _.filter( creep.room.lookAt(flag) ,
            function(f) {
                return f.type != 'terrain';
            }
        );
        if (targets.length) return targets;
        return null;
}

function checkIfValidTarget(room, target) {
    if (target == null)
        return false;
    if (target.structureType != undefined ) {
        //console.log(target.structureType);
        return true;
    }
    if (target.owner != undefined ) {
        //console.log(target.owner.username);
        return true;
    }

    return false;
}

function pickTarget(creep, findTarget, selector,checkDistance) {
        var room = creep.room;
        var currentTarget = room.fromMem(selector);
        if (!checkIfValidTarget(room,currentTarget)) {
            currentTarget = findTarget(creep);
            if (currentTarget && checkDistance) {
                var path = creep.pos.findPathTo(currentTarget.pos);
                if (path.length >= checkDistance) {
                    currentTarget = null;
                } else {
                   // console.log("Too far");
                }
            }
            console.log('Setting new target:',currentTarget);
            room.toMem(selector,currentTarget);
        }
        return currentTarget;
}

module.exports = {
    findNearestInvader: findNearestInvader,
    findNearestSourceKeeper: findNearestSourceKeeper,
    findClosestToHeal: findClosestToHeal,
    findNearestMainTank: findNearestMainTank,
    findRole: findRole,
    findEnergyNearby: findEnergyNearby,
    findSpawn: findSpawn,
    findEnergyDropoff: findEnergyDropoff,
    findRepairOrConstructionTarget : findRepairOrConstructionTarget,
    findConstructionTarget:findConstructionTarget,
    findRepairTarget:findRepairTarget,
    findNearestFlag:findNearestFlag,
    findEnergyPickup:findEnergyPickup,

    getAllAvailableEnergy:getAllAvailableEnergy,
    findExitPath : findExitPath,



    pickMainTank:function(creep) {
        var room = creep.room;
        var currentTarget = room.fromMem('currentMainTank');
        if (currentTarget == null || !currentTarget.my) {
            currentTarget = findNearestMainTank(creep);
            room.toMem('currentMainTank', currentTarget);
        }
        return currentTarget;
    },

    pickSourceTarget:function(creep) {
        return pickTarget(creep,
         findNearestInvader,
         'currentSourceTarget',
         0
         );
    },

    pickTarget:function(creep) {
        return pickTarget(creep,
         findBestTarget,
         'currentTarget',
         0
         );
    },

    pickBaseTarget:function(creep) {
        return pickTarget(creep,
         findNearestInvader,
         'currentBaseTarget',
         rules.maxBaseSearch
         );
    }

}