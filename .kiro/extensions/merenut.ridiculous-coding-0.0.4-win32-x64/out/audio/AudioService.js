"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioService = void 0;
const NativeHelperBackend_1 = require("./NativeHelperBackend");
class AudioService {
    constructor(context, panelProvider) {
        this.context = context;
        this.panelProvider = panelProvider;
        this.audioBackendState = {
            configured: "auto",
            active: "webview",
            note: "Webview audio is active. Click the panel to unlock sound."
        };
    }
    async configure(configured) {
        this.audioBackendState = await this.resolveAudioBackend(configured);
        this.panelProvider.setAudioBackendState(this.audioBackendState);
    }
    play(event) {
        if (this.audioBackendState.active === "nativeHelper") {
            const played = this.nativeHelper?.play(event) ?? false;
            if (played) {
                return;
            }
        }
        this.panelProvider.post(this.toPanelMessage(event));
    }
    getAudioBackendState() {
        return this.audioBackendState;
    }
    dispose() {
        this.nativeHelper?.dispose();
    }
    async resolveAudioBackend(configured) {
        if (configured === "webview") {
            this.disposeNativeHelper();
            return {
                configured,
                active: "webview",
                note: "Webview audio is active. Click the panel to unlock sound."
            };
        }
        const nativeState = await this.tryEnableNativeHelper(configured);
        if (nativeState) {
            return nativeState;
        }
        return {
            configured,
            active: "webview",
            note: configured === "nativeHelper"
                ? "Native helper audio is unavailable. Falling back to webview audio, which still needs a panel click to unlock."
                : "Native helper audio is unavailable. Auto mode is using webview audio, which needs a panel click to unlock."
        };
    }
    async tryEnableNativeHelper(configured) {
        this.disposeNativeHelper();
        this.nativeHelper = new NativeHelperBackend_1.NativeHelperBackend(this.context);
        const result = await this.nativeHelper.start();
        if (!result.ok) {
            return undefined;
        }
        return {
            configured,
            active: "nativeHelper",
            note: "Native helper audio is active in this local desktop session."
        };
    }
    disposeNativeHelper() {
        this.nativeHelper?.dispose();
        this.nativeHelper = undefined;
    }
    toPanelMessage(event) {
        switch (event.type) {
            case "blip":
                return { type: "blip", enabled: true, pitch: event.pitch };
            case "boom":
                return { type: "boom", enabled: true };
            case "fireworks":
                return { type: "fireworks", enabled: true };
        }
    }
}
exports.AudioService = AudioService;
//# sourceMappingURL=AudioService.js.map