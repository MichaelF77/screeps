var finder = require('finder');


Creep.prototype.moveDetermine = function(t,opts) {
  if (!t) {
    this.memory.currentMoveTarget = null;
    this.memory._move = null;
    return ERR_INVALID_TARGET;
  }
  var result = ERR_NOT_FOUND;
  if (this.memory.currentMoveTarget)  {
       var savedPos = new RoomPosition(this.memory.currentMoveTarget.x,
       this.memory.currentMoveTarget.y,
       this.memory.currentMoveTarget.roomName);
      if (savedPos.isEqualTo(t))
        result = this.moveTo(t.pos, {noPathFinding:true});
  }
  if (result == OK)
    return OK;
  if (result == ERR_NOT_FOUND) {
      this.memory.currentMoveTarget = t.pos;
      opts = opts || {};
      opts.reusePath = 30;
      result = this.moveTo(t, opts);
  }
  if (result != OK) {
    this.memory.currentMoveTarget = null;
    this.memory._move = null;
  }
  return result;
}



function getSpawn(creep) {
    return finder.findSpawn(creep);
}

function rallyToFlag(creep, flag) {
    var target = flag;
    if (target == null)
        target = Game.flags.FlagS;
    if (target == null)
        target = finder.findNearestFlag(creep);
    if (target)
        creep.moveDetermine(target);
    else
        creep.moveDetermine(getSpawn());
}

function followFlags(creep, flagRoute) {
 var flag = null;
 var n = 0;
 for (var i=0;i<flagRoute.length;i++,n++) {
     if (!flagRoute[i])
     break;
 }
 if (!creep.memory.flagVisited )
    creep.memory.flagVisited = {};
 if (creep.memory.flagVisited[flagRoute[n-1]] == true)
    return true;
 for (var i=0;i<n;i++) {
     flag = flagRoute[i];
     if (creep.memory.flagVisited[flag.id] == true)
        continue;
    break;
 }
 //console.log('Checking:',n,flag, flag.room, creep.room);
 if (flag.room == creep.room ) {
     if (flag.pos.isNearTo(creep.pos)) {
         creep.memory.flagVisited[flag.id] = true;
     }
     creep.moveTo(flag);
     return true;
 }
 else {
 var p = finder.findExitPath(creep,flag);
 if (p == ERR_NO_PATH) {
    console.log('No path to:', flag);
 } else {
    creep.moveTo(p);
    return true;
 }
 }
 return false;
}



function makeClaim(creep) {
    if(creep.room.controller) {
        console.log(creep.claimController(creep.room.controller));
    }
}


function rallyToMainTank(creep) {
    var target = finder.pickMainTank(creep);
    if (target && target != creep)
        creep.moveDetermine(target);
    else
        rallyToFlag(creep);

}

function rallyToSpawn(creep) {
    var pos = getSpawn().pos;
    creep.moveTo(pos.x-1,pos.y-1);
}

    function performMeleeAttack(creep,target) {
        console.log('Melee attacking:',target.pos);
		    if (creep.pos.inRangeTo(target, 1)) {
			    creep.attack(target);
		    } else {
		        creep.moveTo(target);

		    }
    };

    function performRangeAttack(creep,target) {
        console.log('Range attacking:',target.pos);
		    if (creep.pos.inRangeTo(target, 3)) {
			    creep.rangedAttack(target);
		    } else {
		        creep.moveTo(target);

		    }
    }

    function healIfAvailable(creep,target) {
    if(target != null) {
        creep.moveTo(target);
        creep.heal(target);
        return true;
    }
    return false;

}



function harvestClosest(creep, isLowPriority) {
    var doDelivery = false;
    if (creep.energy == creep.energyCapacity)
    {
        doDelivery = true;
	} else {
	    var source = creep.room.fromMem('harvest');
	    if (!source) {
	        source = creep.findClosest(FIND_SOURCES,{ignoreCreeps:true});
	        creep.room.toMem('harvest', source);
	    }
	    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
	        if (creep.energy > 0) {
	            doDelivery = true;
	        } else {
    	        if (isLowPriority == true) {
    	            if (getSpawn(creep).isPendingRoleToSpawn('harvest') )
    	                console.log('waiting for harvester so harvesting');
    	                else
    	                return false;
    	        }
	            creep.moveDetermine(source);
	        }
	    }
	}
	if (doDelivery) {
		var target = finder.findEnergyDropoff(creep);
		creep.moveDetermine(target);
		creep.transferEnergy(target);
	}
	return true;
}




function pickupClosest(creep, target) {
     if(creep.energy < creep.energyCapacity) {
		creep.moveDetermine(target);
		var result = creep.pickup(target);
		return (result == OK || result == ERR_NOT_IN_RANGE);
	}
	return false;
}

function handleEnergyState(creep,eth,action,allAvail) {
    var spawn = getSpawn(creep);
    var avail = spawn.energy;
    if (allAvail)
        avail = finder.getAllAvailableEnergy(creep);
    if ((creep.memory.busy || avail >= eth)) {
        if(creep.energy == 0) {
               if (avail >= eth) {
                    creep.moveDetermine(spawn);
                    var err = spawn.transferEnergy(creep);
                    if (err == OK) {
                        console.log(creep,'begin');
                        creep.memory.busy = true;
                    } else if (err != ERR_NOT_IN_RANGE) {
                        spawn.handleError(err, "Energy transfer:");
                        return false;
                    }
                    return true;
               }
                else {
                    console.log(creep,'stop');
                    creep.memory.busy = false;
                    return false;
                }
        } else {
            action();
            return true;
        }
    }
    return false;
}

module.exports = {
    rallyToSpawn: rallyToSpawn,
    rallyToFlag: rallyToFlag,
    rallyToMainTank : rallyToMainTank,
    performMeleeAttack: performMeleeAttack,
    performRangeAttack: performRangeAttack,
    harvestClosest: harvestClosest,
    healIfAvailable: healIfAvailable,
    pickupClosest: pickupClosest,
    makeClaim:makeClaim,
    followFlags:followFlags,
    handleEnergyState: handleEnergyState
}
