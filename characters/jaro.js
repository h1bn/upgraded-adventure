characterSheet = {
	name: "Jaro Imaradi",
	race: "Human",
	classes: "Witch 8",
	HD: [6,1,1,1,1,1,1,1],
	clvl: 8,
	STR: 8,
	DEX: 14,
	CON: 14,
	INT: 18,
	WIS: 8,
	CHA: 12,
	BAB: "BAB_1_2(stats.clvl)",
	FOR: "SAVE_POOR(stats.clvl)",
	REF: "SAVE_POOR(stats.clvl)",
	WIL: "SAVE_GOOD(stats.clvl)",
	skillsPerLevel: 2,
	skillranks: {
		spellcraft: 8,
	},
	items: [],
	innate: [
		{
			name: "Ability Score Racial Traits",
			bonus: {
				data: ["INT+2"],
				type: "racial"
			}
		},
		{
			name: "Ability Score Increase (Levels 4,8)",
			bonus: {
				data: ["INT+1", "INT+1"],
				type: ""
			}
		},
		{
			name: "Improved Initiative (Feat 1)",
			bonus: {
				data: ["INI+4"],
				type: ""
			}
		},
		{name: "Improved Familiar (Feat 7)"},
		{
			name: "Vagabond Child (Regional Trait)",
			bonus: {
				data: ["cs_disable_device +3", "disable_device +1"],
				type: "trait"
			}
		},
		{
			name: "World Traveler (Human Race Trait)",
			bonus: {
				data: ["cs_diplomacy +3", "diplomacy +1"],
				type: "trait"
			}
		},
		{
			name: "Fast Talker (Social Trait)",
			bonus: {
				data: ["cs_bluff +3", "bluff +1"],
				type: "trait"
			}
		}
	],
	temporary: [],
	attacks: {
		ranged_touch: {dice: "", source: "", type: "ranged touch"}
	}
}