"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XPService = void 0;
class XPService {
    constructor(context, baseXp) {
        this.context = context;
        this.baseXp = baseXp;
        this.xp = context.globalState.get("xp", 0);
        this.level = context.globalState.get("level", 1);
        // Initial absolute target as per original: 2 * BASE_XP
        const storedNext = context.globalState.get("xpNextAbs");
        this.xpNextAbs = storedNext ?? 2 * this.baseXp;
        // Ensure monotonic if base changed
        if (this.xpNextAbs < this.xp) {
            this.xpNextAbs = this.xp + Math.round((this.baseXp * this.level) / 10) * 10;
        }
    }
    get progress() {
        const max = this.xpNextAbs - this.xpStartOfLevelInternal();
        return { current: this.xp - this.xpStartOfLevelInternal(), max };
    }
    xpStartOfLevelInternal() {
        // We store absolute xp; to derive start-of-level, deduce from xpNextAbs and base formula.
        // Simplify: track last level-up xp in globalState too; fallback to 0 for level 1.
        return this.context.globalState.get("xpLevelStart", 0);
    }
    get xpStartOfLevel() {
        return this.xpStartOfLevelInternal();
    }
    setXpStartOfLevel(v) {
        void this.context.globalState.update("xpLevelStart", v);
    }
    addXp(n) {
        this.xp += n;
        let leveledUp = false;
        if (this.xp >= this.xpNextAbs) {
            this.level += 1;
            this.setXpStartOfLevel(this.xp);
            // xpNext = xp + round(BASE_XP * level / 10.0) * 10
            this.xpNextAbs = this.xp + Math.round((this.baseXp * this.level) / 10) * 10;
            leveledUp = true;
        }
        this.persist();
        return leveledUp;
    }
    reset() {
        this.level = 1;
        this.xp = 0;
        this.setXpStartOfLevel(0);
        this.xpNextAbs = 2 * this.baseXp;
        this.persist();
    }
    setBaseXp(base) {
        this.baseXp = base;
        // Recompute next target relative to current xp and level
        if (this.level <= 1 && this.xp === 0) {
            this.xpNextAbs = 2 * this.baseXp;
        }
        else if (this.xp >= this.xpNextAbs) {
            this.xpNextAbs = this.xp + Math.round((this.baseXp * this.level) / 10) * 10;
        }
        this.persist();
    }
    persist() {
        void this.context.globalState.update("xp", this.xp);
        void this.context.globalState.update("level", this.level);
        void this.context.globalState.update("xpNextAbs", this.xpNextAbs);
    }
}
exports.XPService = XPService;
//# sourceMappingURL=XPService.js.map