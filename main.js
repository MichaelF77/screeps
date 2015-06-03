var _ = require('lodash');

var spawner = require('spawner');
var roles = require('roles').roles;


var buildOrder1 = [
    'harvester',
    'harvesterbig',
    'upgraderbig', 'upgraderbig',
    'upgraderbig', 'upgraderbig',
    'harvesterbig','harvesterbig'
   // 'attacker'
    //'ranger',
    //'builder',
   //,'attacker','attacker','attacker'
  //  'tankbase','healerbase','rangerbase',
  //  'tank','healer','ranger','healermain',
    ];

var v = require('rules').vlog;

_(roles).forEach(function(r) {
	var workers = _.filter(Game.creeps, {
	    memory: {role: r.role}
	});
	if (v) console.log(r.role, workers.length);
	for (var i =0; i < workers.length; i++) {
	    var creep = workers[i];
	    r.handler(creep);
	}
}).value();


spawner.handleBuildOrder(Game.spawns.Spawn1, buildOrder1);

var debugCpu = function(cpu) {
    var spawn = Game.spawns.Spawn1;
    var mainTarget = spawn.room.memory.currentTarget;
    var baseTarget = spawn.room.memory.currentBaseTarget;
        console.log('Used',cpu,'out of',Game.cpuLimit,' ',cpu*100/Game.cpuLimit,'% Spawn energy:', spawn.energy,
        'Main target:', mainTarget?mainTarget.pos:'(none)',
        'Base target:',baseTarget?baseTarget.pos:'(none)');
};

//debugCpu(Game.getUsedCpu());

