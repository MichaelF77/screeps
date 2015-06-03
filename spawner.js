var _ = require('lodash');

var rules = require('rules');
var roles = require('roles').roles;

Spawn.prototype.handleError = function(result, errMessage, showRangeError) {
    if (result != OK) {
            if(_.isString(result)) {
                console.log('The name is: ',result);
                this.memory.lastProposedName = null;
                this.memory.preemptSpawn = this.memory.preemptSpawnRequest;
                this.memory.preemptSpawnRequest = null;
            }
            else {
                if (result != ERR_NOT_IN_RANGE || showRangeError)
                    console.log(errMessage, result);
            }
    }
}

Spawn.prototype.isPendingRoleToSpawn = function(role) {
    if (this.memory.preemptSpawn != null) {
        var worker = Game.getObjectById(this.memory.preemptSpawn);
        if (worker == null)
            this.memory.preemptSpawn = null;
        else
            return false; // preemptive spawn
    }
    if (this.memory.lastProposedName && this.memory.lastProposedName.indexOf(role) == 0)
        return true;
    return false;
}

function spawnRole(spawn, role) {
	if (spawn.spawning != null) {
	    console.log("Busy spawning:", spawn.spawning.name);
	}  else if (_.intersection(role.spawnAttrributes, [HEAL, ATTACK, RANGED_ATTACK]).length && spawn.energy < rules.harvesterEnergy) {
	    console.log("Saving energy for harvesters");
	} else {
	    var idx = (spawn.memory.idx || 1)+1;
	    var proposedName = role.role + idx;
	    if (spawn.canCreateCreep(role.spawnAttrributes) == OK) {
	        spawn.handleError(spawn.createCreep(role.spawnAttrributes, proposedName, { role: role.role}), "Spawn:");
    	    spawn.memory.idx = idx;
	    } else {
	        if (proposedName != spawn.memory.lastProposedName) {
	            console.log('Not enough energy to spawn: ',proposedName);
	            spawn.memory.lastProposedName = proposedName;
	        }
	    }

	}
}

function handleBuildOrder(spawn, buildOrder) {
if (spawn.spawning == null) {

var v = rules.vlog;
var workersUsed = [];


_(buildOrder).forEach(function(b) {
    if (v) console.log("Checking:",b);
	var workers = _.filter(Game.creeps, {
	    memory: {role: b}
	});
	var roleToSpawn = _.find(roles,{role:b});
	var needSpawn = true;
	for (var i = 0; i  < workers.length; i++) {
	    var name = workers[i].name;
	    if (_.indexOf(workersUsed, name) == -1) {
	        needSpawn = false;
	        workersUsed.push(name);
	        break;
    	}
    }
    if (needSpawn) {
     spawn.memory.preemptSpawnRequest = null;
    } else if (roleToSpawn.prebuild) {
        var oldest = null;
	    for (var i = 0; i  < workers.length; i++) {
	        var worker = workers[i];
	        if (oldest == null || oldest.ticksToLive > worker.ticksToLive)
	            oldest = worker;
	    }
	    if (oldest != null && oldest.ticksToLive < roleToSpawn.prebuild &&
	        spawn.memory.preemptSpawn != oldest.id) {
    	        if (v) console.log('About to die, need to rebuild:',roleToSpawn.role);
    	        spawn.memory.preemptSpawnRequest = oldest.id;
    	        needSpawn = true;
	        }
    }
    if (needSpawn) {
      if (v) console.log("Trying to spawn:",roleToSpawn.role);
      spawnRole(spawn,roleToSpawn);
      return false;
    }
}).value();
}

}


module.exports = {
    spawnRole:spawnRole,
    handleBuildOrder:handleBuildOrder
}
