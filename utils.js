function val(formula) {
	try {
		let result = eval(formula);
		return result;
	} catch (e) {
		return formula;
	}
}

function splitBonusFormula(str) {
	let pos = str.search(/[+=-]/);
	if (-1 == pos) return [str, ""];
	let stat = str.substr(0, pos).trim();
	let formula = str.substr(pos).trim();
	return [stat, formula];
}

// TODO: add explanation of bonuses to gui
function sumBonus(keyword, bonustype, sourceData) {
	let source = sourceData ? sourceData : stats.bonuses;
	let result = 0;
	for (let i in source) {
		let bonus = source[i];
		if (!bonustype || bonustype == bonus.type) {
			for (let idata in bonus.data) {
				let [stat, formula] = splitBonusFormula(bonus.data[idata]);
				if (keyword == stat) {
					let expr = "result" + formula;
					result = eval(expr);
				}
			}
		}
	}
	return result;
}

function calculateSkill(skillname, ability, hasSubSkills, applyClassSkillBonus) {
	let ranks = stats.skillranks[skillname];
	let classSkillbonus = applyClassSkillBonus ? 3 : sumBonus("cs_" + skillname);

	if (ranks > 0 || IS_UNTRAINED_SKILL(skillname)) {
		stats.skills[skillname] =
			STAT_MOD(stats["total" + ability])
			+ (ranks || 0) + (ranks > 0 ? classSkillbonus : 0) + sumBonus(skillname)
			+ sumBonus(ability + "_CHECKS");
	}

	if (hasSubSkills) {
		let subSkills = Object.keys(stats.skillranks)
			.filter(x => x.match(new RegExp("^" + skillname, "")));
		subSkills.map(x => calculateSkill(x, ability, false, classSkillbonus > 0));
	}
}

function createDisplayElem(gridArea, displayName, attr, parentElem, unit) {
	unit = unit || "";
	let content = val(stats[attr]);
	if (typeof (content) == "object") content = content.join(", ");
	let elem = $(`<div>${displayName}: ${content}${unit}</div>`);
	if (gridArea.length > 0) {
		elem.attr("style", "grid-area: " + gridArea);
	}
	parentElem.append(elem);
}

function createAttackDisplayElem(key, parentElem) {
	let elem = $("<div></div>");
	let attack = stats.attacks[key];
	let bab = val(stats.BAB);

	let atkBonus = sumBonus("ATK") + bab + (attack.toHit||0);
	let dmgBonus = sumBonus("DMG") + (attack.toDmg||0);

	let extra_attacks = sumBonus("HASTE");
	
	if (attack.type.includes("ranged")) {
		atkBonus += STAT_MOD(stats.totalDEX) + sumBonus("RANGED_ATK");
		dmgBonus += sumBonus("RANGED_DMG");
		if (sumBonus("RANGED_HASTE") > 0) {
			extra_attacks += 1;
		}
	}
	if (attack.type.includes("bow")) {
		atkBonus += sumBonus("BOW_ATK");
		dmgBonus += sumBonus("BOW_DMG");
	}
	if (attack.type.includes("melee")) {
		atkBonus += STAT_MOD(stats.totalSTR);
		dmgBonus += STAT_MOD(stats.totalSTR);
	}

	let iteratives = "";

	for (let i = -5; bab + i >= 0; i -= 5) {
		iteratives += "/" +(atkBonus+i);
	}
	for (let i = 0; i < extra_attacks; ++i) {
		iteratives = "/" + atkBonus + iteratives;
	}

	elem.append("Attack: " + key + " Damage: " + attack.dice +
		"+" + dmgBonus + " " + (attack.extra||"") +
		" | toHit:" + atkBonus + iteratives);
	parentElem.append(elem);
}

function createSwitchElem(toggle, parentElem) {
	let toggleMapping = {
		"on": "&#9745;",
		"off": "&#9744;"
	};
	let switchElem = $(`<div>${toggleMapping[toggle.state]} ${toggle.source}</div>`);

	switchElem.click(function() {
		switch(toggle.state) {
			case "on": toggle.state = "off"; break;
			case "off": toggle.state = "on"; break;
		}
		refreshAll();
	});

	parentElem.append(switchElem);
}

function createSkillsTable() {
	let tableElem = $("<table></table>");
	for (let skill in stats.skills) {
		let bonus = stats.skills[skill];
		tableElem.append("<tr><td>" +
			skillNameMapping(skill) + "</td><td>" +
			bonus + "</td></tr>");
	}
	return tableElem;
}

function skillNameMapping(from) {
	let to = from.replace(/./, x => x.toUpperCase()).replace(/_/g, " ");
	to = to.replace(/(Knowledge|Craft|Perform|Profession) (.*)/, "$1 ($2)");
	to = to.replace(/ [^(]/g, x => x.toUpperCase()).replace("Of", "of");
	return to;
}

function sumValues(obj) {
	let result = 0;
	for (let i in obj) {
		result += obj[i];
	}

	return result;
}

function findSpellsForSpellSlot(slot) {
	let allSpellNames = Object.keys(stats.spells);
	let filtered = allSpellNames.filter(
		x => (
			stats.spells[x].level <= slot.level &&
			(stats.spells[x].slot == undefined || stats.spells[x].slot == slot.accept)));

	let result = {}
	filtered.map(x => result[x] = stats.spells[x]);
	return result;
}

function findSlotForPreparedSpell(preparedSpell) {
	return stats.spellslots.filter(
		x => (
			x.name == "" &&
			x.level == preparedSpell.slotlevel &&
			x.accept == preparedSpell.slot));
}