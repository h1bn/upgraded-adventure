var stats;
var exportedKeys = [];

function loadCharacter(filename) {
	var scriptElem = document.createElement("script");
	scriptElem.onload = function() {
		stats = characterSheet;
		exportedKeys = Object.keys(characterSheet);
		refreshAll();
	};
	scriptElem.onerror = function() {
		// TODO: write this in the GUI
		console.log("error loading character");
	};
	scriptElem.src=filename;
	document.head.appendChild(scriptElem);
}

/* TODO: missing input:
		phys. values (height/weight/hair/eyes/...)
		selected domains
		selected deity
		selected feats
		selected traits
		replaced class/race feats
		conditional bonuses
		senses
		inventory
		item slots (overview / slot usage)
		clvl based values
	*/

function calcDerivedValues() {
	// use items and other sources for bonuses
	stats.bonuses = [];
	let sources = stats.items.concat(stats.innate);	
	for (let i in sources) {
		let source = sources[i];
		if (source.bonus) {
			if (source.bonus.data) { // single bonus
				stats.bonuses[stats.bonuses.length] = {
					data: source.bonus.data,
					type: source.bonus.type,
					source: source.name
				}
			} else { // array of bonuses
				for (let ii in source.bonus) {
					stats.bonuses[stats.bonuses.length] = {
						data: source.bonus[ii].data,
						type: source.bonus[ii].type,
						source: source.name
					}
				}
			}
		}
	}

	// TODO: validate if any temporary bonus has an invalid source
	stats.bonuses = stats.bonuses.concat(
		stats.temporary.filter(x => x.state == "on"));
	
	// TODO: explain calculations e.g. with this:
	//	stats.totalSTR = (()=>stats.STR + sumBonus("STR"))();
	//	explainSTR = `base ${stats.STR} + ?? (bonuses)`;
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
	stats.totalTouchAC = stats.totalAC
		- sumBonus("AC", "armor") - sumBonus("AC", "shield") - sumBonus("AC", "natural");
	stats.totalFlatFootedAC = stats.totalAC - sumBonus("AC", "dodge") -
		Math.min(sumBonus("MAXDEXBONUS"), STAT_MOD(stats.totalDEX));
	// TODO: incorporeal touch AC ( = touch AC + armor from force effects)

	stats.hitpoints = SUM_HD(stats.HD,stats.totalCON);

	stats.skillRanksOpen = sumBonus("SKILLRANKS") +
		val(stats.skillsRanksAvailable) - sumValues(stats.skillranks);

	stats.totalSpeedLand = 30 + sumBonus("LANDSPEED");

	stats.skills = {};

	// TODO: mark if a skill is not trained
	// TODO: add other skills
	calculateSkill("stealth", "DEX");
	calculateSkill("heal", "WIS");
	calculateSkill("knowledge_religion", "INT");
	calculateSkill("perception", "WIS");

	stats.spellslots = [];

	for (let isource in stats.spellcasting) {
		let source = stats.spellcasting[isource];
		let clvl = stats.HD.length;

		let spellsPerDay = val(source.slots+"("+clvl+")");

		for (let slvl = 0; slvl < spellsPerDay.length; ++slvl) {
			let casterStatMod = STAT_MOD(val("stats.total" + source.ability));
			let bonusSpells = (source.bonusSpells) ?
				BONUS_SPELLS_PER_DAY(casterStatMod, slvl) : 0;
			for (let i = 0; i < spellsPerDay[slvl] + bonusSpells; ++i) {
				let slot = {
					name: "",
					level: slvl,
					accept: source.accept
				}
				stats.spellslots.push(slot);
			}
		}
	}
	stats.spellslots.sort((a,b)=>a.level > b.level);

	// prepare spells
	for (let i in stats.prepared) {
		let prepared = stats.prepared[i];
		let possibleslots = findSlotForPreparedSpell(prepared);
		if (possibleslots.length > 0) {
			possibleslots[0].name = prepared.name;
			if (prepared.used) possibleslots[0].used = true;
		} else {
			// TODO: show this message in GUI
			console.log("no slot found for "+prepared);
		}
	}
}

// TODO: missing fields: non-land-movement speeds
// TODO: validators (with display) for used feats, used skill ranks, spell slots, ...
function refreshCombatStats() {
	let parent = $("#content_combat");
	parent.html("");
	
	createDisplayElem("1/1/span 1/span 1", "Name", "name", parent);
	createDisplayElem("1/2/span 1/span 1", "Classes", "classes", parent);
	createDisplayElem("1/3/span 1/span 1", "Race", "race", parent);

	createDisplayElem("2/1/span 1/span 1", "STR", "totalSTR", parent);
	createDisplayElem("3/1/span 1/span 1", "DEX", "totalDEX", parent);
	createDisplayElem("4/1/span 1/span 1", "CON", "totalCON", parent);
	createDisplayElem("5/1/span 1/span 1", "INT", "totalINT", parent);
	createDisplayElem("6/1/span 1/span 1", "WIS", "totalWIS", parent);
	createDisplayElem("7/1/span 1/span 1", "CHA", "totalCHA", parent);

	createDisplayElem("2/2/span 1/span 1", "Hitpoints", "hitpoints", parent);
	createDisplayElem("2/3/span 1/span 1", "Speed", "totalSpeedLand", parent, "ft");
	createDisplayElem("3/2/span 1/span 1", "INI", "totalINI", parent);
	createDisplayElem("4/2/span 1/span 1", "AC", "totalAC", parent);
	createDisplayElem("5/2/span 1/span 1", "FOR", "totalFOR", parent);
	createDisplayElem("6/2/span 1/span 1", "REF", "totalREF", parent);
	createDisplayElem("7/2/span 1/span 1", "WIL", "totalWIL", parent);
	
	createDisplayElem("4/3/span 1/span 1", "AC (touch)", "totalTouchAC", parent);
	createDisplayElem("4/4/span 1/span 1", "AC (flat-footed)", "totalFlatFootedAC", parent);
	createDisplayElem("", "CMB", "totalCMB", parent);
	createDisplayElem("", "CMD", "totalCMD", parent);

	createDisplayElem("", "BAB", "BAB", parent);

	// TODO: add grid-area property to all elements
	parent.append(createSkillsTable());

	for (let atk in stats.attacks) {
		createAttackDisplayElem(atk, parent);
	}

	for (let key in stats.temporary) {
		let tmp = stats.temporary[key];
		if ("on" == tmp.state || "off" == tmp.state) {
			createSwitchElem(tmp, parent);
		}
	}
}

// TODO: add filters to select between displays if there are too many lines (checkboxes)
// TODO: validators
function refreshDetailsTab() {
	let parent = $("#content_details");
	parent.html("");

	showValidatorInfo(parent);

	/*for (let i in stats.bonuses) {
		let bonus = stats.bonuses[i];
		let elem = $("<div></div>");
		elem.append(bonus.source);
		parent.append(elem);
	}*/
	for (let i in stats.items) {
		let item = stats.items[i];
		let quantityStr = item.quantity?item.quantity+"x ":"";
		let slotStr = item.slot?`(${item.slot})`:"";
		let elem = $(`<div>${quantityStr}${item.name} ${slotStr}</div>`);
		parent.append(elem);
		var flag = true;
	}

	if (flag) parent.append("<hr>");

	for (let i in stats.innate) {
		let innate = stats.innate[i];
		let elem = $(`<div>${innate.name}</div>`);
		parent.append(elem);
	}
}

function showValidatorInfo(parent) {
	parent.append("stuff is missing!");
}

// TODO: order spells in prep-modal window by highest level, then alphabetically
// TODO: use a slot (but retain the spell info)
// TODO: add linebreaks between spellslots
// TODO: more details on spellslot-elements (and highlight depending on state)
// TODO: other daily powers
function refreshSpellTab() {
	let parent = $("#content_spells");
	parent.html("");

	// TODO: make prepareMode toggleable and save it in localStorage
	let prepareMode = false;
	// TODO: find better symbols
	let prepareSwitchElem = $(`<div>${prepareMode?
			"&#x1f4d6;&#xFE0E; Prepare Spells":
			"&#x1f4d5;&#xFE0E; Use Spells"}</div>`);
	parent.append(prepareSwitchElem);

	for (let i = 0; i < stats.spellslots.length; ++i) {
		let slot = stats.spellslots[i];
		if (prepareMode || slot.name.length > 0) {
			let slotElem = $(`<div>${slot.level} ${slot.name} ${slot.accept}</div>`);
			slotElem.addClass("spellslot");
			if (slot.used) slotElem.addClass("strikethrough");
			slotElem.click(function() {
				let modalElem = createModalWindow();
				let modalTitleElem = $(`<div>Spellslot: ${slot.accept} ${slot.level}</div>`);
				modalTitleElem.addClass("modal-title");
				modalElem.append(modalTitleElem);

				if (slot.name.length > 0 && prepareMode) {
					unprepareElem = $(`<div>Unprepare this spell (${slot.name})</div>`);
					unprepareElem.click(function() {
						let filtered = stats.prepared.filter(
							x => (
								x.name == slot.name &&
								x.slot == slot.accept &&
								x.slotlevel == slot.level));
						if (filtered.length > 0) {
							filtered[0].name = "";
							refreshAll();
						}
					});
					modalElem.append(unprepareElem);
					modalElem.append("<hr>");
				}
				
				if (prepareMode) {
					let spells = findSpellsForSpellSlot(slot);
					for (let spell in spells) {
						let spellSelectElem =
							$(`<div>Prepare: ${spell} (Level ${spells[spell].level})</div>`);
						spellSelectElem.data("slot", slot);
						spellSelectElem.data("i", i);
						spellSelectElem.click(function() {
							slot.name = spell;
							refreshAll();
							stats.spellslots[i] = slot;

							// FIXME: limit this if it would prepare more spells than spellslots available
							stats.prepared.push({
								name: spell,
								slot: slot.accept,
								slotlevel: slot.level
							});
							refreshAll();
						});
						modalElem.append(spellSelectElem);
					}
				} else {
					// TODO: order used spells to the back of the list
					// TODO: display DC of spell
					let castElem = $(`<div>${slot.used?"Undo":"Cast this spell"}</div>`);
					castElem.click(function() {
						let filtered = stats.prepared.filter(
							x => (
								x.name == slot.name &&
								x.slot == slot.accept &&
								x.slotlevel == slot.level &&
								x.used == slot.used));
						if (filtered.length > 0) {
							// FIXME: regenerate text of castelem
							if (filtered[0].used) {
								delete filtered[0].used;
							} else {
								filtered[0].used = true;
							}
							console.log(filtered[0]);
							refreshAll();
						}
					});
					modalElem.append(castElem);
				}
			});
			parent.append(slotElem);
		}
	}
	parent.append("<div/>");
	// POWERS
	let powerSources = stats.innate.concat(stats.items);
	for (let key in powerSources) {
		let source = powerSources[key];
		if (source.power) {
			// TODO: make powers usable (=reduce count by 1)
			let usesStr = source.power.uses_per_day?`${val(source.power.uses_per_day)}x `:"";
			let powerElem = $(`<div>${usesStr}${source.name}</div>`);
			powerElem.addClass("spellslot");
			parent.append(powerElem);
		}
	}
}

function createModalWindow() {
	let modalElem = $("<div></div>");
	modalElem.addClass("modal");
	modalElem.click(function(e) {
		if (e.target == $(this)[0]) {
			$(this).remove();	
		}
	});
	$("body").append(modalElem);

	let contentElem = $("<div></div>");
	modalElem.append(contentElem);

	return contentElem;
}

function initGUI() {
	$(".tab_header").click(function() {
		$(".tab_content").hide();
		$("#" + $(this).attr("data-content-tab")).show();
		localStorage.setItem("currentTab", $(this).attr("id"));
	});
	let previousTab = localStorage.getItem("currentTab");
	if (previousTab) {
		$("#" + previousTab).click();
	} else {
		$("#tab_export").click();
	}
}

function refreshExportTab() {
	let exportPrefix = "characterSheet = ";

	let parent = $("#content_export");
	parent.html("");

	let exportData = {};
	for (key in stats) {
		if (exportedKeys.includes(key)) {
			exportData[key] = stats[key];
		}
	}

	let exportStr = exportPrefix + JSON.stringify(exportData, undefined, "\t");

	// replace quotes
	exportStr = exportStr.replace(/\"([^\s"]+)\":/g,"$1:");

	// remove some whitespace in arrays if they are short enough (for [] brackets)
	exportStr = exportStr.replace(/\[[^\[\]]{1,80}\]/g,
		function(m) {
			return m.replace(/\n/g, "")
				.replace(/\s{1,}/g, " ")
				.replace(/\[ /g, "[").replace(/ \]/g, "]");
		}
	);
	// remove some whitespace in arrays if they are short enough (for {} brackets)
	exportStr = exportStr.replace(/{[^{\[}]{1,80}}/g,
		function(m) {
			return m.replace(/\n/g, "")
				.replace(/\s{1,}/g, " ")
				.replace(/{ /g, "{").replace(/ }/g, "}");
		}
	);
	
	let inputElem = $("<textarea></textarea>");
	inputElem.val(exportStr);
	parent.append(inputElem);

	let importElem = $("<div>Import</div>");
	importElem.click(function() {
		stats = eval(inputElem.val());
		refreshAll();
	});
	parent.append(importElem);
}

function refreshAll() {
	localStorage.setItem("stats", JSON.stringify(stats));
	calcDerivedValues();
	refreshCombatStats();
	refreshDetailsTab();
	refreshSpellTab();
	refreshExportTab();
}

initGUI();

let urlParams = new URLSearchParams(window.location.search);
let loadChar = urlParams.get("c");

if (loadChar) {
	loadCharacter(loadChar);
} else {
	let locallyStored = localStorage.getItem("stats");
	if (locallyStored) {
		stats = JSON.parse(locallyStored);
		exportedKeys = Object.keys(stats);
		refreshAll();
	} else {
		loadCharacter("characters/elenna.js");
	}
}