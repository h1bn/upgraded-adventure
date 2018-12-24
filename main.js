// values of player's choice
var stats = {};
stats.name = "Elenna";
stats.classes = "Cleric 9";
stats.HD = [8,6,8,6,6,8,5,8,3];
stats.clvl = 9;

stats.STR= 13;
stats.DEX= 17;
stats.CON= 10;
stats.INT= 8;
stats.WIS= 15;
stats.CHA= 8;

stats.BAB = "BAB_3_4(stats.clvl)";
stats.FOR = "SAVE_GOOD(stats.clvl)";
stats.REF = "SAVE_POOR(stats.clvl)";
stats.WIL = "SAVE_GOOD(stats.clvl)";
stats.skillsRanksAvailable = "2*stats.clvl";

stats.skillranks = {
	diplomacy: 1,
	heal: 1,
	knowledge_arcana: 1,
	knowledge_history: 1,
	knowledge_nobility: 1,
	knowledge_planes: 1,
	knowledge_religion: 1,
	perception: 9,
	sense_motive: 1,
	spellcraft: 1,
	stealth: 8,
	survival: 1
}

/* missing input:
	landspeed
	selected domains
	selected deity
	selected feats
	selected traits
	replaced class/race feats
	conditional bonuses
	inventory
*/


stats.bonuses = [
	{
		data: ["CON-2", "INT+2", "DEX+2"],
		type: "",
		source: "Ability Score Racial Traits",
		availability: "constant"
	},
	{
		data: ["DEX+1", "WIS+1"],
		type: "",
		source: "Advancement (Levels 4,8)",
		availability: "constant"
	},
	{
		data: ["SKILLRANKS+9"],
		type: "",
		source: "Favored Class Bonus (Levels 1-9)",
		availability: "constant"
	},
	{
		data: [
			"cs_appraise +3",
			"cs_craft +3",
			"cs_diplomacy +3",
			"cs_heal +3",
			"cs_knowledge_arcana +3",
			"cs_knowledge_history +3",
			"cs_knowledge_nobility +3",
			"cs_knowledge_planes +3",
			"cs_knowledge_religion +3",
			"cs_linguistics +3",
			"cs_profession +3",
			"cs_sense_motive +3",
			"cs_spellcraft 3"
		],
		type: "",
		source: "Class Skills (Cleric)",
		availability: "constant"
	},
	{
		data: ["ATK+3", "DMG+3"], // TODO: clvl based values
		type: "luck",
		source: "Divine Favor",
		availability: "off"
	},
	{
		data: ["RANGED_ATK-2", "BOW_DMG+4"],
		type: "",
		source: "Deadly Aim",
		availability: "off"
	},
	{
		data: ["RANGED_HASTE+1", "RANGED_ATK-2"],
		type: "",
		source: "Rapid Shot",
		availability: "off"
	},
	{
		data: ["HASTE+1"],
		type: "haste",
		source: "Blessing of Fervor (extra attack)",
		availability: "off"
	},
	{
		data: ["DEX+2"],
		type: "enhancement",
		source: "Belt of Incredible Dexterity",
		availability: "item" // TODO: item slots (overview / slot usage)
	},
	{
		data: ["cs_stealth +3", "stealth +1"], // TODO: conditional extra +1
		type: "trait",
		source: "Highlander (Trait)",
		availability: "constant"
	},
	{
		data: ["cs_perception +3", "perception +1"],
		type: "trait",
		source: "Eyes and Ears of the City (Trait)",
		availability: "constant"
	},
	{
		data: ["perception+2"],
		type: "racial",
		source: "Keen Senses (Elven Racial)",
		availability: "constant"
	},
	{
		data: ["stealth +5"],
		type: "competence",
		source: "Cloak of Elvenkind",
		availability: "item"
	},
	{
		data: ["BOW_ATK+2", "BOW_DMG+1"],
		type: "competence",
		source: "Greater Bracers of Archery",
		availability: "item"
	},
	{
		data: ["FOR+2", "REF+2", "WIL+2"],
		type: "resistance",
		source: "Holy Aura",
		availability: "constant"
	},
	{
		data: ["AC+2"],
		type: "deflection",
		source: "Holy Aura",
		availability: "constant"
	},
	{
		data: ["AC+5", "MAXDEXBONUS+6"],
		type: "armor",
		source: "Mithral Chain Shirt +1",
		availability: "item"
	}
];

stats.attacks = {
	composite_bow: {
		toHit: 1,
		dice: "d8",
		toDmg: 2,
		extra: "holy",
		source: "item",
		type: "ranged bow piercing magic"
	},
	dagger: {
		dice: "d4",
		source: "item",
		type: "melee piercing slashing"
	}
};

// other values
stats.totalSTR = stats.STR + sumBonus("STR");
stats.totalDEX = stats.DEX + sumBonus("DEX");
stats.totalCON = stats.CON + sumBonus("CON");
stats.totalINT = stats.INT + sumBonus("INT");
stats.totalWIS = stats.WIS + sumBonus("WIS");
stats.totalCHA = stats.CHA + sumBonus("CHA");

// TODO: size mods
stats.totalCMB = val(stats.BAB) + STAT_MOD(stats.totalSTR) + sumBonus("CMB");
stats.totalCMD = 10 + val(stats.BAB) + STAT_MOD(stats.totalSTR) +
	STAT_MOD(stats.totalDEX) + sumBonus("CMD");

stats.totalINI = STAT_MOD(stats.totalDEX) + sumBonus("INI");

stats.totalFOR = STAT_MOD(stats.totalCON) + val(stats.FOR) + sumBonus("FOR");
stats.totalREF = STAT_MOD(stats.totalDEX) + val(stats.REF) + sumBonus("REF");
stats.totalWIL = STAT_MOD(stats.totalWIS) + val(stats.WIL) + sumBonus("WIL");

stats.totalAC = 10 + sumBonus("AC") +
	Math.min(sumBonus("MAXDEXBONUS"), STAT_MOD(stats.totalDEX));

stats.hitpoints = SUM_HD(stats.HD,stats.totalCON);

stats.skillRanksOpen = sumBonus("SKILLRANKS") +
	val(stats.skillsRanksAvailable) - sumValues(stats.skillranks);

stats.skills = {};

calculateSkill("stealth", "DEX");
calculateSkill("heal", "WIS");
calculateSkill("knowledge_religion", "INT");
calculateSkill("perception", "WIS");

$(".tab_header").click(function() {
	$(".tab_content").hide();
	$("#"+$(this).attr("data-content-tab")).show();
});

// TODO: arrange fields or let them be arranged (drag&drop or dropdown > send to tab X)
function showCombatStats() {
	let parent = $("#content_combat");
	parent.html("");
	
	createDisplayElem("Classes", "classes", parent);
	createDisplayElem("Hitpoints", "hitpoints", parent);
	createDisplayElem("BAB", "BAB", parent);
	createDisplayElem("STR", "totalSTR", parent);
	createDisplayElem("DEX", "totalDEX", parent);
	createDisplayElem("CON", "totalCON", parent);
	createDisplayElem("INT", "totalINT", parent);
	createDisplayElem("WIS", "totalWIS", parent);
	createDisplayElem("CHA", "totalCHA", parent);
	createDisplayElem("CMB", "totalCMB", parent);
	createDisplayElem("CMD", "totalCMD", parent);
	createDisplayElem("INI", "totalINI", parent);
	createDisplayElem("FOR", "totalFOR", parent);
	createDisplayElem("REF", "totalREF", parent);
	createDisplayElem("WIL", "totalWIL", parent);
	createDisplayElem("AC", "totalAC", parent);
	//createDisplayElem("", "skillRanksOpen", parent);
	parent.append(createSkillsTable());
	
	//createSpellsElem(parent);

	for (let atk in stats.attacks) {
		createAttackDisplayElem(atk, parent);
	}

	for (let key in stats.bonuses) {
		let bonus = stats.bonuses[key];
		if ("on" == bonus.availability || "off" == bonus.availability) {
			createBonusSwitchElem(bonus, parent);
		}
	}
}

showCombatStats();